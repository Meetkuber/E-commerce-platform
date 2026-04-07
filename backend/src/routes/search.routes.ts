import { Router } from 'express';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../db/connection';
import { RowDataPacket } from 'mysql2';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const q = req.query.q as string || '';
        const category = req.query.category as string;
        const minPrice = req.query.min_price ? parseFloat(req.query.min_price as string) : undefined;
        const maxPrice = req.query.max_price ? parseFloat(req.query.max_price as string) : undefined;
        const sort = req.query.sort as string || 'relevance';
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 12;
        const offset = (page - 1) * limit;

        let query = `
            SELECT p.*, v.store_name, c.name as category_name
            FROM products p
            LEFT JOIN vendors v ON p.vendor_id = v.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = TRUE
        `;
        const params: any[] = [];

        if (q) {
            query += ' AND (MATCH(p.name, p.description) AGAINST(? IN BOOLEAN MODE) OR p.name LIKE ? OR p.description LIKE ?)';
            params.push(q, `%${q}%`, `%${q}%`);
        }

        if (category) {
            query += ' AND c.slug = ?';
            params.push(category);
        }

        if (minPrice !== undefined) {
            query += ' AND p.price >= ?';
            params.push(minPrice);
        }

        if (maxPrice !== undefined) {
            query += ' AND p.price <= ?';
            params.push(maxPrice);
        }

        // Count
        const countQuery = query.replace(/SELECT p\.\*, v\.store_name, c\.name as category_name/, 'SELECT COUNT(*) as total');
        const [countRows] = await pool.execute<RowDataPacket[]>(countQuery, params);
        const total = countRows[0].total;

        // Sort
        switch (sort) {
            case 'price_asc': query += ' ORDER BY p.price ASC'; break;
            case 'price_desc': query += ' ORDER BY p.price DESC'; break;
            case 'rating': query += ' ORDER BY p.rating DESC'; break;
            case 'newest': query += ' ORDER BY p.created_at DESC'; break;
            default: query += ' ORDER BY p.rating DESC, p.review_count DESC';
        }

        query += ' LIMIT ? OFFSET ?';
        params.push(String(limit), String(offset));

        const [rows] = await pool.execute<RowDataPacket[]>(query, params);

        res.json({
            products: rows.map((p: any) => ({
                ...p,
                features: (() => { try { return typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || []); } catch { return []; } })(),
            })),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
            query: q,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
