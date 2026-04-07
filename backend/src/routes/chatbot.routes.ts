import { Router } from 'express';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../db/connection';
import { RowDataPacket } from 'mysql2';

const router = Router();

// Rule-based chatbot for product finding
router.post('/ask', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { message } = req.body;

        if (!message) {
            res.status(400).json({ error: 'Message is required.' });
            return;
        }

        const input = message.toLowerCase();

        // Parse intent
        const parsed = parseUserMessage(input);

        // Build query
        let query = `
            SELECT p.*, v.store_name, c.name as category_name
            FROM products p
            LEFT JOIN vendors v ON p.vendor_id = v.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = TRUE
        `;
        const params: any[] = [];

        if (parsed.category) {
            query += ' AND (c.slug LIKE ? OR c.name LIKE ? OR p.name LIKE ?)';
            params.push(`%${parsed.category}%`, `%${parsed.category}%`, `%${parsed.category}%`);
        }

        if (parsed.maxPrice) {
            query += ' AND p.price <= ?';
            params.push(parsed.maxPrice);
        }

        if (parsed.minPrice) {
            query += ' AND p.price >= ?';
            params.push(parsed.minPrice);
        }

        if (parsed.keywords.length > 0) {
            const keywordConditions = parsed.keywords.map(() => '(p.name LIKE ? OR p.description LIKE ?)').join(' AND ');
            query += ` AND (${keywordConditions})`;
            parsed.keywords.forEach(kw => {
                params.push(`%${kw}%`, `%${kw}%`);
            });
        }

        query += ' ORDER BY p.rating DESC LIMIT 5';

        const [rows] = await pool.execute<RowDataPacket[]>(query, params);

        // Generate response
        let response = '';
        if (rows.length === 0) {
            response = "I couldn't find any products matching your criteria. Try different keywords or a broader price range!";
        } else {
            response = `I found ${rows.length} product${rows.length > 1 ? 's' : ''} for you! Here are my top recommendations:`;
        }

        res.json({
            reply: response,
            products: rows.map((p: any) => {
                let parsedFeatures = [];
                try {
                    parsedFeatures = typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || []);
                } catch (e) {
                    console.error('Failed to parse features for product', p.id);
                }
                return {
                    ...p,
                    features: parsedFeatures,
                };
            }),
            parsed,
        });
    } catch (error) {
        next(error);
    }
});

function parseUserMessage(input: string) {
    const result: {
        category: string | null;
        maxPrice: number | null;
        minPrice: number | null;
        keywords: string[];
    } = {
        category: null,
        maxPrice: null,
        minPrice: null,
        keywords: [],
    };

    // Category detection
    const categories: Record<string, string[]> = {
        'laptops': ['laptop', 'laptops', 'notebook', 'macbook', 'chromebook'],
        'smartphones': ['phone', 'phones', 'smartphone', 'mobile', 'iphone', 'android'],
        'headphones': ['headphone', 'headphones', 'earbuds', 'earphone', 'earphones', 'airpods', 'audio'],
        'accessories': ['keyboard', 'mouse', 'cable', 'charger', 'adapter', 'accessory', 'accessories'],
        'tablets': ['tablet', 'tablets', 'ipad'],
        'smartwatches': ['watch', 'watches', 'smartwatch', 'fitband', 'fitness band', 'wearable'],
        'gaming': ['gaming', 'gamer', 'game', 'rgb', 'controller'],
        'cameras': ['camera', 'cameras', 'dslr', 'webcam'],
    };

    for (const [cat, keywords] of Object.entries(categories)) {
        for (const kw of keywords) {
            if (input.includes(kw)) {
                result.category = cat;
                break;
            }
        }
        if (result.category) break;
    }

    // Price extraction
    const pricePatterns = [
        /under\s*(?:rs\.?|₹|inr)?\s*(\d+[\d,]*)/i,
        /below\s*(?:rs\.?|₹|inr)?\s*(\d+[\d,]*)/i,
        /less\s+than\s*(?:rs\.?|₹|inr)?\s*(\d+[\d,]*)/i,
        /(?:rs\.?|₹|inr)\s*(\d+[\d,]*)/i,
        /(\d+[\d,]*)\s*(?:rs|₹|inr|rupees)/i,
        /budget\s*(?:of|is)?\s*(?:rs\.?|₹|inr)?\s*(\d+[\d,]*)/i,
    ];

    for (const pattern of pricePatterns) {
        const match = input.match(pattern);
        if (match) {
            result.maxPrice = parseFloat(match[1].replace(/,/g, ''));
            break;
        }
    }

    const abovePatterns = [
        /above\s*(?:rs\.?|₹|inr)?\s*(\d+[\d,]*)/i,
        /more\s+than\s*(?:rs\.?|₹|inr)?\s*(\d+[\d,]*)/i,
        /over\s*(?:rs\.?|₹|inr)?\s*(\d+[\d,]*)/i,
    ];

    for (const pattern of abovePatterns) {
        const match = input.match(pattern);
        if (match) {
            result.minPrice = parseFloat(match[1].replace(/,/g, ''));
            break;
        }
    }

    // Feature keywords
    const featureKeywords = ['waterproof', 'wireless', 'bluetooth', 'noise cancelling', 'anc',
        'gaming', 'professional', 'portable', 'lightweight', 'fast charging',
        'amoled', 'oled', 'hdr', '4k', '5g', 'mechanical', 'rgb'];

    for (const kw of featureKeywords) {
        if (input.includes(kw)) {
            result.keywords.push(kw);
        }
    }

    return result;
}

export default router;
