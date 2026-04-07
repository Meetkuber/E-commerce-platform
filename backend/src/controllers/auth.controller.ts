import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AuthService } from '../services/auth.service';

export class AuthController {
    static async register(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { name, email, password, role } = req.body;

            if (!name || !email || !password) {
                res.status(400).json({ error: 'Name, email, and password are required.' });
                return;
            }

            if (password.length < 6) {
                res.status(400).json({ error: 'Password must be at least 6 characters.' });
                return;
            }

            // Only customer and vendor roles can be registered. Admin accounts are created via seed only.
            const validRoles = ['customer', 'vendor'];
            if (role === 'admin') {
                res.status(403).json({ error: 'Admin accounts cannot be registered publicly.' });
                return;
            }
            const userRole = validRoles.includes(role) ? role : 'customer';

            console.log(">> Registering user:", email);
            const result = await AuthService.register(name, email, password, userRole);
            console.log(">> Reg result:", result.user.email);
            res.status(201).json(result);
            console.log(">> Response sent!");
        } catch (error) {
            next(error);
        }
    }

    static async login(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                res.status(400).json({ error: 'Email and password are required.' });
                return;
            }

            const result = await AuthService.login(email, password);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async getMe(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated.' });
                return;
            }

            const user = await AuthService.getMe(req.user.id);
            res.json(user);
        } catch (error) {
            next(error);
        }
    }
}
