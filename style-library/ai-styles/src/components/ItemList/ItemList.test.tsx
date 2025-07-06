import { fireEvent, render, screen } from '@testing-library/react';
import { ItemList } from './ItemList';

describe('ItemList', () => {
  const items = [
    { key: '1', content: 'Item 1' },
    { key: '2', content: 'Item 2' },
    { key: '3', content: 'Item 3' },
    { key: '4', content: 'Item 4' },
    { key: '5', content: 'Item 5' },
    { key: '6', content: 'Item 6' },
  ];

  it('renders up to 5 items', () => {
    render(<ItemList items={items} />);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 5')).toBeInTheDocument();
    expect(screen.queryByText('Item 6')).not.toBeInTheDocument();
  });

  it('shows view more link if more than 5 items', () => {
    render(<ItemList items={items} />);
    expect(screen.getByText('View more...')).toBeInTheDocument();
  });

  it('calls onViewMore when view more is clicked', () => {
    const onViewMore = jest.fn();
    render(<ItemList items={items} onViewMore={onViewMore} />);
    fireEvent.click(screen.getByText('View more...'));
    expect(onViewMore).toHaveBeenCalled();
  });

  it('applies custom className to list and items', () => {
    render(
      <ItemList
        items={items.map(i => ({ ...i, className: 'custom-item' }))}
        className="custom-list"
      />
    );
    expect(screen.getByRole('list').parentElement).toHaveClass('custom-list');
    expect(screen.getAllByText(/Item/)[0].closest('li')).toHaveClass('custom-item');
  });
});
