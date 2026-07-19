import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';

interface OrgNode {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  designation: string | null;
  profileImageUrl: string | null;
  department: { id: string; name: string } | null;
  children: OrgNode[];
  _count?: { directReports: number };
}

export const getOrgTree = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get all non-deleted employees
    const employees = await prisma.employee.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        designation: true,
        profileImageUrl: true,
        managerId: true,
        department: { select: { id: true, name: true } },
        _count: { select: { directReports: true } },
      },
    });

    // Build tree in memory
    const tree = buildOrgTree(employees);
    res.json({ success: true, data: tree, total: employees.length });
  } catch (error) {
    next(error);
  }
};

export const getSubTree = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const root = await prisma.employee.findFirst({
      where: { id, isDeleted: false },
      select: { id: true, employeeId: true, firstName: true, lastName: true, designation: true, profileImageUrl: true, managerId: true, department: { select: { id: true, name: true } } },
    });

    if (!root) throw new AppError('Employee not found', 404);

    const subtreeIds = await getAllDescendants(id);
    const allInSubtree = [root.id, ...subtreeIds];

    const employees = await prisma.employee.findMany({
      where: { id: { in: allInSubtree }, isDeleted: false },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        designation: true,
        profileImageUrl: true,
        managerId: true,
        department: { select: { id: true, name: true } },
        _count: { select: { directReports: true } },
      },
    });

    const tree = buildOrgTree(employees, id);
    res.json({ success: true, data: tree });
  } catch (error) {
    next(error);
  }
};

function buildOrgTree(
  employees: Array<{
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    designation: string | null;
    profileImageUrl: string | null;
    managerId: string | null;
    department: { id: string; name: string } | null;
    _count?: { directReports: number };
  }>,
  rootId?: string
): OrgNode[] {
  const map = new Map<string, OrgNode>();

  for (const emp of employees) {
    map.set(emp.id, {
      id: emp.id,
      employeeId: emp.employeeId,
      firstName: emp.firstName,
      lastName: emp.lastName,
      designation: emp.designation,
      profileImageUrl: emp.profileImageUrl,
      department: emp.department,
      children: [],
      _count: emp._count,
    });
  }

  const roots: OrgNode[] = [];

  for (const emp of employees) {
    const node = map.get(emp.id)!;
    if (rootId) {
      if (emp.id === rootId) {
        roots.push(node);
      } else if (emp.managerId && map.has(emp.managerId)) {
        map.get(emp.managerId)!.children.push(node);
      }
    } else {
      if (!emp.managerId || !map.has(emp.managerId)) {
        roots.push(node);
      } else {
        map.get(emp.managerId)!.children.push(node);
      }
    }
  }

  return roots;
}

async function getAllDescendants(managerId: string): Promise<string[]> {
  const results: string[] = [];
  const queue = [managerId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const reports = await prisma.employee.findMany({
      where: { managerId: currentId, isDeleted: false },
      select: { id: true },
    });
    for (const r of reports) {
      results.push(r.id);
      queue.push(r.id);
    }
  }

  return results;
}
