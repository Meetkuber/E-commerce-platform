/**
 * Upload Middleware — Cloudinary Integration
 * Falls back to local disk storage if Cloudinary is not configured
 */

import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { CloudinaryService } from '../services/cloudinary.service';

// Use memory storage when Cloudinary is configured,
// disk storage as fallback
const storage = multer.diskStorage({
    destination: (_req: Request, _file: Express.Multer.File, cb) => {
        cb(null, path.join(__dirname, '../../../uploads'));
    },
    filename: (_req: Request, file: Express.Multer.File, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
    },
});

/**
 * Middleware to upload the file buffer to Cloudinary after multer processes it
 */
export function uploadToCloudinary(folder: string = 'products') {
    return async (req: Request, _res: Response, next: NextFunction) => {
        if (!req.file || !CloudinaryService.isConfigured()) {
            return next();
        }

        try {
            // req.file.path is available with diskStorage
            const result = await CloudinaryService.uploadFromPath(req.file.path, folder);
            // Attach the Cloudinary URL to the file object
            (req.file as any).cloudinaryUrl = result.url;
            (req.file as any).cloudinaryPublicId = result.publicId;
            next();
        } catch (error) {
            console.error('Cloudinary upload failed:', error);
            next(error);
        }
    };
}
