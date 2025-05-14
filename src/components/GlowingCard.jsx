import React from 'react';

const GlowingCard = ({ title, description, children, className }) => {
  return (
    <div 
      className={`
        relative overflow-hidden rounded-lg shadow-xl 
        bg-white 
        hover:before:opacity-100 before:opacity-0
        before:content-[''] before:absolute before:inset-0
        before:bg-gradient-to-r before:from-gradient-start before:via-gradient-mid before:to-gradient-end
        before:animate-glow-flow before:transition-opacity before:duration-300
        before:blur-md before:-z-10
        ${className || ''}
      `}
    >
      <div className="relative z-10 p-6">
        {title && <h3 className="font-bold text-xl mb-2">{title}</h3>}
        {description && <p className="text-gray-600 mb-4">{description}</p>}
        {children}
      </div>
    </div>
  );
};

export default GlowingCard; 