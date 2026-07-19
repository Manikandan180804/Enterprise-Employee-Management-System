import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Trash2, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { departmentApi } from '../api';
import { PageHeader, EmptyState, LoadingSpinner, ConfirmDialog } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import type { Department } from '../types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const DepartmentsPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = React.useState<Department | null>(null);
  const [showForm, setShowForm] = React.useState(false);

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.getAll().then(r => r.data.data as Department[]),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => departmentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department created');
      setShowForm(false);
      reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => departmentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department deleted');
      setDeleteTarget(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Cannot delete'),
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Departments"
        subtitle={`${departments.length} departments`}
        actions={
          isSuperAdmin() ? (
            <button id="add-department-btn" onClick={() => setShowForm(!showForm)} className="btn-primary">
              <Plus className="w-4 h-4" /> Add Department
            </button>
          ) : undefined
        }
      />

      {showForm && isSuperAdmin() && (
        <div className="card p-6 mb-6 animate-fade-in">
          <h3 className="text-surface-200 font-semibold mb-4">New Department</h3>
          <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="grid sm:grid-cols-3 gap-4" id="department-form">
            <div>
              <label className="label">Name *</label>
              <input id="dept-name" className="input" placeholder="Engineering" {...register('name')} />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Description</label>
              <input id="dept-desc" className="input" placeholder="Optional description" {...register('description')} />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" id="create-dept-btn" disabled={isSubmitting} className="btn-primary">
                Create
              </button>
              <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); reset(); }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : departments.length === 0 ? (
        <EmptyState title="No departments yet" description="Create your first department" icon={Building2} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div key={dept.id} className="card p-5 hover:border-surface-700/80 transition-all duration-200 group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-surface-100 font-semibold">{dept.name}</h3>
                    {dept.description && (
                      <p className="text-surface-500 text-sm">{dept.description}</p>
                    )}
                  </div>
                </div>
                {isSuperAdmin() && (
                  <button
                    onClick={() => setDeleteTarget(dept)}
                    className="opacity-0 group-hover:opacity-100 btn-ghost btn-sm p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                    title="Delete department"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {dept._count !== undefined && (
                <div className="mt-4 pt-4 border-t border-surface-800/60 flex items-center gap-2 text-surface-500 text-sm">
                  <Users className="w-4 h-4" />
                  <span>{dept._count.employees} employees</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Department"
        message={`Are you sure you want to delete the "${deleteTarget?.name}" department? Employees in this department will be unassigned.`}
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  );
};

export default DepartmentsPage;
