import React from 'react';
import logoImg from '../assets/logo.png';

interface EgretLogoProps {
  className?: string;
  size?: number | string;
}

export const EgretLogo: React.FC<EgretLogoProps> = ({ className, size = 24 }) => (
  <img 
    src={logoImg} 
    alt="Egret Logo" 
    width={size} 
    height={size} 
    className={className} 
    style={{ minWidth: size, objectFit: 'contain' }} 
  />
);
