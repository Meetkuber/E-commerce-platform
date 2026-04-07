import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, OrderController.create);
router.get('/', authenticate, OrderController.getAll);
router.get('/:id', authenticate, OrderController.getById);

export default router;
