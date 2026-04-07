import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// All admin routes require admin role
router.get('/stats', authenticate, requireRole('admin'), AdminController.getStats);
router.get('/products', authenticate, requireRole('admin'), AdminController.getAllProducts);
router.get('/vendors', authenticate, requireRole('admin'), AdminController.getAllVendors);
router.get('/orders', authenticate, requireRole('admin'), AdminController.getAllOrders);

export default router;
