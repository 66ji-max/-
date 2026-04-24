import React from 'react';

interface EgretLogoProps {
    className?: string;
    size?: number | string;
}

export const EgretLogo: React.FC<EgretLogoProps> = ({ className, size = 60 }) => (
    <img
        src="/logo.png"
        alt="Logo"
        className={className}
        onError={(e) => console.error('Logo failed to load:', e.currentTarget.src)}
        style={{
            width: size,
            height: size,
            minWidth: size,
            minHeight: size,
            objectFit: 'contain',
            display: 'block'
        }}
    />
);
