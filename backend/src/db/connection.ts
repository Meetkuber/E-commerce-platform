import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ecommerce_platform',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
});

// Test connection on startup
export async function testConnection(): Promise<void> {
    try {
        const connection = await pool.getConnection();
        console.log('✅ MySQL connected successfully');
        connection.release();
    } catch (error) {
        console.error('❌ MySQL connection failed:', error);
        process.exit(1);
    }
}

export default pool;
