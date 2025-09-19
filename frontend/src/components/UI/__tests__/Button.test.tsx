import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Button from '../Button';

describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Test Button</Button>);
    const button = screen.getByRole('button', { name: /test button/i });
    expect(button).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    render(<Button variant="primary">Primary</Button>);
    const button = screen.getByRole('button', { name: /primary/i });
    expect(button).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    render(<Button size="lg">Large Button</Button>);
    const button = screen.getByRole('button', { name: /large button/i });
    expect(button).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByRole('button', { name: /disabled button/i });
    expect(button).toBeDisabled();
  });

  it('handles loading state', () => {
    render(<Button isLoading>Loading Button</Button>);
    const button = screen.getByRole('button', { name: /loading button/i });
    // Check that the button has pointer-events: none style (which makes it effectively disabled)
    expect(button).toHaveStyle('pointer-events: none');
  });
});