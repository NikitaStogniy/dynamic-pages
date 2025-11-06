'use client';

import { useCallback, memo } from 'react';
import { motion } from 'framer-motion';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  const onDragEnd = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: { velocity: { y: number }; point: { y: number } }) => {
    const shouldClose =
      info.velocity.y > 20 || (info.velocity.y >= 0 && info.point.y > 45);
    if (shouldClose) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      <motion.div
        drag="y"
        onDragEnd={onDragEnd}
        initial={{ y: '100%' }}
        animate={{ y: '30%' }}
        exit={{ y: '100%' }}
        transition={{
          type: 'spring',
          damping: 40,
          stiffness: 400
        }}
        dragConstraints={{ top: 0 }}
        dragElastic={0.2}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 h-[90vh] max-h-[768px]"
        style={{
          boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.06), 0px 2px 13px rgba(0, 0, 0, 0.12)'
        }}
      >
        {/* Drag Handle */}
        <div
          className="flex items-end justify-center h-6 cursor-row-resize hover:bg-gray-50 transition-colors"
        >
          <div className="w-12 h-1 bg-gray-300 rounded-full mb-2 hover:bg-gray-400 transition-colors" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200">
          <span className="text-lg font-semibold">{title || 'Bottom Sheet'}</span>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </motion.div>
    </>
  );
}

export default memo(BottomSheet);