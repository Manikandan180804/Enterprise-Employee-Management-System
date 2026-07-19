import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();

router.use(authenticate);
router.get('/stats', authorize('SUPER_ADMIN', 'HR_MANAGER'), getDashboardStats);

export default router;
