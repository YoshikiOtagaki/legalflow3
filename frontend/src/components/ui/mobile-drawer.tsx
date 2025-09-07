'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileDrawerProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  title?: string;
  side?: 'left' | 'right';
  className?: string;
}

export function MobileDrawer({
  children,
  trigger,
  title,
  side = 'right',
  className,
}: MobileDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // ボディのスクロールを無効化
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* トリガー */}
      <div onClick={() => setIsOpen(true)}>{trigger}</div>

      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ドロワー */}
      <div
        className={cn(
          'fixed inset-y-0 z-50 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden',
          side === 'left' ? 'left-0' : 'right-0',
          isOpen
            ? 'translate-x-0'
            : side === 'left'
              ? '-translate-x-full'
              : 'translate-x-full',
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* ヘッダー */}
          <div className="flex items-center justify-between h-16 px-6 border-b">
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* コンテンツ */}
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    </>
  );
}
