import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config';
import { errorHandler, notFound } from './middleware/error';

// Routes
import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes';
import orgRoutes from './routes/org.routes';
import dashboardRoutes from './routes/dashboard.routes';
import departmentRoutes from './routes/department.routes';

const app = express();

// Security
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
  skip: () => process.env.NODE_ENV === 'development',
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
  skip: () => process.env.NODE_ENV === 'development',
});
app.use('/api/auth/login', authLimiter);

// CORS
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined'));
}

// Static files (profile images)
app.use('/uploads', express.static(path.join(process.cwd(), config.upload.dir)));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'EMS API is running', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/organization', orgRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/departments', departmentRoutes);

// 404
app.use(notFound);

// Error handler
app.use(errorHandler);

export default app;
