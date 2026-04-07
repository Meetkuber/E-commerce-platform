import pool from '../db/connection';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { EmailService } from './email.service';

interface UserRow extends RowDataPacket {
    id: number;
    name: string;
    email: string;
    password: string;
    role: string;
    avatar: string | null;
    phone: string | null;
    address: string | null;
    coupon_code: string | null;
    created_at: Date;
}

export class AuthService {
    static generateCouponCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    static async register(name: string, email: string, password: string, role: string = 'customer') {
        const [existingUsers] = await pool.execute<RowDataPacket[]>(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            throw Object.assign(new Error('An account with this email already exists.'), { statusCode: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const couponCode = this.generateCouponCode();

        const [result] = await pool.execute<ResultSetHeader>(
            'INSERT INTO users (name, email, password, role, coupon_code) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, role, couponCode]
        );

        const userId = result.insertId;

        // If registering as vendor, create vendor profile
        if (role === 'vendor') {
            await pool.execute<ResultSetHeader>(
                'INSERT INTO vendors (user_id, store_name, description) VALUES (?, ?, ?)',
                [userId, `${name}'s Store`, 'Welcome to my store!']
            );
        }

        const token = this.generateToken(userId, email, role);

        // Send welcome email (fire and forget to prevent hanging)
        EmailService.sendWelcomeEmail(email, name, couponCode).catch(emailError => {
            console.error('Failed to send welcome email:', emailError);
        });

        if (role === 'vendor') {
            EmailService.sendVendorPolicyEmail(email, name).catch(emailError => {
                console.error('Failed to send vendor policy email:', emailError);
            });
        }

        return {
            user: { id: userId, name, email, role, coupon_code: couponCode },
            token,
        };
    }

    static async login(email: string, password: string) {
        const [rows] = await pool.execute<UserRow[]>(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (rows.length === 0) {
            throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401 });
        }

        const user = rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401 });
        }

        let couponCode = user.coupon_code;
        if (!couponCode) {
            couponCode = this.generateCouponCode();
            await pool.execute('UPDATE users SET coupon_code = ? WHERE id = ?', [couponCode, user.id]);
        }

        const token = this.generateToken(user.id, user.email, user.role);

        // Send login notification email (fire and forget to prevent hanging)
        if (user.role !== 'vendor') {
            EmailService.sendLoginNotification(user.email, user.name, couponCode).catch(emailError => {
                console.error('Failed to send login notification email:', emailError);
            });
        }

        if (user.role === 'vendor') {
            EmailService.sendVendorPolicyEmail(user.email, user.name).catch(emailError => {
                console.error('Failed to send vendor policy email:', emailError);
            });
        }

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                coupon_code: couponCode,
            },
            token,
        };
    }

    static async getMe(userId: number) {
        const [rows] = await pool.execute<UserRow[]>(
            'SELECT id, name, email, role, avatar, phone, address, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (rows.length === 0) {
            throw Object.assign(new Error('User not found.'), { statusCode: 404 });
        }

        const user = rows[0];

        // If vendor, attach vendor info
        if (user.role === 'vendor') {
            const [vendorRows] = await pool.execute<RowDataPacket[]>(
                'SELECT * FROM vendors WHERE user_id = ?',
                [userId]
            );
            return { ...user, vendor: vendorRows[0] || null };
        }

        return user;
    }

    private static generateToken(id: number, email: string, role: string): string {
        return jwt.sign(
            { id, email, role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
        );
    }
}
