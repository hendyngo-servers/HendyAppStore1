import React from 'react';

export interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default' }) => {
  const colors = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    success: 'bg-emerald-950/80 text-emerald-400 border-emerald-800',
    warning: 'bg-amber-950/80 text-amber-400 border-amber-800',
    danger: 'bg-rose-950/80 text-rose-400 border-rose-800',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${colors[variant]}`}>
      {label}
    </span>
  );
};
