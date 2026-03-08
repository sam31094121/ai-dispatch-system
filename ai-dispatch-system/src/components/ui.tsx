// ==========================================
// 共用 UI 元件
// ==========================================
import React from 'react';
import { cn } from '../lib/utils';

export const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden", className)}>
    {children}
  </div>
);

export const CardHeader = ({ title, icon: Icon, action, className }: {
  title: string; icon?: any; action?: React.ReactNode; className?: string;
}) => (
  <div className={cn("px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50", className)}>
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-4.5 h-4.5 text-slate-500" />}
      <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
    </div>
    {action && <div>{action}</div>}
  </div>
);

export const CardContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("p-5", className)}>{children}</div>
);

export const Badge = ({ text, color = 'indigo' }: { text: string; color?: string }) => {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-100 text-indigo-700',
    red: 'bg-red-100 text-red-700',
    orange: 'bg-orange-100 text-orange-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    green: 'bg-green-100 text-green-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    slate: 'bg-slate-100 text-slate-600',
  };
  return <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold", colors[color])}>{text}</span>;
};

export const MetricCard = ({ label, value, sub, icon: Icon, color = 'indigo' }: {
  label: string; value: string | number; sub?: string; icon?: any; color?: string;
}) => {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    blue: 'bg-blue-50 text-blue-600',
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className={cn("p-3.5 rounded-xl", colors[color])}>
          {Icon && <Icon className="w-5.5 h-5.5" />}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <h4 className="text-xl font-bold text-slate-800 truncate">{value}</h4>
          {sub && <p className="text-xs text-emerald-600 font-medium mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
};

export const ProgressBar = ({ value, max = 100, color = 'bg-indigo-500' }: {
  value: number; max?: number; color?: string;
}) => (
  <div className="w-full bg-slate-100 rounded-full h-2">
    <div className={cn("h-2 rounded-full transition-all duration-500", color)}
      style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
  </div>
);
