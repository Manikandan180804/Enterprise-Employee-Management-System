import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';

export const getDepartments = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const departments = await prisma.department.findMany({
      include: { _count: { select: { employees: { where: { isDeleted: false } } } } },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: departments });
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description } = req.body;
    const dept = await prisma.department.create({ data: { name, description } });
    res.status(201).json({ success: true, data: dept });
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const dept = await prisma.department.update({
      where: { id },
      data: req.body,
    });
    res.json({ success: true, data: dept });
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const empCount = await prisma.employee.count({ where: { departmentId: id, isDeleted: false } });
    if (empCount > 0) throw new AppError('Cannot delete a department with active employees', 400);
    await prisma.department.delete({ where: { id } });
    res.json({ success: true, message: 'Department deleted' });
  } catch (error) {
    next(error);
  }
};
