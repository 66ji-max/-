import React from 'react';

interface EgretLogoProps {
  className?: string;
  size?: number | string;
  strokeWidth?: number;
}

export const EgretLogo: React.FC<EgretLogoProps> = ({ className, size = 24, strokeWidth = 1.5 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    width={size}
    height={size}
    fill="currentColor"
    className={className}
    style={{ minWidth: size }}
  >
    {/* Stylized White Egret in Flight */}
    <path d="M90,25 C85,25 80,30 75,35 C70,40 65,45 60,45 C55,45 50,40 50,35 C50,30 55,20 60,15 L65,10 L50,15 C40,18 30,25 25,35 C20,45 15,55 15,65 C15,75 25,75 30,70 C35,65 40,60 50,60 C60,60 70,65 80,60 C90,55 95,45 95,35 C95,30 92,25 90,25 Z M30,70 C25,75 20,70 20,60 C20,50 30,40 40,35 C45,32 50,35 50,40 C50,45 40,55 30,70 Z" />
    <circle cx="80" cy="25" r="2" />
  </svg>
);
