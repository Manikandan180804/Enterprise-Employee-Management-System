import React from 'react';
import type { EmployeeStatus, Role } from '../types';

interface StatusBadgeProps {
  status: EmployeeStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const map: Record<EmployeeStatus, { label: string; className: string }> = {
    ACTIVE: { label: 'Active', className: 'badge-active' },
    INACTIVE: { label: 'Inactive', className: 'badge-inactive' },
    ON_LEAVE: { label: 'On Leave', className: 'badge-on-leave' },
  };
  const { label, className } = map[status] || map.ACTIVE;
  return <span className={className}>{label}</span>;
};

interface RoleBadgeProps {
  role: Role;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const map: Record<Role, { label: string; className: string }> = {
    SUPER_ADMIN: { label: 'Super Admin', className: 'badge-super-admin' },
    HR_MANAGER: { label: 'HR Manager', className: 'badge-hr-manager' },
    EMPLOYEE: { label: 'Employee', className: 'badge-employee' },
  };
  const { label, className } = map[role] || map.EMPLOYEE;
  return <span className={className}>{label}</span>;
};

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md' }) => {
  const sizeClass = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-20 h-20 text-2xl',
  }[size];

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (src) {
    return (
      <img
        src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${src}`}
        alt={name}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-surface-700`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center font-semibold text-white ring-2 ring-surface-700 flex-shrink-0`}
    >
      {initials}
    </div>
  );
};

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => (
  <div className="flex items-start justify-between mb-8">
    <div>
      <h1 className="text-2xl font-bold text-surface-50 mb-1">{title}</h1>
      {subtitle && <p className="text-surface-400 text-sm">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-3">{actions}</div>}
  </div>
);

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  trend?: number;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, subtitle, trend }) => (
  <div className="stat-card">
    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full opacity-5 -mr-8 -mt-8 ${color}`} />
    <div className="flex items-start justify-between relative">
      <div>
        <p className="text-surface-400 text-sm font-medium mb-2">{title}</p>
        <p className="text-3xl font-bold text-surface-50">{value}</p>
        {subtitle && <p className="text-surface-500 text-xs mt-1">{subtitle}</p>}
        {trend !== undefined && (
          <p className={`text-xs mt-2 font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% this month
          </p>
        )}
      </div>
      <div className={`w-12 h-12 rounded-xl ${color} bg-opacity-20 flex items-center justify-center`}>
        <Icon className={`w-6 h-6`} />
      </div>
    </div>
  </div>
);

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon: Icon, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {Icon && (
      <div className="w-16 h-16 rounded-full bg-surface-800/60 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-surface-500" />
      </div>
    )}
    <h3 className="text-surface-200 font-medium mb-2">{title}</h3>
    {description && <p className="text-surface-500 text-sm max-w-sm mb-6">{description}</p>}
    {action}
  </div>
);

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClass = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }[size];
  return (
    <div className={`${sizeClass} rounded-full border-2 border-primary-600 border-t-transparent animate-spin ${className}`} />
  );
};

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, title, message, confirmLabel = 'Confirm', onConfirm, onCancel, danger = false
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="card p-6 w-full max-w-md relative animate-fade-in">
        <h3 className="text-lg font-semibold text-surface-50 mb-2">{title}</h3>
        <p className="text-surface-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
