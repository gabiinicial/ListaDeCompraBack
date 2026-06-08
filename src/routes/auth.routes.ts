import { Router } from 'express';

import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/authenticate';
import { validateRequest } from '../middlewares/validate.middleware';
import { loginSchema, registerSchema } from '../validators/auth.schema';

const router = Router();

router.post('/register', validateRequest(registerSchema, 'body'), authController.register);
router.post('/login', validateRequest(loginSchema, 'body'), authController.login);
router.get('/me', authenticate, authController.me);

export default router;
