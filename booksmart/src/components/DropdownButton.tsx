import React, { useState, useRef, useEffect } from 'react';
import './styles/DropdownButton.css';

export interface DropdownOption {
  label: string;
  value: string;
  icon?: string;
  onClick: () => void;
  divider?: boolean;
}

interface DropdownButtonProps {
  label: string;
  icon?: string;
  options: DropdownOption[];
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}

/**
 * Reusable dropdown button component
 * Used for action menus throughout the application
 */
const DropdownButton: React.FC<DropdownButtonProps> = ({
  label,
  icon,
  options,
  className = '',
  variant = 'secondary'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionClick = (option: DropdownOption) => {
    option.onClick();
    setIsOpen(false);
  };

  return (
    <div className={`dropdown-button-container ${className}`} ref={dropdownRef}>
      <button
        className={`dropdown-button dropdown-button-${variant}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {icon && <span className="dropdown-button-icon">{icon}</span>}
        <span className="dropdown-button-label">{label}</span>
        <span className="dropdown-button-arrow">▼</span>
      </button>

      {isOpen && (
        <div className="dropdown-menu" role="menu">
          {options.map((option, index) => (
            option.divider ? (
              <div key={`divider-${index}`} className="dropdown-divider" />
            ) : (
              <button
                key={option.value}
                className="dropdown-menu-item"
                onClick={() => handleOptionClick(option)}
                role="menuitem"
              >
                {option.icon && <span className="dropdown-item-icon">{option.icon}</span>}
                <span className="dropdown-item-label">{option.label}</span>
              </button>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownButton;
