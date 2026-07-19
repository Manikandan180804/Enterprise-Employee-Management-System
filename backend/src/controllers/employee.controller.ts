import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import csv from 'csv-parser';
import prisma from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { Prisma } from '@prisma/client';

type Role = 'SUPER_ADMIN' | 'HR_MANAGER' | 'EMPLOYEE';
type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';

const employeeSelect = {
  id: true,
  employeeId: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  designation: true,
  salary: true,
  joiningDate: true,
  status: true,
  role: true,
  profileImageUrl: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
  department: { select: { id: true, name: true } },
  manager: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
  _count: { select: { directReports: true } },
} as const;

export const getEmployees = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      department,
      role,
      status,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.EmployeeWhereInput = {
      isDeleted: false,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { employeeId: { contains: search, mode: 'insensitive' } },
          { designation: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(department && { departmentId: department }),
      ...(role && { role: role as Role }),
      ...(status && { status: status as EmployeeStatus }),
    };

    const orderByMap: Record<string, Prisma.EmployeeOrderByWithRelationInput> = {
      firstName: { firstName: order as 'asc' | 'desc' },
      lastName: { lastName: order as 'asc' | 'desc' },
      joiningDate: { joiningDate: order as 'asc' | 'desc' },
      department: { department: { name: order as 'asc' | 'desc' } },
      role: { role: order as 'asc' | 'desc' },
      status: { status: order as 'asc' | 'desc' },
      createdAt: { createdAt: order as 'asc' | 'desc' },
    };

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        select: employeeSelect,
        skip,
        take: limitNum,
        orderBy: orderByMap[sortBy] || { createdAt: 'desc' },
      }),
      prisma.employee.count({ where }),
    ]);

    res.json({
      success: true,
      data: employees,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployee = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const targetId = id === 'me' ? req.user!.employeeId : id;

    // Employees can only view their own profile
    if (req.user!.role === 'EMPLOYEE' && req.user!.employeeId !== targetId) {
      throw new AppError('Access denied', 403);
    }

    const employee = await prisma.employee.findFirst({
      where: { id: targetId, isDeleted: false },
      select: {
        ...employeeSelect,
        directReports: {
          where: { isDeleted: false },
          select: { id: true, firstName: true, lastName: true, employeeId: true, designation: true, profileImageUrl: true },
        },
      },
    });

    if (!employee) throw new AppError('Employee not found', 404);

    res.json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

export const createEmployee = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { password, salary, joiningDate, ...employeeData } = req.body;
    if (employeeData.email) {
      employeeData.email = employeeData.email.toLowerCase().trim();
    }

    // HR Managers cannot assign Super Admin role
    if (req.user!.role === 'HR_MANAGER' && employeeData.role === 'SUPER_ADMIN') {
      throw new AppError('HR Managers cannot assign Super Admin role', 403);
    }

    // Validate managerId is not circular (self-reference)
    if (employeeData.managerId) {
      const manager = await prisma.employee.findUnique({
        where: { id: employeeData.managerId },
      });
      if (!manager) throw new AppError('Manager not found', 404);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const employee = await prisma.$transaction(async (tx) => {
      const createdEmp = await tx.employee.create({
        data: {
          ...employeeData,
          salary: salary ? parseFloat(salary) : undefined,
          joiningDate: joiningDate ? new Date(joiningDate) : undefined,
        },
        select: {
          id: true, employeeId: true, firstName: true, lastName: true,
          email: true, phone: true, designation: true, salary: true,
          joiningDate: true, status: true, role: true, profileImageUrl: true,
          isDeleted: true, createdAt: true, updatedAt: true,
          department: { select: { id: true, name: true } },
          manager: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
          _count: { select: { directReports: true } },
        },
      });

      await tx.user.create({
        data: {
          email: employeeData.email,
          passwordHash,
          employeeId: createdEmp.id,
        },
      });

      return createdEmp;
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'CREATE',
        resource: 'Employee',
        resourceId: employee.id,
        details: { employeeId: employee.employeeId, email: employee.email } as Prisma.InputJsonValue,
      },
    });

    res.status(201).json({ success: true, data: employee, message: 'Employee created successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const targetId = id === 'me' ? req.user!.employeeId : id;
    const { salary, joiningDate, managerId, role, ...rest } = req.body;
    if (rest.email) {
      rest.email = rest.email.toLowerCase().trim();
    }

    const existing = await prisma.employee.findFirst({ where: { id: targetId, isDeleted: false } });
    if (!existing) throw new AppError('Employee not found', 404);

    // Employee role: can only edit own profile with limited fields
    if (req.user!.role === 'EMPLOYEE') {
      if (req.user!.employeeId !== targetId) throw new AppError('Access denied', 403);
      const allowedFields = ['phone', 'profileImageUrl'];
      const hasDisallowedField = Object.keys(req.body).some(k => !allowedFields.includes(k));
      if (hasDisallowedField) throw new AppError('Employees can only update phone and profile image', 403);
    }

    // HR Managers cannot assign Super Admin role
    if (req.user!.role === 'HR_MANAGER' && role === 'SUPER_ADMIN') {
      throw new AppError('HR Managers cannot assign Super Admin role', 403);
    }

    // Prevent circular manager assignment
    if (managerId && managerId !== existing.managerId) {
      if (managerId === targetId) throw new AppError('Employee cannot be their own manager', 400);
      const wouldCreateCycle = await checkCircularReference(targetId, managerId);
      if (wouldCreateCycle) throw new AppError('This would create a circular reporting relationship', 400);
    }

    const updateData: Prisma.EmployeeUpdateInput = {
      ...rest,
      ...(role && { role: role as Role }),
      ...(salary !== undefined && { salary: salary ? parseFloat(salary) : null }),
      ...(joiningDate && { joiningDate: new Date(joiningDate) }),
      ...(managerId !== undefined && {
        manager: managerId ? { connect: { id: managerId } } : { disconnect: true },
      }),
    };

    const employee = await prisma.employee.update({
      where: { id: targetId },
      data: updateData,
      select: employeeSelect,
    });

    // Update user email if changed
    if (rest.email && rest.email !== existing.email) {
      await prisma.user.update({
        where: { employeeId: targetId },
        data: { email: rest.email },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'UPDATE',
        resource: 'Employee',
        resourceId: id,
        details: { changes: Object.keys(req.body) } as Prisma.InputJsonValue,
      },
    });

    res.json({ success: true, data: employee, message: 'Employee updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteEmployee = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const employee = await prisma.employee.findFirst({ where: { id, isDeleted: false } });
    if (!employee) throw new AppError('Employee not found', 404);

    // Cannot delete yourself
    if (req.user!.employeeId === id) throw new AppError('You cannot delete your own account', 400);

    // Soft delete
    await prisma.employee.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), status: 'INACTIVE' },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'DELETE',
        resource: 'Employee',
        resourceId: id,
        details: { employeeId: employee.employeeId } as Prisma.InputJsonValue,
      },
    });

    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getDirectReports = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const reports = await prisma.employee.findMany({
      where: { managerId: id, isDeleted: false },
      select: employeeSelect,
    });

    res.json({ success: true, data: reports, count: reports.length });
  } catch (error) {
    next(error);
  }
};

