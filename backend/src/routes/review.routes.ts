import { Router } from 'express';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { authenticate } from '../middleware/auth';
import pool from '../db/connection';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// Get reviews for a product
router.get('/product/:productId', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const productId = parseInt(req.params.productId);

        const [reviews] = await pool.execute<RowDataPacket[]>(
            `SELECT r.*, u.name as user_name, u.avatar
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.product_id = ?
             ORDER BY r.created_at DESC`,
            [productId]
        );

        // Aggregate ratings
        const [stats] = await pool.execute<RowDataPacket[]>(
            `SELECT 
                COUNT(*) as total_reviews,
                AVG(rating) as avg_rating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
             FROM reviews WHERE product_id = ?`,
            [productId]
        );

        res.json({ reviews, stats: stats[0] });
    } catch (error) {
        next(error);
    }
});

// Add review
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) { res.status(401).json({ error: 'Not authenticated.' }); return; }

        const { productId, rating, comment } = req.body;

        if (!productId || !rating || rating < 1 || rating > 5) {
            res.status(400).json({ error: 'Valid product ID and rating (1-5) are required.' });
            return;
        }

        await pool.execute<ResultSetHeader>(
            'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)',
            [req.user.id, productId, rating, comment || null]
        );

        // Update product rating
        const [avgRows] = await pool.execute<RowDataPacket[]>(
            'SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE product_id = ?',
            [productId]
        );

        await pool.execute(
            'UPDATE products SET rating = ?, review_count = ? WHERE id = ?',
            [avgRows[0].avg_rating, avgRows[0].review_count, productId]
        );

        res.status(201).json({ message: 'Review added successfully.' });
    } catch (error) {
        next(error);
    }
});

export default router;
