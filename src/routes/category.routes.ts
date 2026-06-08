import { Router } from 'express';

import { categoryController } from '../controllers/category.controller';
import { authenticate } from '../middlewares/authenticate';
import { validateRequest } from '../middlewares/validate.middleware';
import {
  categoryIdParamsSchema,
  createCategorySchema,
  listIdParamsSchema,
  updateCategorySchema
} from '../validators/category.schema';

const router = Router();

router.use(authenticate);

router.get('/lists/:listId/categories', validateRequest(listIdParamsSchema, 'params'), categoryController.findAllByList);
router.post('/lists/:listId/categories', validateRequest(listIdParamsSchema, 'params'), validateRequest(createCategorySchema, 'body'), categoryController.create);
router.patch('/categories/:categoryId', validateRequest(categoryIdParamsSchema, 'params'), validateRequest(updateCategorySchema, 'body'), categoryController.update);
router.delete('/categories/:categoryId', validateRequest(categoryIdParamsSchema, 'params'), categoryController.remove);

export default router;
