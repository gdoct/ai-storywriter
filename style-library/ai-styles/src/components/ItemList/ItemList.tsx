import type { CSSProperties, ReactNode } from 'react';
import React from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import './ItemList.css';

export interface ItemListItem {
  /** Unique key for the item */
  key: string;
  /** Main content for the item */
  content: ReactNode;
  /** Optional custom class for the item */
  className?: string;
  /** Optional custom style for the item */
  style?: CSSProperties;
}

export interface ItemListProps {
  /** List of items to display (max 5 shown) */
  items: ItemListItem[];
  /** Callback for the 'View more...' link */
  onViewMore?: () => void;
  /** Text for the 'View more...' link */
  viewMoreText?: string;
  /** Additional CSS class name for the list */
  className?: string;
  /** Custom class for the 'View more...' link */
  viewMoreClassName?: string;
  /** Custom style for the list */
  style?: CSSProperties;
}

/**
 * ItemList: Shows up to 5 items with customizable styling and a 'View more...' link.
 */
export const ItemList: React.FC<ItemListProps> = ({
  items,
  onViewMore,
  viewMoreText = 'View more...',
  className = '',
  viewMoreClassName = '',
  style,
}) => {
  const { resolvedTheme } = useTheme();

  const visibleItems = items.slice(0, 5);
  const hasMore = items.length > 5;

  return (
    <div
      className={`ai-item-list ${className}`.trim()}
      style={style}
      data-theme={resolvedTheme}
    >
      <div className="ai-item-list__top">
        {hasMore && (
          <button
            className={`ai-item-list__view-more ${viewMoreClassName}`.trim()}
            onClick={onViewMore}
            type="button"
          >
            {viewMoreText}
          </button>
        )}
      </div>
      <ul className="ai-item-list__items">
        {visibleItems.map(item => (
          <li
            key={item.key}
            className={`ai-item-list__item ${item.className || ''}`.trim()}
            style={item.style}
          >
            {item.content}
          </li>
        ))}
      </ul>
    </div>
  );
};
