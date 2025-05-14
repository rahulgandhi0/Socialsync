import React from 'react';

const GlowButton = ({ children, onClick, className, type = 'button', disabled = false }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        bg-gradient-to-r from-gradient-start via-gradient-mid to-gradient-end 
        ${!disabled ? 'hover:animate-glow-flow focus:animate-glow-flow hover:shadow-lg' : 'opacity-50 cursor-not-allowed'}
        text-white font-medium py-2 px-6 rounded-md 
        transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-gradient-mid focus:ring-opacity-50
        ${className || ''}
      `}
    >
      {children}
    </button>
  );
};

export default GlowButton; 