
import React from 'react';

export const LotusLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <path fill="#f97316" d="M50 10c-5 15-20 25-20 40 0 15 15 25 20 40 5-15 20-25 20-40 0-15-15-25-20-40z" opacity="0.8"/>
    <path fill="#ef4444" d="M50 20c-8 12-25 20-25 35 0 15 17 23 25 35 8-12 25-20 25-35 0-15-17-23-25-35z" opacity="0.9"/>
    <path fill="#f59e0b" d="M50 30c-10 10-15 20-15 30 0 10 5 20 15 30 10-10 15-20 15-30 0-10-5-20-15-30z"/>
    <text x="50" y="55" fontSize="8" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="Playfair Display">BALI</text>
    <text x="50" y="65" fontSize="6" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="Playfair Display">SPIRIT</text>
  </svg>
);
