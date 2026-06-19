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
          className="block text-sm font-medium text-surface-200"
        >
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={`
          w-full px-3.5 py-2.5 rounded-xl
          bg-surface-900 border border-surface-700
          text-surface-100
          transition-all duration-200 shadow-sm
          focus:outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-600/10
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
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
