import { Router } from 'express';
import { VendorController } from '../controllers/vendor.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/dashboard-stats', authenticate, requireRole('vendor'), VendorController.getDashboardStats);
router.get('/my-products', authenticate, requireRole('vendor'), VendorController.getMyProducts);
router.get('/orders', authenticate, requireRole('vendor'), VendorController.getOrders);
router.put('/profile', authenticate, requireRole('vendor'), VendorController.updateProfile);

export default router;
