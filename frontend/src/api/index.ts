import api from './axios';
import type { Employee, PaginatedResponse, ApiResponse, EmployeeFilters } from '../types';

export const employeeApi = {
  getAll: (filters: Partial<EmployeeFilters>) =>
    api.get<PaginatedResponse<Employee>>('/employees', { params: filters }),

  getById: (id: string) =>
    api.get<ApiResponse<Employee>>(`/employees/${id}`),

  create: (data: Partial<Employee> & { password: string }) =>
    api.post<ApiResponse<Employee>>('/employees', data),

  update: (id: string, data: Partial<Employee>) =>
    api.put<ApiResponse<Employee>>(`/employees/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/employees/${id}`),

  getDirectReports: (id: string) =>
    api.get<ApiResponse<Employee[]>>(`/employees/${id}/reports`),

  uploadImage: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post<ApiResponse<{ profileImageUrl: string }>>(
      `/employees/${id}/upload-image`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },

  importCsv: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<{ importedCount: number; errorsCount: number; errors: string[] }>>(
      '/employees/import',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },

  exportCsv: () =>
    api.get('/employees/export', { responseType: 'blob' }),
};

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  logout: () => api.post('/auth/logout'),

  me: () => api.get('/auth/me'),

  refresh: () => api.post('/auth/refresh'),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

export const orgApi = {
  getTree: () => api.get('/org/tree'),
  getSubTree: (id: string) => api.get(`/org/tree/${id}`),
};

export const departmentApi = {
  getAll: () => api.get('/departments'),
  create: (data: { name: string; description?: string }) =>
    api.post('/departments', data),
  update: (id: string, data: { name?: string; description?: string }) =>
    api.put(`/departments/${id}`, data),
  delete: (id: string) => api.delete(`/departments/${id}`),
};
