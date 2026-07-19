import { Router } from 'express';
import { login, logout, refresh, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate, loginSchema } from '../middleware/validation';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;
