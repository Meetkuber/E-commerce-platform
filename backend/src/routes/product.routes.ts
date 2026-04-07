import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { upload, uploadToCloudinary } from '../middleware/upload';

const router = Router();

// Public routes
router.get('/', ProductController.getAll);
router.get('/categories', ProductController.getCategories);
router.get('/featured', ProductController.getFeatured);
router.get('/:id', ProductController.getById);

// Vendor + Admin routes — ownership enforced at controller/service level
router.post('/', authenticate, requireRole('vendor', 'admin'), upload.single('image'), uploadToCloudinary('products'), ProductController.create);
router.put('/:id', authenticate, requireRole('vendor', 'admin'), upload.single('image'), uploadToCloudinary('products'), ProductController.update);
router.delete('/:id', authenticate, requireRole('vendor', 'admin'), ProductController.delete);

export default router;

