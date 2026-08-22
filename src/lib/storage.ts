import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'resumes');

export async function uploadFile(file: File): Promise<string> {
    if (process.env.NODE_ENV !== 'production' || !process.env.R2_ACCESS_KEY_ID) {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });

        const fileExtension = path.extname(file.name);
        const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${fileExtension}`;
        const filePath = path.join(UPLOAD_DIR, uniqueFilename);

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await fs.writeFile(filePath, buffer);

        return `/uploads/resumes/${uniqueFilename}`;
    }

    throw new Error('R2 Upload not configured yet');
}
