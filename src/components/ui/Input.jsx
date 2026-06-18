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
          className="block text-sm font-semibold text-surface-200"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`
          w-full px-3.5 py-2.5 rounded-none
          bg-surface-900 border-2 border-surface-100
          text-surface-100 placeholder:text-surface-500
          transition-all duration-100
          focus:outline-none focus:translate-x-[-1px] focus:translate-y-[-1px] focus:shadow-[2px_2px_0px_0px_var(--color-surface-100)]
          ${error ? 'border-red-600 focus:shadow-[2px_2px_0px_0px_#dc2626]' : ''}
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
