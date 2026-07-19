import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { AppError } from './error';

export type RoleType = 'SUPER_ADMIN' | 'HR_MANAGER' | 'EMPLOYEE';

/**
 * Middleware factory: allow only specified roles.
 */
export const authorize = (...roles: RoleType[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (!roles.includes(req.user.role as RoleType)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
};

/**
 * Middleware: allow if user is accessing their own resource OR has elevated role.
 */
export const authorizeOwnerOrRole = (paramKey: string, ...roles: RoleType[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    const isOwner = req.params[paramKey] === req.user.employeeId;
    const hasRole = roles.includes(req.user.role as RoleType);
    if (!isOwner && !hasRole) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
};
