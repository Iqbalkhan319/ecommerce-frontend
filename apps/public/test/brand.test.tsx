import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrandMark, OwnerAvatar, OwnerBadge } from '@ecom/ui';

describe('brand marks', () => {
  it('shows the wordmark when no logo is configured', () => {
    render(<BrandMark identity={{ name: 'Aurelia' }} />);
    expect(screen.getByText('Aurelia')).toBeTruthy();
  });

  it('shows the logo image and hides the redundant wordmark', () => {
    const { container } = render(
      <BrandMark identity={{ name: 'Aurelia', logoSrc: '/brand/logo.svg', logoWidth: 96, logoHeight: 24 }} />,
    );
    const img = container.querySelector('img')!;
    expect(img.getAttribute('src')).toBe('/brand/logo.svg');
    expect(img.getAttribute('width')).toBe('96');
    expect(screen.queryByText('Aurelia')).toBeNull();
  });

  it('keeps the wordmark beside an icon mark when asked', () => {
    render(<BrandMark identity={{ name: 'Aurelia', logoSrc: '/brand/icon.svg', logoWithName: true }} />);
    expect(screen.getByText('Aurelia')).toBeTruthy();
  });

  it('renders the owner portrait at avatar size', () => {
    const { container } = render(
      <OwnerBadge owner={{ name: 'Site Owner', role: 'Founder', imageSrc: '/brand/owner.jpg' }} size="lg" />,
    );
    const img = container.querySelector('img')!;
    expect(img.getAttribute('src')).toBe('/brand/owner.jpg');
    expect(img.getAttribute('width')).toBe('56');
    expect(img.className).toContain('rounded-full');
    expect(screen.getByText('Site Owner')).toBeTruthy();
    expect(screen.getByText('Founder')).toBeTruthy();
  });

  it('falls back to initials when the image is not configured yet', () => {
    render(<OwnerAvatar owner={{ name: 'Ada Rahman' }} />);
    expect(screen.getByText('AR')).toBeTruthy();
  });

  it('renders nothing without an owner name', () => {
    const { container } = render(<OwnerBadge owner={{ name: '' }} />);
    expect(container.innerHTML).toBe('');
  });
});
