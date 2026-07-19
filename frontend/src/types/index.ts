export type Role = 'SUPER_ADMIN' | 'HR_MANAGER' | 'EMPLOYEE';
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';

export interface Department {
  id: string;
  name: string;
  description?: string;
  _count?: { employees: number };
}

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  designation?: string;
  salary?: number | string;
  joiningDate?: string;
  status: EmployeeStatus;
  role: Role;
  profileImageUrl?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  department?: { id: string; name: string } | null;
  manager?: { id: string; firstName: string; lastName: string; employeeId: string } | null;
  directReports?: Partial<Employee>[];
  _count?: { directReports: number };
}

export interface User {
  id: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  profileImageUrl?: string;
  department?: string;
  designation?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface DashboardStats {
  overview: {
    total: number;
    active: number;
    inactive: number;
    onLeave: number;
    departmentsCount: number;
  };
  roles: Array<{ role: Role; count: number }>;
  departments: Array<{ department: string; count: number }>;
  recentHires: Partial<Employee>[];
  monthlyHires: Array<{ month: string; count: number }>;
}

export interface OrgNode {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  designation?: string | null;
  profileImageUrl?: string | null;
  department?: { id: string; name: string } | null;
  children: OrgNode[];
  _count?: { directReports: number };
}

export interface EmployeeFilters {
  search: string;
  department: string;
  role: string;
  status: string;
  sortBy: string;
  order: 'asc' | 'desc';
  page: number;
  limit: number;
}
