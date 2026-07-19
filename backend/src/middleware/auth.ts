import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../config/database';
import { AppError } from './error';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    employeeId: string;
    role: string;
    email: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.accessSecret) as {
      userId: string;
      employeeId: string;
      role: string;
      email: string;
    };

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { employee: true },
    });

    if (!user || user.employee.isDeleted) {
      throw new AppError('User not found or deactivated', 401);
    }

    req.user = {
      userId: decoded.userId,
      employeeId: decoded.employeeId,
      role: decoded.role,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401));
    } else {
      next(error);
    }
  }
};
