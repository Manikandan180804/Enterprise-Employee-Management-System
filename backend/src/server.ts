import 'dotenv/config';
import app from './app';
import { config } from './config';
import prisma from './config/database';
import fs from 'fs';
import path from 'path';

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), config.upload.dir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const server = app.listen(config.port, async () => {
  try {
    await prisma.$connect();
    console.log(`✅ Database connected`);
    console.log(`🚀 EMS Server running on port ${config.port} [${config.nodeEnv}]`);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
});

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
