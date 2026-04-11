import React from 'react';

interface EgretLogoProps {
    className?: string;
    size?: number | string;
}

export const EgretLogo: React.FC<EgretLogoProps> = ({ className, size = 60 }) => (
    <img
        src="/egret-logo.png" /* 注意：请确保名字和你 public 里的完全一致（区分大小写）*/
        alt="Logo"
        className={className}
        style={{
            width: size,         // 强制指定宽度
            height: size,        // 强制指定高度，防止 Tailwind 默认的 height: auto 导致高度坍塌
            minWidth: size,      // 最小宽度防御
            minHeight: size,     // 最小高度防御
            objectFit: 'contain',// 保证图片完整显示不被拉伸
            display: 'block'     // 防止图片底部出现默认的幽灵空白
        }}
    />
);