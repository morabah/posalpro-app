'use client';

import { useEffect } from 'react';

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function FilterDrawer({ open, onClose, children }: FilterDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <div className={`lg:hidden ${open ? 'fixed inset-0 z-50' : 'hidden'}`} aria-hidden={!open}>
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl">
        <div className="mx-auto w-full max-w-3xl">
          {children}
        </div>
      </div>
    </div>
  );
}
