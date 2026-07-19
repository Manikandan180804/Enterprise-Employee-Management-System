import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft, Save, Upload, Mail, Phone, Building2, Calendar,
  DollarSign, User, Users, Shield, AlertCircle
} from 'lucide-react';
import { employeeApi, departmentApi } from '../api';
import { PageHeader, StatusBadge, RoleBadge, Avatar, LoadingSpinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import type { Employee, Department } from '../types';
import { format } from 'date-fns';

const createSchema = z.object({
  employeeId: z.string().min(1, 'Required'),
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  departmentId: z.string().optional(),
  designation: z.string().optional(),
  salary: z.string().optional(),
  joiningDate: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE']).optional(),
  role: z.enum(['SUPER_ADMIN', 'HR_MANAGER', 'EMPLOYEE']).optional(),
  managerId: z.string().optional(),
  password: z.string().min(6, 'Min 6 characters'),
});

const editSchema = z.object({
  firstName: z.string().min(1, 'Required').optional(),
  lastName: z.string().min(1, 'Required').optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  departmentId: z.string().optional(),
  designation: z.string().optional(),
  salary: z.string().optional(),
  joiningDate: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE']).optional(),
  role: z.enum(['SUPER_ADMIN', 'HR_MANAGER', 'EMPLOYEE']).optional(),
  managerId: z.string().optional(),
});


const FormField: React.FC<{
  label: string; error?: string; required?: boolean;
  icon?: React.ElementType; children: React.ReactNode;
}> = ({ label, error, required, icon: Icon, children }) => (
  <div>
    <label className="label flex items-center gap-2">
      {Icon && <Icon className="w-3.5 h-3.5 text-surface-500" />}
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {error && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
  </div>
);

// ─── VIEW PAGE ───────────────────────────────────────────────────────────────

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isSuperAdmin, isHrManager } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeApi.getById(id!).then(r => r.data.data as Employee),
  });

  if (isLoading) return <div className="flex justify-center p-20"><LoadingSpinner size="lg" /></div>;
  if (!data) return <div className="card p-8 text-center text-red-400">Employee not found</div>;

  const emp = data;
  const fullName = `${emp.firstName} ${emp.lastName}`;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={fullName}
        subtitle={`${emp.employeeId} · ${emp.designation || 'No designation'}`}
        actions={
          <>
            <Link to="/employees" className="btn-secondary">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            {(isSuperAdmin() || isHrManager()) && (
              <Link to={`/employees/${id}/edit`} className="btn-primary">
                Edit Employee
              </Link>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="card p-6 flex flex-col items-center text-center">
          <Avatar src={emp.profileImageUrl} name={fullName} size="xl" />
          <h2 className="text-surface-50 font-bold text-xl mt-4">{fullName}</h2>
          <p className="text-surface-400 text-sm mb-4">{emp.designation}</p>
          <div className="flex flex-col gap-2 items-center">
            <StatusBadge status={emp.status} />
            <RoleBadge role={emp.role} />
          </div>

          <div className="w-full mt-6 pt-6 border-t border-surface-800/60 space-y-3 text-left">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-surface-500 flex-shrink-0" />
              <span className="text-surface-300 truncate">{emp.email}</span>
            </div>
            {emp.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-surface-500 flex-shrink-0" />
                <span className="text-surface-300">{emp.phone}</span>
              </div>
            )}
            {emp.department && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-surface-500 flex-shrink-0" />
                <span className="text-surface-300">{emp.department.name}</span>
              </div>
            )}
            {emp.joiningDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-surface-500 flex-shrink-0" />
                <span className="text-surface-300">{format(new Date(emp.joiningDate), 'MMMM d, yyyy')}</span>
              </div>
            )}
            {emp.salary && (isSuperAdmin() || isHrManager()) && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-surface-500 flex-shrink-0" />
                <span className="text-surface-300">${Number(emp.salary).toLocaleString()}/year</span>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="xl:col-span-2 space-y-6">
          {/* Manager */}
          {emp.manager && (
            <div className="card p-5">
              <h3 className="text-surface-300 text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary-400" /> Reporting To
              </h3>
              <Link to={`/employees/${emp.manager.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <Avatar src={undefined} name={`${emp.manager.firstName} ${emp.manager.lastName}`} size="md" />
                <div>
                  <p className="text-surface-100 font-medium">{emp.manager.firstName} {emp.manager.lastName}</p>
                  <p className="text-surface-500 text-sm">{emp.manager.employeeId}</p>
                </div>
              </Link>
            </div>
          )}

          {/* Direct Reports */}
          {emp.directReports && emp.directReports.length > 0 && (
            <div className="card p-5">
              <h3 className="text-surface-300 text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary-400" /> Direct Reports ({emp.directReports.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {emp.directReports.map((r) => (
                  <Link key={r.id} to={`/employees/${r.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-surface-800/40 hover:bg-surface-800/60 transition-colors">
                    <Avatar src={r.profileImageUrl} name={`${r.firstName} ${r.lastName}`} size="sm" />
                    <div className="min-w-0">
                      <p className="text-surface-100 text-sm font-medium truncate">{r.firstName} {r.lastName}</p>
                      <p className="text-surface-500 text-xs truncate">{r.designation || r.employeeId}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="card p-5">
            <h3 className="text-surface-300 text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-primary-400" /> Employee Info
            </h3>
            <dl className="grid grid-cols-2 gap-4">
              {[
                ['Employee ID', emp.employeeId],
                ['Department', emp.department?.name || '—'],
                ['Designation', emp.designation || '—'],
                ['Status', emp.status],
                ['Role', emp.role],
                ['Joined', emp.joiningDate ? format(new Date(emp.joiningDate), 'MMM d, yyyy') : '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-surface-500 text-xs font-medium uppercase tracking-wider mb-0.5">{k}</dt>
                  <dd className="text-surface-200 text-sm">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── CREATE / EDIT FORM ──────────────────────────────────────────────────────

interface EmployeeFormPageProps {
  mode: 'create' | 'edit';
}

export const EmployeeFormPage: React.FC<EmployeeFormPageProps> = ({ mode }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isSuperAdmin, isHrManager } = useAuth();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Determine what fields this user can edit
  const canEditAll = isSuperAdmin() || isHrManager();

  const { data: empData, isLoading: empLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeApi.getById(id!).then(r => r.data.data as Employee),
    enabled: mode === 'edit' && !!id,
  });

  const { data: depts } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.getAll().then(r => r.data.data as Department[]),
  });

  const { data: allEmps } = useQuery({
    queryKey: ['employees-all'],
    queryFn: () => employeeApi.getAll({ limit: 100 }).then(r => r.data.data as Employee[]),
    enabled: canEditAll,
  });

  const schema = mode === 'create' ? createSchema : editSchema;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: mode === 'edit' && empData ? {
      firstName: empData.firstName,
      lastName: empData.lastName,
      email: empData.email,
      phone: empData.phone || '',
      departmentId: empData.department?.id || '',
      designation: empData.designation || '',
      salary: empData.salary ? String(empData.salary) : '',
      joiningDate: empData.joiningDate ? empData.joiningDate.split('T')[0] : '',
      status: empData.status,
      role: empData.role,
      managerId: empData.manager?.id || '',
    } : {},
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => employeeApi.create(data),
    onSuccess: (res) => {
      const newId = res.data.data.id;
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee created successfully!');
      if (imageFile) uploadImageMutation.mutate(newId);
      else navigate(`/employees/${newId}`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Creation failed'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => employeeApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee updated!');
      if (imageFile) uploadImageMutation.mutate(id!);
      else navigate(`/employees/${id}`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Update failed'),
  });

  const uploadImageMutation = useMutation({
    mutationFn: (empId: string) => employeeApi.uploadImage(empId, imageFile!),
    onSuccess: (_, empId) => {
      queryClient.invalidateQueries({ queryKey: ['employee', empId] });
      navigate(`/employees/${empId}`);
    },
  });

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      salary: data.salary ? parseFloat(data.salary) : undefined,
      departmentId: data.departmentId || undefined,
      managerId: data.managerId || undefined,
    };
    if (mode === 'create') createMutation.mutate(payload);
    else updateMutation.mutate(payload);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  if (mode === 'edit' && empLoading) {
    return <div className="flex justify-center p-20"><LoadingSpinner size="lg" /></div>;
  }

  const emp = empData;
  const title = mode === 'create' ? 'Add New Employee' : `Edit ${emp?.firstName} ${emp?.lastName}`;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={title}
        subtitle={mode === 'edit' ? `Employee ID: ${emp?.employeeId}` : 'Fill in the details below'}
        actions={
          <Link to={mode === 'edit' ? `/employees/${id}` : '/employees'} className="btn-secondary">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} id="employee-form">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Image + basic */}
          <div className="card p-6 flex flex-col items-center">
            <div className="relative mb-4">
              <Avatar
                src={imagePreview || emp?.profileImageUrl}
                name={mode === 'edit' ? `${emp?.firstName} ${emp?.lastName}` : 'New Employee'}
                size="xl"
              />
              <label
                htmlFor="profile-image-input"
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary-600 hover:bg-primary-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-white" />
              </label>
              <input
                id="profile-image-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
            <p className="text-surface-500 text-xs text-center">Click the upload icon to change photo</p>
          </div>

          {/* Fields */}
          <div className="xl:col-span-2 space-y-6">
            {/* Personal Info */}
            <div className="card p-6">
              <h3 className="text-surface-200 font-semibold mb-5 flex items-center gap-2">
                <User className="w-4 h-4 text-primary-400" /> Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mode === 'create' && (
                  <FormField label="Employee ID" required error={(errors as any).employeeId?.message} icon={User}>
                    <input id="employeeId" className="input" placeholder="EMP001" {...register('employeeId')} />
                  </FormField>
                )}
                <FormField label="First Name" required error={(errors as any).firstName?.message}>
                  <input id="firstName" className="input" placeholder="John" {...register('firstName')} />
                </FormField>
                <FormField label="Last Name" required error={(errors as any).lastName?.message}>
                  <input id="lastName" className="input" placeholder="Doe" {...register('lastName')} />
                </FormField>
                <FormField label="Email" required error={(errors as any).email?.message} icon={Mail}>
                  <input id="email" type="email" className={`input ${!canEditAll ? 'opacity-60' : ''}`} disabled={!canEditAll} placeholder="john@example.com" {...register('email')} />
                </FormField>
                <FormField label="Phone" error={(errors as any).phone?.message} icon={Phone}>
                  <input id="phone" className="input" placeholder="+1 555 0001" {...register('phone')} />
                </FormField>
              </div>
            </div>

            {/* Work Info */}
            {canEditAll && (
              <div className="card p-6">
                <h3 className="text-surface-200 font-semibold mb-5 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary-400" /> Work Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Department" icon={Building2}>
                    <select id="departmentId" className="input" {...register('departmentId')}>
                      <option value="">Select Department</option>
                      {depts?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Designation">
                    <input id="designation" className="input" placeholder="Senior Engineer" {...register('designation')} />
                  </FormField>
                  <FormField label="Salary (Annual)" icon={DollarSign}>
                    <input id="salary" type="number" className="input" placeholder="80000" {...register('salary')} />
                  </FormField>
                  <FormField label="Joining Date" icon={Calendar}>
                    <input id="joiningDate" type="date" className="input" {...register('joiningDate')} />
                  </FormField>
                  <FormField label="Status">
                    <select id="status" className="input" {...register('status')}>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="ON_LEAVE">On Leave</option>
                    </select>
                  </FormField>
                  <FormField label="Role" icon={Shield}>
                    <select id="role" className="input" {...register('role')}>
                      <option value="EMPLOYEE">Employee</option>
                      <option value="HR_MANAGER">HR Manager</option>
                      {isSuperAdmin() && <option value="SUPER_ADMIN">Super Admin</option>}
                    </select>
                  </FormField>
                  <div className="sm:col-span-2">
                    <FormField label="Reporting Manager" icon={Users}>
                      <select id="managerId" className="input" {...register('managerId')}>
                        <option value="">No Manager</option>
                        {allEmps?.filter(e => e.id !== id).map(e => (
                          <option key={e.id} value={e.id}>
                            {e.firstName} {e.lastName} ({e.employeeId})
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>
                </div>
              </div>
            )}

            {/* Password (create only) */}
            {mode === 'create' && (
              <div className="card p-6">
                <h3 className="text-surface-200 font-semibold mb-5">Account Setup</h3>
                <FormField label="Initial Password" required error={(errors as any).password?.message}>
                  <input id="password" type="password" className="input" placeholder="Min 6 characters" {...register('password')} />
                </FormField>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Link to={mode === 'edit' ? `/employees/${id}` : '/employees'} className="btn-secondary">
                Cancel
              </Link>
              <button type="submit" id="submit-employee" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
                ) : (
                  <><Save className="w-4 h-4" />{mode === 'create' ? 'Create Employee' : 'Save Changes'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
