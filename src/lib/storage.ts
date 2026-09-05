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

  // 1. PRIMARY: BACKBLAZE B2 NATIVE OBJECT STORAGE DISPATCH (10 GB FREE TIER)
  const b2KeyId = process.env.B2_APPLICATION_KEY_ID || process.env.B2_KEY_ID || process.env.B2_ACC4_ACCESS_KEY || process.env.BACKBLAZE_KEY_ID;
  const b2AppKey = process.env.B2_APPLICATION_KEY || process.env.B2_ACC4_SECRET_KEY || process.env.BACKBLAZE_APPLICATION_KEY;
  const b2BucketId = process.env.B2_BUCKET_ID || process.env.BACKBLAZE_BUCKET_ID;
  const b2BucketName = process.env.B2_ACC4_BUCKET || process.env.BACKBLAZE_BUCKET || process.env.B2_BUCKET || 'resumes';

  if (b2KeyId && b2AppKey) {
    try {
      const basicAuth = `Basic ${Buffer.from(`${b2KeyId}:${b2AppKey}`).toString('base64')}`;
      const authRes = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
        headers: { Authorization: basicAuth },
      });

      if (authRes.ok) {
        const authData = await authRes.json();
        const { apiUrl, authorizationToken, downloadUrl, allowed } = authData;
        const targetBucketId = b2BucketId || (allowed ? allowed.bucketId : null);

        if (targetBucketId) {
          const uploadUrlRes = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
            method: 'POST',
            headers: {
              Authorization: authorizationToken,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bucketId: targetBucketId }),
          });

          if (uploadUrlRes.ok) {
            const { uploadUrl, authorizationToken: uploadAuthToken } = await uploadUrlRes.json();
            const crypto = await import('crypto');
            const sha1Hash = crypto.createHash('sha1').update(buffer).digest('hex');

            const uploadFileRes = await fetch(uploadUrl, {
              method: 'POST',
              headers: {
                Authorization: uploadAuthToken,
                'X-Bz-File-Name': encodeURIComponent(uniqueFilename),
                'Content-Type': mimeType,
                'Content-Length': buffer.length.toString(),
                'X-Bz-Content-Sha1': sha1Hash,
              },
              body: new Uint8Array(buffer),
            });

            if (uploadFileRes.ok) {
              return `${downloadUrl}/file/${b2BucketName}/${uniqueFilename}`;
            }
          }
        }
      }
    } catch (b2NativeErr) {
      console.error('Backblaze B2 Native Storage Exception:', b2NativeErr);
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
