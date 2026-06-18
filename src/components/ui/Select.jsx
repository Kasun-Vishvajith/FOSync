import { forwardRef } from 'react';

const Select = forwardRef(function Select(
  { label, error, id, options = [], placeholder, className = '', ...props },
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
      <select
        ref={ref}
        id={id}
        className={`
          w-full px-3.5 py-2.5 rounded-none
          bg-surface-900 border-2 border-surface-100
          text-surface-100
          transition-all duration-100
          focus:outline-none focus:translate-x-[-1px] focus:translate-y-[-1px] focus:shadow-[2px_2px_0px_0px_var(--color-surface-100)]
          ${error ? 'border-red-600 focus:shadow-[2px_2px_0px_0px_#dc2626]' : ''}
          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option value="" className="text-surface-500 bg-surface-900">
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-surface-900 text-surface-100">
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm font-semibold text-red-600 animate-slide-down">{error}</p>
      )}
    </div>
  );
});

export default Select;
