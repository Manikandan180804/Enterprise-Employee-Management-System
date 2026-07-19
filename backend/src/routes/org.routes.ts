import { Router } from 'express';
import { getOrgTree, getSubTree } from '../controllers/org.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/tree', getOrgTree);
router.get('/tree/:id', getSubTree);

export default router;
