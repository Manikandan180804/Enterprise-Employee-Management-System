import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Users, UserCheck, UserX, Clock, TrendingUp, Building2 } from 'lucide-react';
import { dashboardApi } from '../api';
import { PageHeader, StatCard, Avatar, LoadingSpinner } from '../components/ui';
import type { DashboardStats } from '../types';
import { formatDistanceToNow } from 'date-fns';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

const DashboardPage: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats().then(r => r.data.data as DashboardStats),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-400">Failed to load dashboard data. Please try again.</p>
      </div>
    );
  }

  const { overview, departments, recentHires, monthlyHires, roles } = data;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your organization's workforce"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          title="Total Employees"
          value={overview.total}
          icon={Users}
          color="bg-primary-500 text-primary-400"
          subtitle="All time"
        />
        <StatCard
          title="Active"
          value={overview.active}
          icon={UserCheck}
          color="bg-emerald-500 text-emerald-400"
          subtitle={`${overview.total ? Math.round((overview.active / overview.total) * 100) : 0}% of total`}
        />
        <StatCard
          title="Inactive"
          value={overview.inactive}
          icon={UserX}
          color="bg-red-500 text-red-400"
          subtitle="Deactivated accounts"
        />
        <StatCard
          title="Departments"
          value={overview.departmentsCount || 0}
          icon={Building2}
          color="bg-purple-500 text-purple-400"
          subtitle="Active departments"
        />
        <StatCard
          title="On Leave"
          value={overview.onLeave}
          icon={Clock}
          color="bg-amber-500 text-amber-400"
          subtitle="Currently absent"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Monthly Hiring Trend */}
        <div className="card p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-surface-100 font-semibold">Hiring Trend</h2>
              <p className="text-surface-500 text-sm">Last 6 months</p>
            </div>
            <TrendingUp className="w-5 h-5 text-primary-400" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyHires}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
              />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#colorCount)" name="New Hires" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Role Distribution */}
        <div className="card p-6">
          <h2 className="text-surface-100 font-semibold mb-6">Role Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={roles}
                dataKey="count"
                nameKey="role"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={3}
              >
                {roles.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, n) => [v, n === 'SUPER_ADMIN' ? 'Super Admin' : n === 'HR_MANAGER' ? 'HR Manager' : 'Employee']}
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {roles.map((r, i) => (
              <div key={r.role} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-surface-400">
                    {r.role === 'SUPER_ADMIN' ? 'Super Admin' : r.role === 'HR_MANAGER' ? 'HR Manager' : 'Employee'}
                  </span>
                </div>
                <span className="text-surface-200 font-medium">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-surface-100 font-semibold">By Department</h2>
              <p className="text-surface-500 text-sm">Employee distribution</p>
            </div>
            <Building2 className="w-5 h-5 text-primary-400" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={departments} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis type="category" dataKey="department" width={90} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
              />
              <Bar dataKey="count" name="Employees" radius={[0, 4, 4, 0]}>
                {departments.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Hires */}
        <div className="card p-6">
          <h2 className="text-surface-100 font-semibold mb-6">Recent Hires</h2>
          <div className="space-y-4">
            {recentHires.length === 0 ? (
              <p className="text-surface-500 text-sm text-center py-8">No recent hires</p>
            ) : (
              recentHires.map((emp) => (
                <div key={emp.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-800/40 transition-colors">
                  <Avatar
                    src={emp.profileImageUrl}
                    name={`${emp.firstName} ${emp.lastName}`}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-surface-100 text-sm font-medium truncate">
                      {emp.firstName} {emp.lastName}
                    </p>
                    <p className="text-surface-500 text-xs truncate">
                      {emp.designation} • {(emp as any).department?.name}
                    </p>
                  </div>
                  <p className="text-surface-600 text-xs whitespace-nowrap">
                    {emp.createdAt ? formatDistanceToNow(new Date(emp.createdAt), { addSuffix: true }) : ''}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
