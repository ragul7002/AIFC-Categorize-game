import React from 'react';

interface CardProps {
  children: React.ReactNode;
  hoverable?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  className = '',
  style = {},
  onClick,
}) => {
  return (
    <div
      className={`card-3d ${hoverable ? 'hoverable' : ''} ${className}`}
      style={{
        padding: '24px',
        ...style,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
