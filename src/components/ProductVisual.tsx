import React from 'react';
import { ProductVisualKind } from '../types/taba';

interface ProductVisualProps {
  visualKind: ProductVisualKind;
  imageUrl?: string;
  alt: string;
  className?: string;
}

export const ProductVisual: React.FC<ProductVisualProps> = ({
  visualKind,
  imageUrl,
  alt,
  className = '',
}) => {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={alt}
        referrerPolicy="no-referrer"
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`w-full h-full flex items-center justify-center bg-slate-50 select-none ${className}`}
      aria-label={alt}
    >
      {visualKind === 'tissue' && (
        <svg viewBox="0 0 160 120" className="w-3/4 h-3/4" fill="none">
          <rect x="26" y="48" width="108" height="52" rx="8" fill="#EFF6FF" stroke="#1D4ED8" strokeWidth="2.5" />
          <path d="M56 48C56 30 70 20 80 20C90 20 104 30 104 48" fill="#FFFFFF" stroke="#1D4ED8" strokeWidth="2.5" />
          <path d="M68 48C68 35 76 28 84 32C91 35 94 42 94 48" fill="#DBEAFE" />
          <rect x="40" y="64" width="80" height="8" rx="4" fill="#1D4ED8" fillOpacity="0.16" />
          <rect x="52" y="79" width="56" height="6" rx="3" fill="#DC2626" fillOpacity="0.7" />
        </svg>
      )}
      {visualKind === 'detergent' && (
        <svg viewBox="0 0 160 120" className="w-3/4 h-3/4" fill="none">
          <rect x="66" y="16" width="28" height="12" rx="3" fill="#DC2626" />
          <path
            d="M56 32H104L114 54V98C114 102.418 110.418 106 106 106H54C49.5817 106 46 102.418 46 98V54L56 32Z"
            fill="#EFF6FF"
            stroke="#1D4ED8"
            strokeWidth="2.5"
          />
          <rect x="60" y="56" width="40" height="32" rx="6" fill="#1D4ED8" fillOpacity="0.12" stroke="#1D4ED8" strokeWidth="1.5" />
          <circle cx="80" cy="72" r="8" fill="#1D4ED8" fillOpacity="0.25" />
          <path d="M98 40C106 40 112 46 112 56" stroke="#1D4ED8" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )}
      {visualKind === 'plastic' && (
        <svg viewBox="0 0 160 120" className="w-3/4 h-3/4" fill="none">
          <rect x="34" y="42" width="92" height="14" rx="4" fill="#1D4ED8" fillOpacity="0.15" stroke="#1D4ED8" strokeWidth="2.5" />
          <path d="M40 56H120L114 96C113.5 99.5 110.5 102 107 102H53C49.5 102 46.5 99.5 46 96L40 56Z" fill="#FFFFFF" stroke="#1D4ED8" strokeWidth="2.5" />
          <rect x="50" y="28" width="60" height="14" rx="4" fill="#FEE2E2" stroke="#DC2626" strokeWidth="2" />
          <line x1="58" y1="74" x2="102" y2="74" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
      {visualKind === 'kitchenware' && (
        <svg viewBox="0 0 160 120" className="w-3/4 h-3/4" fill="none">
          <ellipse cx="72" cy="72" rx="40" ry="18" fill="#EFF6FF" stroke="#1D4ED8" strokeWidth="2.5" />
          <ellipse cx="72" cy="68" rx="32" ry="12" fill="#FFFFFF" stroke="#1D4ED8" strokeWidth="1.5" />
          <path d="M110 70L142 62" stroke="#DC2626" strokeWidth="6" strokeLinecap="round" />
          <path d="M58 50C58 44 62 40 62 34M74 48C74 42 78 38 78 32" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
      {visualKind === 'personalcare' && (
        <svg viewBox="0 0 160 120" className="w-3/4 h-3/4" fill="none">
          <path d="M80 18V32M68 18H90" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round" />
          <rect x="64" y="32" width="32" height="10" rx="3" fill="#DBEAFE" stroke="#1D4ED8" strokeWidth="2" />
          <rect x="54" y="42" width="52" height="62" rx="12" fill="#FFFFFF" stroke="#1D4ED8" strokeWidth="2.5" />
          <rect x="64" y="58" width="32" height="28" rx="5" fill="#EFF6FF" stroke="#1D4ED8" strokeWidth="1.5" />
          <circle cx="80" cy="72" r="5" fill="#DC2626" fillOpacity="0.75" />
        </svg>
      )}
    </div>
  );
};
