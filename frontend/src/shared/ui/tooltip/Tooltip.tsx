import React from 'react';
import Portal from '../portal/Portal';
import styles from './Tooltip.module.scss';

export interface TooltipProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Use portal to render above all content */
  usePortal?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  className,
  style,
  usePortal = true,
}) => {
  const content = (
    <div
      className={`${styles.tooltip} ${className ?? ''}`}
      style={style}
    >
      {children}
    </div>
  );

  if (usePortal) {
    return <Portal containerId="tooltip-root">{content}</Portal>;
  }

  return content;
};

