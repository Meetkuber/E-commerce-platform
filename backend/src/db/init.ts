/**
 * Database Initialization Script
 * Creates the database, tables, and seed data
 * Run: npx ts-node backend/src/db/init.ts
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function initDatabase() {
    console.log('🔄 Initializing database...\n');

    // Connect WITHOUT specifying a database first (to create it)
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true,
    });

    try {
        // Read and execute schema
        console.log('📋 Running schema.sql...');
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');
        await connection.query(schema);
        console.log('✅ Schema created successfully!\n');

        // Read and execute seed data
        console.log('🌱 Running seed.sql...');
        const seedPath = path.join(__dirname, 'seed.sql');
        const seed = fs.readFileSync(seedPath, 'utf-8');
        await connection.query(seed);
        console.log('✅ Seed data inserted successfully!\n');

        // Verify
        await connection.query('USE ecommerce_platform');
        const [tables] = await connection.query('SHOW TABLES');
        console.log(`📊 Tables created: ${(tables as any[]).length}`);

        const [products] = await connection.query('SELECT COUNT(*) as count FROM products');
        console.log(`📦 Products seeded: ${(products as any[])[0].count}`);

        const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
        console.log(`👥 Users seeded: ${(users as any[])[0].count}`);

        const [categories] = await connection.query('SELECT COUNT(*) as count FROM categories');
        console.log(`📂 Categories seeded: ${(categories as any[])[0].count}`);

        console.log('\n🎉 Database initialization complete!');
        console.log('   You can now start the server with: npm run dev');
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            console.log('⚠️  Seed data already exists (duplicate entries). Skipping...');
            console.log('✅ Database is ready!');
        } else {
            console.error('❌ Error:', error.message);
            throw error;
        }
    } finally {
        await connection.end();
    }
}

initDatabase().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
