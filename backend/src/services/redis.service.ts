/**
 * Redis Service — Caching Layer
 * Provides caching for products, categories, and search results
 */

import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

class RedisService {
    private client: Redis | null = null;
    private isConnected: boolean = false;

    constructor() {
        this.connect();
    }

    private connect() {
        try {
            this.client = new Redis({
                host: process.env.REDIS_HOST || '127.0.0.1',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                password: process.env.REDIS_PASSWORD || undefined,
                db: parseInt(process.env.REDIS_DB || '0'),
                maxRetriesPerRequest: 3,
                retryStrategy: (times: number) => {
                    if (times > 3) {
                        console.warn('⚠️  Redis: Max retries reached. Running without cache.');
                        return null; // Stop retrying
                    }
                    return Math.min(times * 200, 2000);
                },
                lazyConnect: true,
            });

            this.client.on('connect', () => {
                this.isConnected = true;
                console.log('✅ Redis connected successfully');
            });

            this.client.on('error', (err) => {
                this.isConnected = false;
                if (err.message.includes('ECONNREFUSED')) {
                    console.warn('⚠️  Redis not available. Running without cache.');
                } else {
                    console.error('Redis error:', err.message);
                }
            });

            this.client.on('close', () => {
                this.isConnected = false;
            });

            // Attempt connection (non-blocking)
            this.client.connect().catch(() => {
                this.isConnected = false;
            });
        } catch {
            console.warn('⚠️  Redis initialization failed. Running without cache.');
            this.isConnected = false;
        }
    }

    /**
     * Get a cached value by key
     */
    async get<T>(key: string): Promise<T | null> {
        if (!this.isConnected || !this.client) return null;

        try {
            const data = await this.client.get(key);
            if (data) {
                return JSON.parse(data) as T;
            }
            return null;
        } catch {
            return null;
        }
    }

    /**
     * Set a value in cache with optional TTL (seconds)
     */
    async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
        if (!this.isConnected || !this.client) return;

        try {
            const serialized = JSON.stringify(value);
            await this.client.setex(key, ttlSeconds, serialized);
        } catch {
            // Silently fail — caching is non-critical
        }
    }

    /**
     * Delete a specific cache key
     */
    async del(key: string): Promise<void> {
        if (!this.isConnected || !this.client) return;

        try {
            await this.client.del(key);
        } catch {
            // Silently fail
        }
    }

    /**
     * Delete all keys matching a pattern (e.g., "products:*")
     */
    async invalidatePattern(pattern: string): Promise<void> {
        if (!this.isConnected || !this.client) return;

        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
            }
        } catch {
            // Silently fail
        }
    }

    /**
     * Invalidate all product-related caches
     */
    async invalidateProducts(): Promise<void> {
        await this.invalidatePattern('products:*');
        await this.invalidatePattern('featured:*');
        await this.invalidatePattern('categories:*');
        await this.invalidatePattern('search:*');
    }

    /**
     * Check if Redis is available
     */
    isAvailable(): boolean {
        return this.isConnected;
    }
}

// Singleton instance
const redis = new RedisService();
export default redis;
