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
          className="block text-sm font-medium text-[var(--color-text-primary)]"
        >
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={`
          w-full px-3.5 py-2.5 rounded-[var(--radius-md)]
          bg-[var(--color-surface)] border border-[var(--color-border)]
          text-[var(--color-text-primary)]
          transition-all duration-200 shadow-[var(--shadow-soft)]
          focus:outline-none focus:border-[var(--color-accent)] focus:ring-[3px] focus:ring-[var(--color-accent-subtle)]
          hover:bg-[var(--color-surface-hover)]
          ${error ? 'border-[#da1e28] focus:border-[#da1e28] focus:ring-[#da1e28]/10' : ''}
          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option value="" className="text-[var(--color-text-secondary)] bg-[var(--color-surface)]">
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[var(--color-surface)] text-[var(--color-text-primary)]">
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm font-medium text-[#da1e28] animate-slide-down">{error}</p>
      )}
    </div>
  );
});

export default Select;
