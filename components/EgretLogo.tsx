import React from 'react';
// 1. 直接 import 图片 (根据你的相对目录结构调整路径，这里假设 assets 与 components 平级)
import logoImg from '../assets/logo.png';

interface EgretLogoProps {
    className?: string;
    size?: number | string;
}

export const EgretLogo: React.FC<EgretLogoProps> = ({ className, size = 60 }) => (
    <img
        // 2. 将 import 进来的变量直接赋值给 src
        src={logoImg}
        alt="Logo"
        className={className}
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