/**
 * Migration: Update product images to use high-quality placeholder images
 * Run: npx ts-node backend/src/db/migrate-images.ts
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const productImages: Record<string, string> = {
    'Mac-ultra-15': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
    'gameforce-rtx-pro': 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&q=80',
    'ergotype-mechanical-keyboard': 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&q=80',
    'nexphone-15-pro-max': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
    'budgetking-a55': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80',
    'tabpro-12-4': 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80',
    'airbass-pro-x': 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=800&q=80',
    'studiomax-over-ear': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    'fitband-ultra': 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80',
    'luxwatch-series-9': 'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=800&q=80',
    'progamer-mouse-x1': 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&q=80',
};

async function migrateImages() {
    console.log('🔄 Migrating product images...\n');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'ecommerce_platform',
    });

    try {
        for (const [slug, imageUrl] of Object.entries(productImages)) {
            await connection.execute(
                'UPDATE products SET image = ? WHERE slug LIKE ?',
                [imageUrl, `${slug}%`]
            );
            console.log(`  ✅ ${slug} → updated`);
        }

        console.log('\n🎉 All product images migrated to Unsplash URLs!');
    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

migrateImages();
