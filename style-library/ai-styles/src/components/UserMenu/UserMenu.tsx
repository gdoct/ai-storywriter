import React, { useEffect, useRef, useState } from 'react';
import styles from './UserMenu.module.css';

export interface UserMenuProps {
  /** The username to display in the menu */
  username: string;
  /** The email to display in the menu */
  email?: string;
  /** User's avatar image URL */
  avatarUrl?: string;
  /** User tier/subscription level */
  tier?: string;
  /** User roles */
  roles?: string[];
  /** Credit count to display */
  credits?: number;
  /** Menu items to display */
  menuItems: UserMenuItem[];
  /** Callback for logout */
  onLogout: () => void;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show the username next to avatar */
  showUsername?: boolean;
  /** Custom actions to show in the header (e.g., ThemeToggle) */
  customActions?: React.ReactNode;
}

export interface UserMenuItem {
  /** Menu item label */
  label: string;
  /** Menu item icon (optional) */
  icon?: React.ReactNode;
  /** Click handler */
  onClick: () => void;
  /** Whether this item is a divider */
  divider?: boolean;
  /** Custom CSS class */
  className?: string;
  /** Whether to show for specific roles only */
  roles?: string[];
}

const UserMenu: React.FC<UserMenuProps> = ({
  username,
  email,
  avatarUrl,
  tier,
  roles = [],
  credits,
  menuItems,
  onLogout,
  size = 'md',
  showUsername = false,
  customActions
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Get user initials
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleItemClick = (item: UserMenuItem) => {
    item.onClick();
    setIsOpen(false);
  };

  const handleLogoutClick = () => {
    onLogout();
    setIsOpen(false);
  };

  // Filter menu items based on user roles
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.some(role => roles.includes(role));
  });

  return (
    <div className={styles.userMenu} ref={menuRef}>
      <button
        ref={buttonRef}
        className={`${styles.userButton} ${styles[size]} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        <div className={styles.avatar}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={username} className={styles.avatarImage} />
          ) : (
            <span className={styles.avatarInitials}>
              {getInitials(username)}
            </span>
          )}
        </div>
        {showUsername && (
          <span className={styles.username}>{username}</span>
        )}
        <svg 
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
          width="16" 
          height="16" 
          viewBox="0 0 16 16" 
          fill="none"
        >
          <path 
            d="M4 6L8 10L12 6" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <div className={styles.userInfo}>
              <div className={styles.headerAvatar}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={username} />
                ) : (
                  <span>{getInitials(username)}</span>
                )}
              </div>
              <div className={styles.userDetails}>
                <div className={styles.headerUsername}>{username}</div>
                {email && <div className={styles.headerEmail}>{email}</div>}
              </div>
            </div>
            
            {(tier || roles.length > 0 || credits !== undefined) && (
              <div className={styles.badges}>
                {tier && (
                  <span className={`${styles.badge} ${styles.tierBadge} ${styles[`tier-${tier.toLowerCase()}`]}`}>
                    {tier.toUpperCase()}
                  </span>
                )}
                {roles.map(role => (
                  <span key={role} className={`${styles.badge} ${styles.roleBadge} ${styles[`role-${role.toLowerCase()}`]}`}>
                    {role.toUpperCase()}
                  </span>
                ))}
                {credits !== undefined && (
                  <span className={`${styles.badge} ${styles.creditsBadge}`}>
                    {credits.toLocaleString()} credits
                  </span>
                )}
              </div>
            )}
            
            {customActions && (
              <div className={styles.customActions}>
                {customActions}
              </div>
            )}
          </div>

          <div className={styles.dropdownContent}>
            {filteredMenuItems.map((item, index) => (
              item.divider ? (
                <div key={index} className={styles.divider} />
              ) : (
                <button
                  key={index}
                  className={`${styles.menuItem} ${item.className || ''}`}
                  onClick={() => handleItemClick(item)}
                >
                  {item.icon && <span className={styles.menuIcon}>{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              )
            ))}
            
            {filteredMenuItems.length > 0 && <div className={styles.divider} />}
            
            <button
              className={`${styles.menuItem} ${styles.logoutItem}`}
              onClick={handleLogoutClick}
            >
              <span className={styles.menuIcon}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path 
                    d="M6 2H3C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H6M10 5L13 8M13 8L10 11M13 8H6" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
