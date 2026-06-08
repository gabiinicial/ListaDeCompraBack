import { Router } from 'express';

import authRoutes from './auth.routes';
import budgetRoutes from './budget.routes';
import categoryRoutes from './category.routes';
import itemRoutes from './item.routes';
import notificationRoutes from './notification.routes';
import shoppingListRoutes from './shoppingList.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/lists', shoppingListRoutes);
router.use('/', itemRoutes);
router.use('/', categoryRoutes);
router.use('/', budgetRoutes);
router.use('/', notificationRoutes);

export default router;
