
import React from 'react';
import { Loader2, Check } from 'lucide-react';

export const Spinner = () => <Loader2 className="w-6 h-6 animate-spin text-blue-500" />;

export const Button = ({ children, onClick, type = "button", variant = "primary", disabled = false, className = "" }: any) => {
  const base = "px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800 disabled:opacity-50";
  const variants: any = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary: "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 focus:ring-gray-500",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    outline: "bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {disabled ? <Spinner /> : children}
    </button>
  );
};

export const Card = ({ children, title, className = "" }: any) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
    {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>}
    {children}
  </div>
);

export const Input = ({ label, type = "text", value, onChange, required = false, name = "", disabled = false, id: idProp }: any) => {
  const id = idProp || name || `input-${Math.random().toString(36).slice(2, 9)}`;
  // HTML input type="date" requires yyyy-MM-dd; normalize so we never pass full ISO
  const displayValue = type === 'date' && value != null && String(value).includes('T')
    ? String(value).slice(0, 10)
    : value ?? '';
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      <input
        id={id}
        type={type}
        name={name}
        value={displayValue}
        onChange={e => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        aria-required={required}
        className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
};

/** Text input with datalist suggestions; free typing remains allowed. */
export const SuggestInput = ({
  label,
  value,
  onChange,
  options = [],
  required = false,
  name = "",
  disabled = false,
  listId: listIdProp,
  id: idProp,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options?: { value: string; label: string }[];
  required?: boolean;
  name?: string;
  disabled?: boolean;
  listId?: string;
  id?: string;
}) => {
  const id = idProp || name || `suggest-${Math.random().toString(36).slice(2, 9)}`;
  const listId = listIdProp || `${id}-list`;
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      <input
        id={id}
        name={name}
        list={listId}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        aria-required={required}
        autoComplete="off"
        className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <datalist id={listId}>
        {options.map((opt, i) => (
          <option key={`${opt.value}-${i}`} value={opt.value}>{opt.label !== opt.value ? opt.label : undefined}</option>
        ))}
      </datalist>
    </div>
  );
};

export const Select = ({ label, value, onChange, options, required = false, disabled = false, id: idProp }: any) => {
  const id = idProp || `select-${Math.random().toString(36).slice(2, 9)}`;
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        aria-required={required}
        className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
      >
        {options.map((opt: any, i: number) => (
          <option key={`${opt.value}-${i}`} value={opt.value} disabled={opt.disabled}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
};

export const MultiSelectBox = ({ label, options, selectedValues, onChange }: any) => {
  const id = `multiselect-${Math.random().toString(36).slice(2, 9)}`;
  const toggle = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v: string) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  return (
    <div className="mb-4" role="group" aria-labelledby={`${id}-label`}>
      <span id={`${id}-label`} className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{label}</span>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-gray-100/80 dark:bg-gray-700/50 p-3 rounded-md border border-gray-300 dark:border-gray-600 max-h-48 overflow-y-auto">
        {options.map((opt: any, i: number) => {
          const isSelected = selectedValues.includes(opt.value);
          return (
            <div
              key={`${opt.value}-${i}`}
              role="button"
              tabIndex={0}
              onClick={() => toggle(opt.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(opt.value); } }}
              className={`cursor-pointer flex items-center justify-between px-3 py-2 rounded-md border transition-all ${isSelected ? 'bg-blue-900/50 border-blue-500 text-blue-100' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'}`}
              aria-pressed={isSelected}
            >
              <span className="text-xs truncate mr-2" title={opt.label}>{opt.label}</span>
              {isSelected && <Check className="w-3 h-3 text-blue-400 flex-shrink-0" aria-hidden />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const Tabs = ({ tabs, activeTab, onChange, label = 'Tabs' }: any) => (
  <div className="flex space-x-1 bg-white dark:bg-gray-800 p-1 rounded-lg mb-6 border border-gray-200 dark:border-gray-700 overflow-x-auto" role="tablist" aria-label={label}>
    {tabs.map((tab: any) => (
      <button
        key={tab.id}
        role="tab"
        aria-selected={activeTab === tab.id}
        tabIndex={activeTab === tab.id ? 0 : -1}
        onClick={() => onChange(tab.id)}
        className={`flex-1 min-w-[100px] py-2 px-4 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === tab.id
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export const Checkbox = ({ label, checked, onChange, id: idProp }: any) => {
  const id = idProp || `checkbox-${Math.random().toString(36).slice(2, 9)}`;
  return (
    <label htmlFor={id} className="flex items-center space-x-3 cursor-pointer select-none">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-blue-600 focus:ring-blue-500"
        aria-checked={checked}
      />
      <span className="text-gray-700 dark:text-gray-300 text-sm">{label}</span>
    </label>
  );
};

export const Modal = ({ isOpen, onClose, title, children, onConfirm, confirmText = "Confirm", cancelText = "Cancel", confirmVariant = "danger" }: any) => {
  const titleId = `modal-title-${Math.random().toString(36).slice(2, 9)}`;
  if (!isOpen) return null;
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Escape key closes dialog
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} onKeyDown={handleKeyDown}>
      <div className="fixed inset-0 bg-black/70" onClick={onClose} role="presentation" aria-hidden="true" />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-gray-200 dark:border-gray-700" role="document">
        {title && <h3 id={titleId} className="text-xl font-bold text-gray-900 dark:text-white mb-4">{title}</h3>}
        <div className="text-gray-700 dark:text-gray-300 mb-6">
          {children}
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>{cancelText}</Button>
          {onConfirm && <Button variant={confirmVariant} onClick={onConfirm}>{confirmText}</Button>}
        </div>
      </div>
    </div>
  );
};

/** One-time display of temporary password with copy button (no alert). */
export const TempPasswordModal = ({ isOpen, onClose, tempPassword, title = 'Temporary password' }: { isOpen: boolean; onClose: () => void; tempPassword: string; title?: string }) => {
  const titleId = 'temp-password-modal-title';
  if (!isOpen) return null;
  const handleCopy = () => {
    navigator.clipboard.writeText(tempPassword);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Escape key closes dialog
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={handleKeyDown}>
      <div className="fixed inset-0 bg-black/70" onClick={onClose} role="presentation" aria-hidden="true" />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-gray-200 dark:border-gray-700" role="document">
        <h3 id={titleId} className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Copy this password and store it securely. It will not be shown again.</p>
        <div className="flex gap-2 items-center mb-6">
          <code className="flex-1 bg-gray-100 dark:bg-gray-900 px-3 py-2 rounded text-gray-900 dark:text-white font-mono text-sm break-all select-all" aria-label="Temporary password value">
            {tempPassword}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2 rounded-md font-medium bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
          >
            Copy
          </button>
        </div>
        <div className="flex justify-end">
          <Button variant="primary" onClick={onClose}>I have saved it</Button>
        </div>
      </div>
    </div>
  );
};
