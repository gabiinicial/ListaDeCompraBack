import { Router } from 'express';

import { budgetController } from '../controllers/budget.controller';
import { authenticate } from '../middlewares/authenticate';
import { validateRequest } from '../middlewares/validate.middleware';
import { budgetUpdateSchema, listIdParamsSchema } from '../validators/budget.schema';

const router = Router();

router.use(authenticate);

router.get('/lists/:listId/budget', validateRequest(listIdParamsSchema, 'params'), budgetController.getBudget);
router.put('/lists/:listId/budget', validateRequest(listIdParamsSchema, 'params'), validateRequest(budgetUpdateSchema, 'body'), budgetController.upsertBudget);
router.get('/budget/:listId', validateRequest(listIdParamsSchema, 'params'), budgetController.getBudget);
router.put('/budget/:listId', validateRequest(listIdParamsSchema, 'params'), validateRequest(budgetUpdateSchema, 'body'), budgetController.upsertBudget);

export default router;
