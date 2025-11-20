
import React from 'react';

interface AuraLogoProps {
  className?: string;
  size?: number;
}

const AuraLogo: React.FC<AuraLogoProps> = ({ className = "", size = 40 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="auraLeft" x1="0" y1="0" x2="100" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#9F2BFF" />
          <stop offset="1" stopColor="#7F00FF" />
        </linearGradient>
        <linearGradient id="auraRight" x1="200" y1="0" x2="100" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FF4B6E" />
          <stop offset="1" stopColor="#FF8F70" />
        </linearGradient>
        <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="white" stopOpacity="1" />
          <stop offset="0.4" stopColor="white" stopOpacity="0.8" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      
      {/* Left Soul (Purple) - Organic Bean Shape */}
      <g transform="translate(85 100) rotate(-25)">
         <path 
            d="M0 0 Ellipse 45 60"
         />
         <ellipse cx="0" cy="0" rx="48" ry="65" fill="url(#auraLeft)" style={{ filter: 'blur(0.5px)' }} />
      </g>

      {/* Right Soul (Coral) - Organic Bean Shape */}
      <g transform="translate(115 100) rotate(25)">
         <ellipse cx="0" cy="0" rx="48" ry="65" fill="url(#auraRight)" style={{ filter: 'blur(0.5px)' }} />
      </g>

      {/* The Fusion Burst */}
      <g>
        <circle cx="100" cy="100" r="18" fill="url(#glow)" style={{ mixBlendMode: 'screen', filter: 'blur(6px)' }} />
        <circle cx="100" cy="100" r="8" fill="white" style={{ boxShadow: '0 0 20px white' }} />
        
        {/* Lens Flares */}
        <path d="M60 100 L140 100" stroke="white" strokeWidth="2" strokeLinecap="round" style={{ filter: 'blur(2px)', opacity: 0.8 }} />
        <path d="M100 70 V130" stroke="white" strokeWidth="2" strokeLinecap="round" style={{ filter: 'blur(3px)', opacity: 0.5 }} />
      </g>
    </svg>
  );
};

export default AuraLogo;
