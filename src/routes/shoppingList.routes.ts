import { Router } from 'express';

import { shoppingListController } from '../controllers/shoppingList.controller';
import { authenticate } from '../middlewares/authenticate';
import { validateRequest } from '../middlewares/validate.middleware';
import {
  createShoppingListSchema,
  shoppingListIdParamsSchema,
  updateShoppingListSchema
} from '../validators/shoppingList.schema';

const router = Router();

router.use(authenticate);

router.get('/', shoppingListController.findAll);
router.post('/', validateRequest(createShoppingListSchema, 'body'), shoppingListController.create);
router.get('/:id', validateRequest(shoppingListIdParamsSchema, 'params'), shoppingListController.findById);
router.patch(
  '/:id',
  validateRequest(shoppingListIdParamsSchema, 'params'),
  validateRequest(updateShoppingListSchema, 'body'),
  shoppingListController.update
);
router.delete('/:id', validateRequest(shoppingListIdParamsSchema, 'params'), shoppingListController.remove);

export default router;
