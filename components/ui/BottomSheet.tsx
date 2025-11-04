'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

function usePrevious<T>(value: T): T | undefined {
  const previousValueRef = useRef<T>();

  useEffect(() => {
    previousValueRef.current = value;
  }, [value]);

  return previousValueRef.current;
}

export default function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const prevIsOpen = usePrevious(isOpen);
  const controls = useAnimation();

  function onDragEnd(event: any, info: any) {
    const shouldClose = 
      info.velocity.y > 20 || (info.velocity.y >= 0 && info.point.y > 45);
    if (shouldClose) {
      controls.start('hidden');
      onClose();
    } else {
      controls.start(isExpanded ? 'visible' : 'hidden');
    }
  }

  useEffect(() => {
    if (isOpen && !prevIsOpen) {
      controls.start('hidden');
      setIsExpanded(false);
    } else if (!isOpen && prevIsOpen) {
      controls.start('closed');
    } else if (isOpen) {
      controls.start(isExpanded ? 'visible' : 'hidden');
    }
  }, [controls, isOpen, isExpanded, prevIsOpen]);

  function toggleExpand() {
    setIsExpanded(!isExpanded);
  }

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
        initial="closed"
        animate={controls}
        transition={{
          type: 'spring',
          damping: 40,
          stiffness: 400
        }}
        variants={{
          visible: { y: '10%' },
          hidden: { y: '70%' },
          closed: { y: '100%' }
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
          onDoubleClick={toggleExpand}
        >
          <div className="w-12 h-1 bg-gray-300 rounded-full mb-2 hover:bg-gray-400 transition-colors" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200">
          <span className="text-lg font-semibold">{title || 'Bottom Sheet'}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleExpand}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </motion.div>
    </>
  );
}