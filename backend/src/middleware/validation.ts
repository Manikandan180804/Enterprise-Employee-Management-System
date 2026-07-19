import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './error';

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map((e: z.ZodIssue) => `${e.path.slice(1).join('.')}: ${e.message}`);
        next(new AppError(messages.join('; '), 400));
      } else {
        next(error);
      }
    }
  };
};

// Common schemas
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const createEmployeeSchema = z.object({
  body: z.object({
    employeeId: z.string().min(1, 'Employee ID is required'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email'),
    phone: z.string().optional(),
    departmentId: z.string().optional(),
    designation: z.string().optional(),
    salary: z.number().positive().optional(),
    joiningDate: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE']).optional(),
    role: z.enum(['SUPER_ADMIN', 'HR_MANAGER', 'EMPLOYEE']).optional(),
    managerId: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const updateEmployeeSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    departmentId: z.string().optional().nullable(),
    designation: z.string().optional(),
    salary: z.number().positive().optional(),
    joiningDate: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE']).optional(),
    role: z.enum(['SUPER_ADMIN', 'HR_MANAGER', 'EMPLOYEE']).optional(),
    managerId: z.string().optional().nullable(),
  }),
  params: z.object({
    id: z.string(),
  }),
});

export const queryParamsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    department: z.string().optional(),
    role: z.enum(['SUPER_ADMIN', 'HR_MANAGER', 'EMPLOYEE']).or(z.literal('')).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE']).or(z.literal('')).optional(),
    sortBy: z.enum(['firstName', 'lastName', 'joiningDate', 'department', 'role', 'status', 'createdAt']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Department name is required'),
    description: z.string().optional(),
  }),
});
