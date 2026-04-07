import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ProductService } from '../services/product.service';
import pool from '../db/connection';
import { RowDataPacket } from 'mysql2';

export class ProductController {
    static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const filters = {
                category: req.query.category as string,
                minPrice: req.query.min_price ? parseFloat(req.query.min_price as string) : undefined,
                maxPrice: req.query.max_price ? parseFloat(req.query.max_price as string) : undefined,
                search: req.query.search as string,
                vendorId: req.query.vendor_id ? parseInt(req.query.vendor_id as string) : undefined,
                sortBy: req.query.sort as string,
                page: req.query.page ? parseInt(req.query.page as string) : 1,
                limit: req.query.limit ? parseInt(req.query.limit as string) : 12,
            };

            const result = await ProductService.getAll(filters);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const product = await ProductService.getById(parseInt(req.params.id));
            res.json(product);
        } catch (error) {
            next(error);
        }
    }

    static async create(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) { res.status(401).json({ error: 'Not authenticated.' }); return; }

            let vendorId: number;

            if (req.user.role === 'admin') {
                // Admin can create products for any vendor (vendor_id passed in body)
                if (req.body.vendor_id) {
                    vendorId = parseInt(req.body.vendor_id);
                } else {
                    // If admin doesn't specify vendor, use the first vendor or error
                    res.status(400).json({ error: 'Admin must specify a vendor_id when creating products.' });
                    return;
                }
            } else {
                // Vendor: get their own vendor ID
                const [vendorRows] = await pool.execute<RowDataPacket[]>(
                    'SELECT id FROM vendors WHERE user_id = ?',
                    [req.user.id]
                );

                if (vendorRows.length === 0) {
                    res.status(403).json({ error: 'Vendor profile not found.' });
                    return;
                }
                vendorId = vendorRows[0].id;
            }

            const data = req.body;

            // Handle file upload — use Cloudinary URL if available, else local path
            if (req.file) {
                data.image = (req.file as any).cloudinaryUrl || `/uploads/${req.file.filename}`;
            }

            const product = await ProductService.create(vendorId, data);
            res.status(201).json(product);
        } catch (error) {
            next(error);
        }
    }

    static async update(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) { res.status(401).json({ error: 'Not authenticated.' }); return; }

            const isAdmin = req.user.role === 'admin';
            let vendorId: number | null = null;

            if (!isAdmin) {
                // Vendor: get their own vendor ID for ownership check
                const [vendorRows] = await pool.execute<RowDataPacket[]>(
                    'SELECT id FROM vendors WHERE user_id = ?',
                    [req.user.id]
                );

                if (vendorRows.length === 0) {
                    res.status(403).json({ error: 'Vendor profile not found.' });
                    return;
                }
                vendorId = vendorRows[0].id;
            }

            const data = req.body;
            if (req.file) {
                data.image = (req.file as any).cloudinaryUrl || `/uploads/${req.file.filename}`;
            }

            const product = await ProductService.update(
                parseInt(req.params.id),
                vendorId,
                data,
                isAdmin
            );
            res.json(product);
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) { res.status(401).json({ error: 'Not authenticated.' }); return; }

            const isAdmin = req.user.role === 'admin';
            let vendorId: number | null = null;

            if (!isAdmin) {
                const [vendorRows] = await pool.execute<RowDataPacket[]>(
                    'SELECT id FROM vendors WHERE user_id = ?',
                    [req.user.id]
                );

                if (vendorRows.length === 0) {
                    res.status(403).json({ error: 'Vendor profile not found.' });
                    return;
                }
                vendorId = vendorRows[0].id;
            }

            const result = await ProductService.delete(parseInt(req.params.id), vendorId, isAdmin);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async getCategories(_req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const categories = await ProductService.getCategories();
            res.json(categories);
        } catch (error) {
            next(error);
        }
    }

    static async getFeatured(_req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const products = await ProductService.getFeatured();
            res.json(products);
        } catch (error) {
            next(error);
        }
    }
}
