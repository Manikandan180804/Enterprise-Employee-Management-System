import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Search, Filter, Plus, ChevronUp, ChevronDown, ChevronsUpDown,
  Edit2, Trash2, Eye, ChevronLeft, ChevronRight, UserPlus, Download, Upload
} from 'lucide-react';
import { employeeApi, departmentApi } from '../api';
import {
  PageHeader, StatusBadge, RoleBadge, Avatar, EmptyState,
  LoadingSpinner, ConfirmDialog
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import type { Employee, EmployeeFilters, Department } from '../types';
import { format } from 'date-fns';

const defaultFilters: EmployeeFilters = {
  search: '',
  department: '',
  role: '',
  status: '',
  sortBy: 'createdAt',
  order: 'desc',
  page: 1,
  limit: 10,
};

const SortButton: React.FC<{ field: string; current: string; order: 'asc' | 'desc'; onSort: (f: string) => void }> = ({ field, current, order, onSort }) => {
  const isActive = current === field;
  return (
    <button onClick={() => onSort(field)} className="inline-flex items-center gap-1 hover:text-surface-100 transition-colors">
      {isActive ? (order === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 text-surface-600" />}
    </button>
  );
};

const EmployeesPage: React.FC = () => {
  const { isSuperAdmin, isHrManager } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<EmployeeFilters>(defaultFilters);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const handleExportCsv = async () => {
    try {
      const response = await employeeApi.exportCsv();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `employees_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Employees exported successfully');
    } catch (error: any) {
      toast.error('Failed to export employees');
    }
  };

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    const toastId = toast.loading('Importing employees...');
    try {
      const response = await employeeApi.importCsv(file);
      const { importedCount, errorsCount, errors } = response.data.data;
      
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

      if (errorsCount > 0) {
        toast.dismiss(toastId);
        toast(
          (t) => (
            <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto">
              <span className="font-semibold text-sm">
                Imported {importedCount} employees, but encountered {errorsCount} errors:
              </span>
              <ul className="list-disc pl-4 text-xs text-red-600">
                {errors.slice(0, 5).map((err: string, i: number) => (
                  <li key={i}>{err}</li>
                ))}
                {errors.length > 5 && <li>...and {errors.length - 5} more errors.</li>}
              </ul>
              <button 
                onClick={() => toast.dismiss(t.id)} 
                className="mt-2 btn-primary btn-sm self-end"
              >
                Dismiss
              </button>
            </div>
          ),
          { duration: 10000 }
        );
      } else {
        toast.success(`Successfully imported ${importedCount} employees`, { id: toastId });
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to import employees';
      toast.error(errMsg, { id: toastId });
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['employees', filters],
    queryFn: () => employeeApi.getAll(filters).then(r => r.data),
    keepPreviousData: true,
  } as any);

  const { data: depts } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.getAll().then(r => r.data.data as Department[]),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee deleted successfully');
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Delete failed');
    },
  });

  const handleSort = (field: string) => {
    setFilters(f => ({
      ...f,
      sortBy: field,
      order: f.sortBy === field && f.order === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(f => ({ ...f, search: e.target.value, page: 1 }));
  };

  const employees: Employee[] = (data as any)?.data || [];
  const pagination = (data as any)?.pagination;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Employees"
        subtitle={`${pagination?.total ?? 0} total employees`}
        actions={
          isSuperAdmin() || isHrManager() ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportCsv}
                className="btn-secondary flex items-center gap-1.5"
                title="Export Employees to CSV"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              
              <label className="btn-secondary flex items-center gap-1.5 cursor-pointer animate-pulse-slow" title="Import Employees from CSV">
                <Upload className="w-4 h-4" />
                Import
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleImportCsv}
                />
              </label>

              <Link to="/employees/new" id="add-employee-btn" className="btn-primary flex items-center gap-1.5">
                <UserPlus className="w-4 h-4" />
                Add Employee
              </Link>
            </div>
          ) : undefined
        }
      />

      {/* Filters Bar */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input
              id="employee-search"
              type="text"
              placeholder="Search by name, email, ID, designation..."
              className="input pl-9"
              value={filters.search}
              onChange={handleSearch}
            />
          </div>
          <button
            id="toggle-filters"
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary ${showFilters ? 'border-primary-500/40 text-primary-400' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-surface-800/60 animate-fade-in">
            <select
              id="filter-department"
              className="input"
              value={filters.department}
              onChange={e => setFilters(f => ({ ...f, department: e.target.value, page: 1 }))}
            >
              <option value="">All Departments</option>
              {depts?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select
              id="filter-role"
              className="input"
              value={filters.role}
              onChange={e => setFilters(f => ({ ...f, role: e.target.value, page: 1 }))}
            >
              <option value="">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="HR_MANAGER">HR Manager</option>
              <option value="EMPLOYEE">Employee</option>
            </select>
            <select
              id="filter-status"
              className="input"
              value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ON_LEAVE">On Leave</option>
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : employees.length === 0 ? (
          <EmptyState
            title="No employees found"
            description="Try adjusting your search or filters"
            icon={Search}
            action={
              (isSuperAdmin() || isHrManager()) ? (
                <Link to="/employees/new" className="btn-primary">
                  <Plus className="w-4 h-4" /> Add First Employee
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-800/40 border-b border-surface-700/60">
                  <tr>
                    <th className="text-left px-4 py-3 text-surface-400 text-xs font-semibold uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="text-left px-4 py-3 text-surface-400 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell">
                      <span className="flex items-center gap-1">
                        Department <SortButton field="department" current={filters.sortBy} order={filters.order} onSort={handleSort} />
                      </span>
                    </th>
                    <th className="text-left px-4 py-3 text-surface-400 text-xs font-semibold uppercase tracking-wider hidden md:table-cell">
                      <span className="flex items-center gap-1">
                        Role <SortButton field="role" current={filters.sortBy} order={filters.order} onSort={handleSort} />
                      </span>
                    </th>
                    <th className="text-left px-4 py-3 text-surface-400 text-xs font-semibold uppercase tracking-wider hidden lg:table-cell">
                      <span className="flex items-center gap-1">
                        Status <SortButton field="status" current={filters.sortBy} order={filters.order} onSort={handleSort} />
                      </span>
                    </th>
                    <th className="text-left px-4 py-3 text-surface-400 text-xs font-semibold uppercase tracking-wider hidden xl:table-cell">
                      <span className="flex items-center gap-1">
                        Joined <SortButton field="joiningDate" current={filters.sortBy} order={filters.order} onSort={handleSort} />
                      </span>
                    </th>
                    <th className="text-right px-4 py-3 text-surface-400 text-xs font-semibold uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800/40">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-surface-800/20 transition-colors group">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar src={emp.profileImageUrl} name={`${emp.firstName} ${emp.lastName}`} size="sm" />
                          <div>
                            <p className="text-surface-100 text-sm font-medium">
                              {emp.firstName} {emp.lastName}
                            </p>
                            <p className="text-surface-500 text-xs">{emp.employeeId} · {emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <span className="text-surface-300 text-sm">{emp.department?.name || '—'}</span>
                        <p className="text-surface-600 text-xs">{emp.designation || ''}</p>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <RoleBadge role={emp.role} />
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <StatusBadge status={emp.status} />
                      </td>
                      <td className="px-4 py-3.5 hidden xl:table-cell text-surface-400 text-sm">
                        {emp.joiningDate ? format(new Date(emp.joiningDate), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            to={`/employees/${emp.id}`}
                            className="btn-ghost btn-sm p-1.5"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {(isSuperAdmin() || isHrManager()) && (
                            <Link
                              to={`/employees/${emp.id}/edit`}
                              className="btn-ghost btn-sm p-1.5"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Link>
                          )}
                          {isSuperAdmin() && (
                            <button
                              onClick={() => setDeleteTarget(emp)}
                              className="btn-ghost btn-sm p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-surface-800/60 bg-surface-800/20">
                <p className="text-surface-500 text-sm">
                  Showing {((pagination.page - 1) * pagination.limit) + 1}–
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    id="prev-page"
                    className="btn-secondary btn-sm"
                    disabled={!pagination.hasPrev}
                    onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-surface-400 text-sm px-2">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    id="next-page"
                    className="btn-secondary btn-sm"
                    disabled={!pagination.hasNext}
                    onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Employee"
        message={`Are you sure you want to delete ${deleteTarget?.firstName} ${deleteTarget?.lastName}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  );
};

export default EmployeesPage;
