import { Router } from 'express';

import { notificationController } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/authenticate';
import { validateRequest } from '../middlewares/validate.middleware';
import { notificationIdParamsSchema } from '../validators/notification.schema';

const router = Router();

router.use(authenticate);

router.get('/notifications', notificationController.findAll);
router.get('/notifications/unread/count', notificationController.unreadCount);
router.patch('/notifications/:notificationId/read', validateRequest(notificationIdParamsSchema, 'params'), notificationController.markAsRead);

export default router;
