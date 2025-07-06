import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  it('renders children in the center', () => {
    render(<Footer>Center Content</Footer>);
    expect(screen.getByText('Center Content')).toBeInTheDocument();
  });

  it('renders left and right content', () => {
    render(
      <Footer left={<span>Left</span>} right={<span>Right</span>}>
        Center
      </Footer>
    );
    expect(screen.getByText('Left')).toBeInTheDocument();
    expect(screen.getByText('Right')).toBeInTheDocument();
    expect(screen.getByText('Center')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Footer className="custom-footer">Content</Footer>);
    const footer = screen.getByTestId('footer-section');
    expect(footer).toHaveClass('custom-footer');
  });

  it('applies custom background and text color', () => {
    render(
      <Footer backgroundColor="#123456" color="#abcdef">
        Colors
      </Footer>
    );
    const footer = screen.getByTestId('footer-section');
    expect(footer).toHaveStyle('background-color: #123456');
    expect(footer).toHaveStyle('color: #abcdef');
  });
});
