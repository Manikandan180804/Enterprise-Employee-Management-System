import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getDirectReports,
  uploadProfileImage,
  updateEmployeeManager,
  importEmployees,
  exportEmployees,
} from '../controllers/employee.controller';
import { authenticate } from '../middleware/auth';
import { authorize, authorizeOwnerOrRole } from '../middleware/rbac';
import {
  validate,
  createEmployeeSchema,
  updateEmployeeSchema,
  queryParamsSchema,
} from '../middleware/validation';

const router = Router();

// Multer setup for profile images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, process.env.UPLOAD_DIR || 'uploads'),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `profile-${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files allowed'));
  },
});

// All routes require authentication
router.use(authenticate);

router.get('/', authorize('SUPER_ADMIN', 'HR_MANAGER'), validate(queryParamsSchema), getEmployees);
router.post('/', authorize('SUPER_ADMIN', 'HR_MANAGER'), validate(createEmployeeSchema), createEmployee);

router.post('/import', authorize('SUPER_ADMIN', 'HR_MANAGER'), upload.single('file'), importEmployees);
router.get('/export', authorize('SUPER_ADMIN', 'HR_MANAGER'), exportEmployees);

router.get('/:id', getEmployee); // RBAC enforced inside controller
router.put('/:id', validate(updateEmployeeSchema), updateEmployee); // RBAC inside controller
router.delete('/:id', authorize('SUPER_ADMIN'), deleteEmployee);

router.get('/:id/reports', authorize('SUPER_ADMIN', 'HR_MANAGER'), getDirectReports);
router.get('/:id/reportees', authorize('SUPER_ADMIN', 'HR_MANAGER'), getDirectReports);
router.patch('/:id/manager', authorize('SUPER_ADMIN', 'HR_MANAGER'), updateEmployeeManager);

router.post('/:id/upload-image',
  authorizeOwnerOrRole('id', 'SUPER_ADMIN', 'HR_MANAGER'),
  upload.single('image'),
  uploadProfileImage
);

export default router;