export const uploadProfileImage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const file = (req as any).file;

    if (!file) throw new AppError('No file uploaded', 400);

    // RBAC: employee can only update their own image
    if (req.user!.role === 'EMPLOYEE' && req.user!.employeeId !== id) {
      throw new AppError('Access denied', 403);
    }

    const imageUrl = `/uploads/${file.filename}`;

    await prisma.employee.update({
      where: { id },
      data: { profileImageUrl: imageUrl },
    });

    res.json({ success: true, data: { profileImageUrl: imageUrl } });
  } catch (error) {
    next(error);
  }
};

export const updateEmployeeManager = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const managerId = req.body.managerId ? String(req.body.managerId) : undefined;

    const employee = await prisma.employee.findFirst({ where: { id, isDeleted: false } });
    if (!employee) throw new AppError('Employee not found', 404);

    // Validate new manager
    if (managerId) {
      const manager = await prisma.employee.findFirst({ where: { id: managerId, isDeleted: false } });
      if (!manager) throw new AppError('Manager not found', 404);

      if (managerId === id) throw new AppError('Employee cannot be their own manager', 400);

      const wouldCreateCycle = await checkCircularReference(id, managerId);
      if (wouldCreateCycle) throw new AppError('This would create a circular reporting relationship', 400);
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        managerId: managerId || null,
      },
      select: employeeSelect,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'UPDATE_MANAGER',
        resource: 'Employee',
        resourceId: id,
        details: { managerId } as Prisma.InputJsonValue,
      },
    });

    res.json({ success: true, data: updated, message: 'Reporting manager updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Helper: check if setting newManagerId as manager of employeeId creates cycle
async function checkCircularReference(employeeId: string, newManagerId: string): Promise<boolean> {
  let currentId: string | null = newManagerId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) return true;
    if (currentId === employeeId) return true;
    visited.add(currentId);

    const empRecord: { managerId: string | null } | null = await prisma.employee.findUnique({
      where: { id: currentId },
      select: { managerId: true },
    });
    currentId = empRecord?.managerId ?? null;
  }

  return false;
}

