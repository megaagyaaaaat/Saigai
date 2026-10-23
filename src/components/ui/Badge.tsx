import React from 'react';
import type { RiskLevel } from '../../features/regions/region.types';

interface BadgeProps {
  level?: RiskLevel | 'user_drawn' | 'operational' | 'maintenance' | 'offline';
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ level = 'low', label, className = '', size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  let colorClasses = 'bg-ner-panel border-ner-border text-ner-muted';
  let dotColor = 'bg-ner-muted';

  switch (level) {
    case 'critical':
      colorClasses = 'bg-ner-red/15 border-ner-red/40 text-ner-red shadow-glow-red';
      dotColor = 'bg-ner-red animate-pulse';
      break;
    case 'high':
      colorClasses = 'bg-ner-orange/15 border-ner-orange/40 text-ner-orange';
      dotColor = 'bg-ner-orange';
      break;
    case 'elevated':
      colorClasses = 'bg-ner-amber/15 border-ner-amber/40 text-ner-amber';
      dotColor = 'bg-ner-amber';
      break;
    case 'low':
    case 'operational':
      colorClasses = 'bg-ner-emerald/15 border-ner-emerald/40 text-ner-emerald';
      dotColor = 'bg-ner-emerald';
      break;
    case 'user_drawn':
      colorClasses = 'bg-ner-cyan/15 border-ner-cyan/40 text-ner-cyan shadow-glow-cyan';
      dotColor = 'bg-ner-cyan animate-ping';
      break;
    case 'maintenance':
      colorClasses = 'bg-ner-amber/15 border-ner-amber/40 text-ner-amber';
      dotColor = 'bg-ner-amber';
      break;
    case 'offline':
      colorClasses = 'bg-ner-muted/15 border-ner-muted/40 text-ner-muted';
      dotColor = 'bg-ner-muted';
      break;
  }

  const displayLabel = label || level.toUpperCase().replace('_', ' ');

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-full border transition-colors ${sizeClasses} ${colorClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{displayLabel}</span>
    </span>
  );
};
