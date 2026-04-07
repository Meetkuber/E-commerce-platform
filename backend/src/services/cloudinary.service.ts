/**
 * Cloudinary Service — Image Upload & Management
 */

import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
    api_key: process.env.CLOUDINARY_API_KEY || '',
    api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

export class CloudinaryService {
    /**
     * Upload a file buffer to Cloudinary
     */
    static async upload(
        fileBuffer: Buffer,
        folder: string = 'products'
    ): Promise<{ url: string; publicId: string }> {
        return new Promise((resolve, reject) => {
            cloudinary.uploader
                .upload_stream(
                    {
                        folder: `nexmart/${folder}`,
                        resource_type: 'image',
                        transformation: [
                            { width: 800, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
                        ],
                    },
                    (error, result: UploadApiResponse | undefined) => {
                        if (error || !result) {
                            console.error('Cloudinary upload error:', error);
                            reject(error || new Error('Upload failed'));
                        } else {
                            resolve({
                                url: result.secure_url,
                                publicId: result.public_id,
                            });
                        }
                    }
                )
                .end(fileBuffer);
        });
    }

    /**
     * Upload from a local file path
     */
    static async uploadFromPath(
        filePath: string,
        folder: string = 'products'
    ): Promise<{ url: string; publicId: string }> {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: `nexmart/${folder}`,
            resource_type: 'image',
            transformation: [
                { width: 800, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
            ],
        });

        return {
            url: result.secure_url,
            publicId: result.public_id,
        };
    }

    /**
     * Delete an image from Cloudinary
     */
    static async delete(publicId: string): Promise<void> {
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            console.error('Cloudinary delete error:', error);
        }
    }

    /**
     * Generate an optimized URL with transformations
     */
    static getOptimizedUrl(publicId: string, width: number = 400, height: number = 300): string {
        return cloudinary.url(publicId, {
            width,
            height,
            crop: 'fill',
            quality: 'auto',
            fetch_format: 'auto',
            secure: true,
        });
    }

    /**
     * Check if Cloudinary is configured
     */
    static isConfigured(): boolean {
        return !!(
            process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET
        );
    }
}

export default cloudinary;
