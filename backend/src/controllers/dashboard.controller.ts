import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';

export const getDashboardStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      onLeaveEmployees,
      totalDepartments,
      roleBreakdown,
      departmentBreakdown,
      recentHires,
      allRecentEmployees,
    ] = await Promise.all([
      prisma.employee.count({ where: { isDeleted: false } }),
      prisma.employee.count({ where: { isDeleted: false, status: 'ACTIVE' } }),
      prisma.employee.count({ where: { isDeleted: false, status: 'INACTIVE' } }),
      prisma.employee.count({ where: { isDeleted: false, status: 'ON_LEAVE' } }),
      prisma.department.count(),

      prisma.employee.groupBy({
        by: ['role'],
        where: { isDeleted: false },
        _count: { role: true },
      }),

      prisma.employee.groupBy({
        by: ['departmentId'],
        where: { isDeleted: false, departmentId: { not: null } },
        _count: { departmentId: true },
        orderBy: { _count: { departmentId: 'desc' } },
        take: 10,
      }),

      // 5 most recent hires
      prisma.employee.findMany({
        where: { isDeleted: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          designation: true,
          profileImageUrl: true,
          createdAt: true,
          department: { select: { name: true } },
        },
      }),

      // All employees joined in the last 6 months — for monthly trend
      prisma.employee.findMany({
        where: {
          isDeleted: false,
          joiningDate: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
          },
        },
        select: { joiningDate: true },
      }),
    ]);

    // ── Monthly hiring trend (pure JS, no raw SQL) ────────────────────
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Build ordered list of the last 6 months
    const now = new Date();
    const monthlyMap: Record<string, number> = {};
    const orderedMonths: string[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyMap[key] = 0;
      orderedMonths.push(key);
    }

    // Bucket each employee into their joining month
    for (const emp of allRecentEmployees) {
      if (!emp.joiningDate) continue;
      const d = new Date(emp.joiningDate);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (key in monthlyMap) {
        monthlyMap[key]++;
      }
    }

    const monthlyHires = orderedMonths.map(month => ({
      month,
      count: monthlyMap[month],
    }));

    // ── Department name resolution ────────────────────────────────────
    const deptIds = departmentBreakdown
      .map(d => d.departmentId!)
      .filter(Boolean);

    const departments = await prisma.department.findMany({
      where: { id: { in: deptIds } },
      select: { id: true, name: true },
    });
    const deptMap = new Map(departments.map(d => [d.id, d.name]));

    res.json({
      success: true,
      data: {
        overview: {
          total:    totalEmployees,
          active:   activeEmployees,
          inactive: inactiveEmployees,
          onLeave:  onLeaveEmployees,
          departmentsCount: totalDepartments,
        },
        roles: roleBreakdown.map(r => ({
          role:  r.role,
          count: r._count.role,
        })),
        departments: departmentBreakdown.map(d => ({
          department: deptMap.get(d.departmentId!) || 'Unknown',
          count:      d._count.departmentId,
        })),
        recentHires,
        monthlyHires,
      },
    });
  } catch (error) {
    next(error);
  }
};
