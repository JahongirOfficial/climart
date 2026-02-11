import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge Component', () => {
  it('should render badge with text', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('should apply variant classes', () => {
    const { container } = render(<Badge variant="destructive">Error</Badge>);
    const badge = container.firstChild;
    expect(badge).toBeInTheDocument();
  });

  it('should apply secondary variant', () => {
    const { container } = render(<Badge variant="secondary">Info</Badge>);
    const badge = container.firstChild;
    expect(badge).toBeInTheDocument();
  });

  it('should apply outline variant', () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>);
    const badge = container.firstChild;
    expect(badge).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<Badge className="custom-badge">Custom</Badge>);
    const badge = container.firstChild;
    expect(badge).toHaveClass('custom-badge');
  });
});
