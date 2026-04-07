import { Router } from 'express';
import { CartController } from '../controllers/cart.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, CartController.getCart);
router.post('/add', authenticate, CartController.addItem);
router.put('/update/:itemId', authenticate, CartController.updateItem);
router.delete('/remove/:itemId', authenticate, CartController.removeItem);
router.delete('/clear', authenticate, CartController.clearCart);

export default router;
