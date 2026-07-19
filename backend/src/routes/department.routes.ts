import { Router } from 'express';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/department.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate, createDepartmentSchema } from '../middleware/validation';

const router = Router();

router.use(authenticate);

router.get('/', getDepartments);
router.post('/', authorize('SUPER_ADMIN'), validate(createDepartmentSchema), createDepartment);
router.put('/:id', authorize('SUPER_ADMIN'), updateDepartment);
router.delete('/:id', authorize('SUPER_ADMIN'), deleteDepartment);

export default router;
