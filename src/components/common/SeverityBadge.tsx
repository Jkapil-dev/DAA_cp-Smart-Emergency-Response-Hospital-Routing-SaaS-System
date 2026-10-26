import React from 'react';
import { SeverityLevel } from '../../types/incident';
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';

interface SeverityBadgeProps {
  severity: SeverityLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  size = 'md',
  showIcon = true,
}) => {
  const config = {
    critical: {
      label: 'CRITICAL',
      bg: 'bg-rose-100 text-rose-800 border-rose-300',
      iconBg: 'text-rose-600',
      Icon: AlertCircle,
    },
    severe: {
      label: 'SEVERE',
      bg: 'bg-orange-100 text-orange-800 border-orange-300',
      iconBg: 'text-orange-600',
      Icon: AlertTriangle,
    },
    moderate: {
      label: 'MODERATE',
      bg: 'bg-amber-100 text-amber-800 border-amber-300',
      iconBg: 'text-amber-600',
      Icon: Info,
    },
    minor: {
      label: 'MINOR',
      bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      iconBg: 'text-emerald-600',
      Icon: CheckCircle,
    },
  }[severity];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }[size];

  const { Icon } = config;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold tracking-wider rounded-md border ${config.bg} ${sizeClasses}`}
    >
      {showIcon && <Icon className={`w-3.5 h-3.5 ${config.iconBg}`} />}
      {config.label}
    </span>
  );
};
