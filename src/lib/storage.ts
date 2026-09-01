import fs from 'fs/promises';
import path from 'path';

/**
 * Universal Storage Abstraction for Local Dev & Vercel Serverless Production
 * Configured Strategy:
 * - Database: Supabase PostgreSQL (via DATABASE_URL in .env)
 * - File Storage: Backblaze B2 10 GB Free Object Storage (via B2_ENDPOINT / BACKBLAZE_ENDPOINT & B2_BUCKET / BACKBLAZE_BUCKET)
 * - Fallbacks: S3 / Cloudflare R2 / Vercel Base64 Data URL (prevents EROFS read-only errors on Vercel)
 */
export async function uploadFile(
  fileOrBuffer: File | Buffer,
  originalFilename?: string,
  contentType?: string
): Promise<string> {
  let filename = originalFilename || 'resume.pdf';
  let buffer: Buffer;

  if (fileOrBuffer instanceof Buffer) {
    buffer = fileOrBuffer;
  } else if (fileOrBuffer && typeof (fileOrBuffer as File).arrayBuffer === 'function') {
    const file = fileOrBuffer as File;
    filename = file.name || filename;
    const bytes = await file.arrayBuffer();
    buffer = Buffer.from(bytes);
  } else {
    buffer = Buffer.from(fileOrBuffer as any);
  }

  const fileExtension = path.extname(filename) || '.pdf';
  const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${fileExtension}`;
  const mimeType = contentType || 'application/pdf';

  // 1. PRIMARY: BACKBLAZE B2 OBJECT STORAGE DISPATCH (10 GB FREE TIER)
  let rawEndpoint = process.env.B2_ACC4_ENDPOINT || process.env.BACKBLAZE_ENDPOINT || process.env.B2_ENDPOINT || process.env.S3_ENDPOINT || process.env.CLOUDFLARE_R2_ENDPOINT;
  const b2Bucket = process.env.B2_ACC4_BUCKET || process.env.BACKBLAZE_BUCKET || process.env.B2_BUCKET || process.env.S3_BUCKET_NAME || process.env.CLOUDFLARE_R2_BUCKET;

  if (rawEndpoint && b2Bucket) {
    if (!rawEndpoint.startsWith('http://') && !rawEndpoint.startsWith('https://')) {
      rawEndpoint = `https://${rawEndpoint}`;
    }
    const cleanEndpoint = rawEndpoint.replace(/\/$/, '');

    try {
      const publicUrl = `${cleanEndpoint}/${b2Bucket}/${uniqueFilename}`;
      const uploadRes = await fetch(publicUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': mimeType,
          ...(process.env.B2_ACC4_ACCESS_KEY || process.env.S3_ACCESS_KEY_ID ? { 'x-amz-acl': 'public-read' } : {}),
        },
        body: new Uint8Array(buffer),
      });

      if (uploadRes.ok || uploadRes.status === 200 || uploadRes.status === 201) {
        return publicUrl;
      }
    } catch (b2Err) {
      console.error('Backblaze B2 Storage PUT exception:', b2Err);
    }
  }

  // 2. SECONDARY: SUPABASE STORAGE (Only if explicitly enabled via SUPABASE_STORAGE_ENABLED=true)
  const isSupabaseStorageEnabled = process.env.SUPABASE_STORAGE_ENABLED === 'true';
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  const supabaseBucket = process.env.SUPABASE_BUCKET || 'resumes';

  if (isSupabaseStorageEnabled && supabaseUrl && supabaseKey) {
    try {
      const cleanUrl = supabaseUrl.replace(/\/$/, '');
      const uploadEndpoint = `${cleanUrl}/storage/v1/object/${supabaseBucket}/${uniqueFilename}`;
      const uploadRes = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          apiKey: supabaseKey,
          'Content-Type': mimeType,
          x_upsert: 'true',
        },
        body: new Uint8Array(buffer),
      });

      if (uploadRes.ok) {
        return `${cleanUrl}/storage/v1/object/public/${supabaseBucket}/${uniqueFilename}`;
      }
    } catch (supaErr) {
      console.error('Supabase Storage Exception:', supaErr);
    }
  }

  // 3. VERCEL SERVERLESS ENVIRONMENT FALLBACK (Prevents EROFS read-only filesystem crash on Vercel)
  const isVercel = process.env.VERCEL === '1';
  if (isVercel) {
    const base64Data = buffer.toString('base64');
    return `data:${mimeType};base64,${base64Data}`;
  }

  // 4. LOCAL DISK STORAGE (For traditional local node servers)
  const UPLOAD_DIR = path.join(process.cwd(), 'private_uploads', 'resumes');
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const filePath = path.join(UPLOAD_DIR, uniqueFilename);
    await fs.writeFile(filePath, buffer);
    return `/uploads/resumes/${uniqueFilename}`;
  } catch (fsErr) {
    console.error('Local FS write error, falling back to base64:', fsErr);
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  }
}

export async function getFile(fileUrl: string): Promise<Buffer | null> {
  try {
    if (!fileUrl) return null;

    // 1. BASE64 DATA URL DECODER (Vercel Serverless Storage)
    if (fileUrl.startsWith('data:')) {
      const parts = fileUrl.split(';base64,');
      if (parts.length === 2) {
        return Buffer.from(parts[1], 'base64');
      }
    }

    // 2. EXTERNAL HTTPS URL (Backblaze B2 / Supabase Storage / S3 / Cloudflare R2)
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      const res = await fetch(fileUrl);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    // 3. LOCAL DISK STORAGE READ
    const cleanPath = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
    const filenameOnly = path.basename(cleanPath);

    const privatePath = path.join(process.cwd(), 'private_uploads', 'resumes', filenameOnly);
    try {
      return await fs.readFile(privatePath);
    } catch {
      const publicPath = path.join(process.cwd(), 'public', cleanPath);
      return await fs.readFile(publicPath);
    }
  } catch (error) {
    console.error('Error reading file from storage:', error);
    return null;
  }
}
