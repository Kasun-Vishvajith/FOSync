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
          className="block text-sm font-medium text-surface-300"
        >
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={`
          w-full px-3.5 py-2.5 rounded-lg appearance-none
          bg-surface-800/80 border border-surface-700
          text-surface-100
          transition-all duration-200
          hover:border-surface-600
          focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
          ${error ? 'border-red-500/60' : ''}
          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option value="" className="text-surface-500">
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-surface-800">
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-400 animate-slide-down">{error}</p>
      )}
    </div>
  );
});

export default Select;
