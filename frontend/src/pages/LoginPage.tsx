import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, BarChart3, Shield, Users, GitBranch, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

const features = [
  { icon: Users, label: 'Employee Management', desc: 'Full CRUD with role-based access' },
  { icon: GitBranch, label: 'Org Hierarchy', desc: 'Visual reporting tree with cycle detection' },
  { icon: Shield, label: 'Secure RBAC', desc: 'JWT auth with 3-tier role system' },
];

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const fillCredentials = (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
  };

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Login failed. Check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Floating Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={toggleTheme}
          type="button"
          id="theme-toggle-btn"
          className="flex items-center justify-center p-2.5 rounded-lg border border-surface-700/40 bg-surface-900/60 text-surface-400 hover:text-primary-400 hover:bg-primary-500/10 transition-all duration-200"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Left Panel */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-center px-16 py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/60 via-surface-900 to-surface-950" />
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-10 bg-primary-500"
              style={{
                width: Math.random() * 200 + 50,
                height: Math.random() * 200 + 50,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                filter: 'blur(40px)',
              }}
            />
          ))}
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-primary-500/40">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Enterprise EMS</h1>
              <p className="text-primary-400 text-sm">Employee Management System</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Manage your workforce<br />
            <span className="text-gradient">with confidence</span>
          </h2>
          <p className="text-surface-400 text-lg mb-12 max-w-md">
            A complete enterprise solution for employee management, organizational hierarchy, and role-based access control.
          </p>

          <div className="space-y-6">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <p className="text-surface-100 font-medium">{label}</p>
                  <p className="text-surface-500 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-950">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Enterprise EMS</h1>
          </div>

          <div className="card p-8 shadow-2xl shadow-black/30">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-surface-50 mb-1">Welcome back</h2>
              <p className="text-surface-400 text-sm">Sign in to your account to continue</p>
            </div>

            <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4 mb-6">
              <p className="text-primary-400 text-xs font-semibold uppercase tracking-wider mb-2">Demo Credentials <span className="normal-case font-normal text-surface-500">(click to fill)</span></p>
              <div className="space-y-1.5">
                {[
                  { label: 'Admin',    email: 'admin@ems.com',             password: 'Admin@123' },
                  { label: 'HR Mgr',  email: 'sarah.johnson@ems.com',     password: 'Hr@123456' },
                  { label: 'Employee',email: 'michael.chen@ems.com',       password: 'Employee@123' },
                ].map(({ label, email, password }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => fillCredentials(email, password)}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-primary-500/10 transition-colors text-xs text-surface-300 flex items-center gap-2 group"
                  >
                    <span className="text-surface-500 w-14 shrink-0">{label}:</span>
                    <span className="truncate">{email}</span>
                    <span className="text-surface-600 ml-auto shrink-0 group-hover:text-primary-400 transition-colors">click to fill →</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="login-form">
              <div>
                <label className="label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  {...register('email')}
                />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="label" htmlFor="password">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    id="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                id="login-submit"
                disabled={isSubmitting}
                className="btn-primary w-full btn-lg"
              >
                {isSubmitting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
                ) : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="text-center text-surface-600 text-xs mt-6">
            Enterprise Employee Management System v1.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