export const importEmployees = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const file = (req as any).file;
    if (!file) throw new AppError('No CSV file uploaded', 400);

    const filePath = file.path;
    const results: any[] = [];

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve())
        .on('error', (err) => reject(err));
    });

    // Delete temporary file
    fs.unlink(filePath, () => {});

    const importedEmployees: any[] = [];
    const errors: string[] = [];

    for (let index = 0; index < results.length; index++) {
      const row = results[index];
      const rowNum = index + 2;
      
      const {
        employeeId,
        firstName,
        lastName,
        email,
        phone,
        designation,
        salary,
        joiningDate,
        status = 'ACTIVE',
        role = 'EMPLOYEE',
        department: deptName,
        managerEmployeeId,
      } = row;

      if (!employeeId || !firstName || !lastName || !email) {
        errors.push(`Row ${rowNum}: Missing required fields (employeeId, firstName, lastName, email)`);
        continue;
      }

      const existingEmp = await prisma.employee.findFirst({
        where: {
          OR: [
            { employeeId: employeeId.trim() },
            { email: email.trim().toLowerCase() }
          ]
        }
      });

      if (existingEmp) {
        errors.push(`Row ${rowNum}: Employee ID or Email already exists`);
        continue;
      }

      let departmentId: string | null = null;
      if (deptName && deptName.trim()) {
        const dept = await prisma.department.upsert({
          where: { name: deptName.trim() },
          update: {},
          create: { name: deptName.trim(), description: `${deptName.trim()} department` },
        });
        departmentId = dept.id;
      }

      let managerId: string | null = null;
      if (managerEmployeeId && managerEmployeeId.trim()) {
        const mgr = await prisma.employee.findUnique({
          where: { employeeId: managerEmployeeId.trim() }
        });
        if (mgr) {
          managerId = mgr.id;
        } else {
          errors.push(`Row ${rowNum}: Manager with Employee ID ${managerEmployeeId} not found`);
          continue;
        }
      }

      const passwordHash = await bcrypt.hash('Welcome@123', 12);

      try {
        const newEmp = await prisma.$transaction(async (tx) => {
          const emp = await tx.employee.create({
            data: {
              employeeId: employeeId.trim(),
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              email: email.trim().toLowerCase(),
              phone: phone ? phone.trim() : null,
              designation: designation ? designation.trim() : null,
              salary: salary ? parseFloat(salary) : null,
              joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
              status: (status.trim().toUpperCase() as any) || 'ACTIVE',
              role: (role.trim().toUpperCase() as any) || 'EMPLOYEE',
              departmentId,
              managerId,
            }
          });

          await tx.user.create({
            data: {
              email: emp.email,
              passwordHash,
              employeeId: emp.id,
            }
          });

          return emp;
        });

        await prisma.auditLog.create({
          data: {
            userId: req.user!.userId,
            action: 'IMPORT',
            resource: 'Employee',
            resourceId: newEmp.id,
            details: { employeeId: newEmp.employeeId, email: newEmp.email } as any,
          }
        });

        importedEmployees.push(newEmp);
      } catch (err: any) {
        errors.push(`Row ${rowNum}: Database error - ${err.message}`);
      }
    }

    res.json({
      success: true,
      message: `Successfully imported ${importedEmployees.length} employees.`,
      importedCount: importedEmployees.length,
      errorsCount: errors.length,
      errors,
    });
  } catch (error) {
    next(error);
  }
};

export const exportEmployees = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const employees = await prisma.employee.findMany({
      where: { isDeleted: false },
      include: {
        department: true,
        manager: true,
      },
    });

    const headers = [
      'employeeId',
      'firstName',
      'lastName',
      'email',
      'phone',
      'designation',
      'salary',
      'joiningDate',
      'status',
      'role',
      'department',
      'managerEmployeeId',
    ];

    const escapeCsvValue = (val: any) => {
      if (val === null || val === undefined) return '';
      let str = typeof val === 'object' && val instanceof Date ? val.toISOString() : String(val);
      str = str.replace(/"/g, '""');
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str}"`;
      }
      return str;
    };

    const rows = employees.map((emp) => [
      emp.employeeId,
      emp.firstName,
      emp.lastName,
      emp.email,
      emp.phone || '',
      emp.designation || '',
      emp.salary || '',
      emp.joiningDate ? emp.joiningDate.toISOString().split('T')[0] : '',
      emp.status,
      emp.role,
      emp.department ? emp.department.name : '',
      emp.manager ? emp.manager.employeeId : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map(escapeCsvValue).join(',')),
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=employees_export_${Date.now()}.csv`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

