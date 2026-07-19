import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, GitBranch, Building2, LogOut,
  ChevronRight, Shield, UserCircle, BarChart3, Sun, Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['SUPER_ADMIN', 'HR_MANAGER'] },
  { icon: Users, label: 'Employees', path: '/employees', roles: ['SUPER_ADMIN', 'HR_MANAGER'] },
  { icon: GitBranch, label: 'Org Chart', path: '/org', roles: ['SUPER_ADMIN', 'HR_MANAGER', 'EMPLOYEE'] },
  { icon: Building2, label: 'Departments', path: '/departments', roles: ['SUPER_ADMIN'] },
  { icon: UserCircle, label: 'My Profile', path: '/profile', roles: ['SUPER_ADMIN', 'HR_MANAGER', 'EMPLOYEE'] },
];

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  HR_MANAGER: 'HR Manager',
  EMPLOYEE: 'Employee',
};

const roleBadgeClass: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  HR_MANAGER: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  EMPLOYEE: 'bg-surface-700/40 text-surface-400 border-surface-600/30',
};

const Sidebar: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch {
      toast.error('Logout failed');
    }
  };

  const visibleNavItems = navItems.filter(
    item => hasRole(...item.roles)
  );

  return (
    <aside className="fixed top-0 left-0 h-screen w-[var(--sidebar-width)] bg-surface-900/95 backdrop-blur-xl border-r border-surface-800/60 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-surface-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-surface-50">Enterprise EMS</h1>
            <p className="text-xs text-surface-500">Management System</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-surface-600 uppercase tracking-wider px-3 mb-3">
          Navigation
        </p>
        {visibleNavItems.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary-500/10 dark:bg-primary-600/20 text-primary-600 dark:text-primary-400 border border-primary-500/20 dark:border-primary-500/30'
                  : 'text-surface-400 hover:text-surface-200 dark:hover:text-surface-100 hover:bg-surface-800/60 dark:hover:bg-surface-800/40'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-surface-500 group-hover:text-surface-300'}`} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3 h-3 text-primary-600 dark:text-primary-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-surface-800/60">
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-surface-800/40 border border-surface-700/40 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-surface-100 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${roleBadgeClass[user?.role || 'EMPLOYEE']}`}>
              <Shield className="w-2.5 h-2.5 mr-1" />
              {roleLabels[user?.role || 'EMPLOYEE']}
            </span>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <button
            onClick={toggleTheme}
            type="button"
            id="theme-toggle-btn"
            className="flex items-center justify-center p-2.5 rounded-lg border border-surface-700/40 bg-surface-800/40 text-surface-400 hover:text-primary-400 hover:bg-primary-500/10 transition-all duration-200"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={handleLogout}
            id="logout-btn"
            className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
