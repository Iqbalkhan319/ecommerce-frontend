'use client';

import * as React from 'react';
import { IconButton } from '@ecom/ui';

export function ThemeToggle() {
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('aurelia-theme', next ? 'dark' : 'light');
    } catch {
      // A blocked storage API must not break the toggle itself.
    }
  };

  return (
    <IconButton label={dark ? 'Switch to the light theme' : 'Switch to the dark theme'} onClick={toggle}>
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.6">
        {dark ? (
          <circle cx="12" cy="12" r="4.5" />
        ) : (
          <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" strokeLinejoin="round" />
        )}
      </svg>
    </IconButton>
  );
}
