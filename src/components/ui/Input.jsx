import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, error, id, className = '', ...props },
  ref
) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-surface-200"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`
          w-full px-3.5 py-2.5 rounded-xl
          bg-surface-900 border border-surface-700
          text-surface-100 placeholder:text-surface-500
          transition-all duration-200 shadow-sm
          focus:outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-600/10
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm font-semibold text-red-600 animate-slide-down">{error}</p>
      )}
    </div>
  );
});

export default Input;
