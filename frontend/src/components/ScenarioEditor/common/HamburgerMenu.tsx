import React, { useCallback, useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { Button } from './Button';
import './HamburgerMenu.css';

export interface HamburgerMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  className?: string;
  title?: string;
  'data-testid'?: string;
}

interface HamburgerMenuProps {
  items: HamburgerMenuItem[];
  className?: string;
  disabled?: boolean;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  items,
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    if (disabled) return;
    setIsOpen(prev => !prev);
  }, [disabled]);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleItemClick = useCallback((item: HamburgerMenuItem) => {
    item.onClick();
    closeMenu();
  }, [closeMenu]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const menuContainer = document.querySelector('.hamburger-menu');
      if (isOpen && menuContainer && !menuContainer.contains(target)) {
        closeMenu();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, closeMenu]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        closeMenu();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isOpen, closeMenu]);

  return (
    <div className={`hamburger-menu ${className}`}>
      <button 
        className={`hamburger-menu__toggle ${disabled ? 'hamburger-menu__toggle--disabled' : ''}`}
        onClick={toggleMenu}
        aria-label="Toggle menu"
        aria-expanded={isOpen}
        disabled={disabled}
      >
        {isOpen ? <FaTimes /> : <span className="hamburger-menu__icon">☰</span>}
      </button>
      
      {/* Menu Dropdown */}
      {isOpen && (
        <div className="hamburger-menu__dropdown">
          {items.map((item) => (
            <Button
              key={item.id}
              variant={item.variant || 'secondary'}
              onClick={() => handleItemClick(item)}
              icon={item.icon}
              disabled={item.disabled}
              loading={item.loading}
              className={item.className}
              title={item.title}
              data-testid={item['data-testid']}
            >
              {item.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
