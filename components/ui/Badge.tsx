'use client';

import { memo } from 'react';

interface BadgeProps {
  label: string;
  variant: 'high' | 'medium' | 'low' | 'info' | 'default';
  size?: 'sm' | 'md';
}

const VARIANT_CLASS: Record<BadgeProps['variant'], string> = {
  high: 'badge-high',
  medium: 'badge-medium',
  low: 'badge-low',
  info: 'badge-info',
  default: 'badge-default',
};

/** Renders a small coloured pill indicating severity, status, or metadata. */
export const Badge = memo(function Badge({ label, variant, size = 'md' }: BadgeProps) {
  const sizeClass = size === 'sm' ? 'badge-sm' : '';
  return (
    <span className={`badge ${VARIANT_CLASS[variant]} ${sizeClass}`}>
      {label}
    </span>
  );
});
