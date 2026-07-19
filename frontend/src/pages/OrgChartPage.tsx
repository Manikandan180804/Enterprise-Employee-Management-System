import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { GitBranch, ChevronRight, ChevronDown, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { orgApi } from '../api';
import { PageHeader, Avatar, LoadingSpinner, EmptyState } from '../components/ui';
import type { OrgNode } from '../types';

interface OrgCardProps {
  node: OrgNode;
  level: number;
}

const OrgCard: React.FC<OrgCardProps> = ({ node, level }) => {
  const [collapsed, setCollapsed] = useState(level > 1);
  const hasChildren = node.children.length > 0;

  const levelColors = [
    'border-purple-500/40 bg-purple-500/5',
    'border-primary-500/40 bg-primary-500/5',
    'border-emerald-500/40 bg-emerald-500/5',
    'border-amber-500/40 bg-amber-500/5',
    'border-pink-500/40 bg-pink-500/5',
  ];
  const cardColor = levelColors[Math.min(level, levelColors.length - 1)];

  return (
    <div className="flex flex-col items-center">
      {/* Node */}
      <div className={`relative border rounded-xl p-3 w-52 text-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 ${cardColor}`}
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)' }}>
        <Link to={`/employees/${node.id}`} className="block">
          <div className="flex justify-center mb-2">
            <Avatar src={node.profileImageUrl} name={`${node.firstName} ${node.lastName}`} size="md" />
          </div>
          <p className="text-surface-100 font-semibold text-sm truncate">
            {node.firstName} {node.lastName}
          </p>
          <p className="text-surface-500 text-xs truncate">{node.designation || 'Employee'}</p>
          {node.department && (
            <p className="text-surface-600 text-xs mt-0.5 truncate">{node.department.name}</p>
          )}
        </Link>

        {hasChildren && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-surface-700 border border-surface-600 flex items-center justify-center hover:bg-surface-600 transition-colors z-10"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight className="w-3 h-3 text-surface-300" /> : <ChevronDown className="w-3 h-3 text-surface-300" />}
          </button>
        )}

        {hasChildren && (
          <div className="absolute -top-2 -right-2 min-w-[20px] h-5 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center px-1 font-medium">
            {node.children.length}
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && !collapsed && (
        <div className="mt-8 flex flex-col items-center">
          {/* Vertical line down */}
          <div className="w-px h-4 bg-surface-700" />
          {/* Horizontal line across children */}
          {node.children.length > 1 && (
            <div className="relative flex items-start">
              <div
                className="absolute top-0 h-px bg-surface-700"
                style={{
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: `${(node.children.length - 1) * 240}px`,
                }}
              />
            </div>
          )}
          <div className="flex gap-8 items-start">
            {node.children.map((child) => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="w-px h-4 bg-surface-700" />
                <OrgCard node={child} level={level + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const OrgChartPage: React.FC = () => {
  const [scale, setScale] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['org-tree'],
    queryFn: () => orgApi.getTree().then(r => r.data.data as OrgNode[]),
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Organization Chart"
        subtitle="Visual representation of the reporting hierarchy"
        actions={
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary btn-sm"
              onClick={() => setScale(s => Math.max(0.4, s - 0.1))}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-surface-400 text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
            <button
              className="btn-secondary btn-sm"
              onClick={() => setScale(s => Math.min(1.5, s + 0.1))}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button className="btn-secondary btn-sm" onClick={() => setScale(1)}>
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        }
      />

      <div className="card overflow-auto p-8" style={{ minHeight: '600px' }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : !data || data.length === 0 ? (
          <EmptyState
            title="No hierarchy data"
            description="Add employees with manager assignments to see the org chart"
            icon={GitBranch}
          />
        ) : (
          <div
            className="inline-block transition-transform duration-200 origin-top"
            style={{ transform: `scale(${scale})` }}
          >
            <div className="flex gap-12 items-start">
              {data.map((root) => (
                <OrgCard key={root.id} node={root} level={0} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrgChartPage;
