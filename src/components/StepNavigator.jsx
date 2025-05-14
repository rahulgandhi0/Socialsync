import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * StepNavigator - A reusable component for step-based navigation
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to display in the middle section
 * @param {Function} props.onPrevious - Function to call on previous button click (default: navigate back)
 * @param {Function} props.onNext - Function to call on next button click (default: navigate forward)
 * @param {boolean} props.isPreviousDisabled - Whether the previous button should be disabled
 * @param {boolean} props.isNextDisabled - Whether the next button should be disabled
 * @param {boolean} props.hidePrevious - Whether to hide the previous button completely
 * @param {boolean} props.hideNext - Whether to hide the next button completely
 */
const StepNavigator = ({
  children,
  onPrevious,
  onNext,
  isPreviousDisabled = false,
  isNextDisabled = false,
  hidePrevious = false,
  hideNext = false
}) => {
  const navigate = useNavigate();

  // Default handlers use navigate
  const handlePrevious = onPrevious || (() => navigate(-1));
  const handleNext = onNext || (() => navigate(1));

  return (
    <div className="flex justify-between items-start w-full max-w-6xl mx-auto px-6 mt-8 mb-4">
      {!hidePrevious && (
        <button
          onClick={handlePrevious}
          disabled={isPreviousDisabled}
          aria-label="Previous Step"
          className={`
            ${isPreviousDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gradient-to-r hover:from-gradient-start hover:to-gradient-end hover:text-white'}
            text-3xl font-medium px-4 py-2 rounded-full
            transition-all duration-300 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-gradient-mid focus:ring-opacity-50
            bg-transparent
          `}
        >
          ←
        </button>
      )}
      
      <div className="flex-1 mx-4 flex justify-center">
        <div className="max-w-3xl w-full">
          {children}
        </div>
      </div>
      
      {!hideNext && (
        <button
          onClick={handleNext}
          disabled={isNextDisabled}
          aria-label="Next Step"
          className={`
            ${isNextDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gradient-to-r hover:from-gradient-start hover:to-gradient-end hover:text-white'}
            text-3xl font-medium px-4 py-2 rounded-full
            transition-all duration-300 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-gradient-mid focus:ring-opacity-50
            bg-transparent
          `}
        >
          →
        </button>
      )}
    </div>
  );
};

export default StepNavigator; 