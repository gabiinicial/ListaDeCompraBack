import { Router } from 'express';

import { itemController } from '../controllers/item.controller';
import { authenticate } from '../middlewares/authenticate';
import { validateRequest } from '../middlewares/validate.middleware';
import {
  createItemSchema,
  itemIdParamsSchema,
  itemListQuerySchema,
  listIdParamsSchema,
  updateItemSchema
} from '../validators/item.schema';

const router = Router();

router.use(authenticate);

router.get(
  '/lists/:listId/items',
  validateRequest(listIdParamsSchema, 'params'),
  validateRequest(itemListQuerySchema, 'query'),
  itemController.findAllByList
);
router.post('/lists/:listId/items', validateRequest(listIdParamsSchema, 'params'), validateRequest(createItemSchema, 'body'), itemController.create);
router.get('/items/:itemId', validateRequest(itemIdParamsSchema, 'params'), itemController.findById);
router.patch('/items/:itemId', validateRequest(itemIdParamsSchema, 'params'), validateRequest(updateItemSchema, 'body'), itemController.update);
router.delete('/items/:itemId', validateRequest(itemIdParamsSchema, 'params'), itemController.remove);

export default router;
