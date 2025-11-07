'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import EditorJS, { API, EditorConfig } from '@editorjs/editorjs';
import { OutputData, ensureValidEditorData } from '@/lib/types/editor';
import { EDITOR_CONFIG } from './EditorJSConfig';

interface EditorJSComponentProps {
  data?: OutputData;
  onChange?: (data: OutputData) => void;
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: number;
}

export default function EditorJSComponent({
  data,
  onChange,
  placeholder,
  readOnly = false,
  minHeight = 200
}: EditorJSComponentProps) {
  const editorRef = useRef<EditorJS | null>(null);
  const [isReady, setIsReady] = useState(false);
  const holderId = useRef(`editorjs-${Math.random().toString(36).substr(2, 9)}`);
  const isInitializing = useRef(false);
  const previousReadOnly = useRef(readOnly);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initializeEditor = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (isInitializing.current || editorRef.current) {
      return;
    }

    isInitializing.current = true;

    // Detect mobile device
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    const config: EditorConfig = {
      ...EDITOR_CONFIG,
      holder: holderId.current,
      placeholder: placeholder || (isMobile ? 'Tap to start writing...' : EDITOR_CONFIG.placeholder),
      data: ensureValidEditorData(data),
      readOnly,
      minHeight,
      autofocus: !isMobile && !readOnly, // Disable autofocus on mobile
      onChange: async (api: API) => {
        if (!readOnly && onChange) {
          // Debounce save to allow uploads to complete
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
          }

          saveTimeoutRef.current = setTimeout(async () => {
            try {
              const outputData = await api.saver.save();
              // Ensure we always have at least one block
              if (!outputData.blocks || outputData.blocks.length === 0) {
                outputData.blocks = [{
                  type: 'paragraph',
                  data: { text: '' }
                }];
              }
              onChange(outputData);
            } catch (error) {
              if (process.env.NODE_ENV === 'development') {
                console.error('Error saving editor data:', error);
              }
            }
          }, 1000); // Wait 1 second after last change before saving
        }
      },
      onReady: () => {
        setIsReady(true);
        isInitializing.current = false;
      }
    } as EditorConfig;

    try {
      editorRef.current = new EditorJS(config);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('ERROR initializing editor:', error);
      }
      isInitializing.current = false;
    }
  }, [data, onChange, placeholder, readOnly, minHeight]);

  useEffect(() => {
    initializeEditor();

    return () => {
      // Clear save timeout on unmount
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      const destroyEditor = async () => {
        if (editorRef.current && editorRef.current.destroy) {
          try {
            await editorRef.current.destroy();
            editorRef.current = null;
            setIsReady(false);
            isInitializing.current = false;
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Error destroying editor:', error);
            }
          }
        }
      };
      destroyEditor();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty: initializeEditor is not a dependency to prevent re-initialization

  // Remove the data update effect entirely as it causes issues
  // The editor is initialized with the correct data and handles its own state
  // External data changes should be handled by re-mounting the component

  useEffect(() => {
    if (isReady && editorRef.current && previousReadOnly.current !== readOnly) {
      // Only toggle if readOnly actually changed
      try {
        // Use the toggle method correctly - it toggles the current state when called without params
        // So we need to check current state first
        const currentReadOnlyState = editorRef.current.readOnly.isEnabled;
        if (currentReadOnlyState !== readOnly) {
          editorRef.current.readOnly.toggle(readOnly);
        }
        previousReadOnly.current = readOnly;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error toggling readOnly state:', error);
        }
      }
    }
  }, [readOnly, isReady]);

  return (
    <div 
      className={`editor-wrapper ${readOnly ? 'read-only' : ''}`}
      style={{ minHeight: `${minHeight}px` }}
    >
      <div 
        id={holderId.current} 
        className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none"
      />
      <style jsx>{`
        .editor-wrapper {
          position: relative;
          width: 100%;
        }

        .editor-wrapper.read-only {
          pointer-events: none;
        }

        :global(.codex-editor) {
          min-height: inherit;
        }

        :global(.ce-block__content) {
          max-width: 100%;
        }

        :global(.ce-toolbar__content) {
          max-width: 100%;
        }

        :global(.ce-toolbar__plus) {
          cursor: pointer;
        }

        :global(.ce-toolbar__settings-btn) {
          cursor: pointer;
        }

        :global(.ce-inline-toolbar) {
          z-index: 10;
        }

        :global(.ce-conversion-toolbar) {
          z-index: 10;
        }

        :global(.ce-settings) {
          z-index: 10;
        }

        :global(.ce-popover) {
          z-index: 10;
        }

        :global(.ce-toolbar__plus:hover) {
          background-color: rgb(229 231 235);
        }

        :global(.ce-toolbar__settings-btn:hover) {
          background-color: rgb(229 231 235);
        }

        :global(.dark .ce-toolbar__plus:hover) {
          background-color: rgb(55 65 81);
        }

        :global(.dark .ce-toolbar__settings-btn:hover) {
          background-color: rgb(55 65 81);
        }

        :global(.dark .codex-editor) {
          background-color: rgb(31 41 55);
          color: rgb(243 244 246);
        }

        :global(.dark .ce-block) {
          color: rgb(243 244 246);
        }

        :global(.dark .ce-toolbar__plus) {
          color: rgb(243 244 246);
        }

        :global(.dark .ce-toolbar__settings-btn) {
          color: rgb(243 244 246);
        }

        :global(.dark .ce-popover) {
          background-color: rgb(31 41 55);
          border-color: rgb(55 65 81);
        }

        :global(.dark .ce-popover-item:hover) {
          background-color: rgb(55 65 81);
        }

        :global(.dark .ce-inline-toolbar) {
          background-color: rgb(31 41 55);
          border-color: rgb(55 65 81);
        }

        :global(.dark .ce-conversion-toolbar) {
          background-color: rgb(31 41 55);
          border-color: rgb(55 65 81);
        }

        :global(.dark .ce-settings) {
          background-color: rgb(31 41 55);
          border-color: rgb(55 65 81);
        }

        :global(.dark .ce-settings__button:hover) {
          background-color: rgb(55 65 81);
        }

        :global(.dark .ce-inline-tool:hover) {
          background-color: rgb(55 65 81);
        }

        :global(.dark .ce-conversion-tool:hover) {
          background-color: rgb(55 65 81);
        }

        :global(.dark .ce-code__textarea) {
          background-color: rgb(17 24 39);
          color: rgb(243 244 246);
        }

        :global(.dark .cdx-quote__text) {
          color: rgb(243 244 246);
        }

        :global(.dark .cdx-quote__caption) {
          color: rgb(156 163 175);
        }

        /* Mobile touch-friendly styles */
        @media (max-width: 768px) {
          /* Increase touch target sizes on mobile */
          :global(.ce-toolbar__plus),
          :global(.ce-toolbar__settings-btn) {
            min-width: 44px !important;
            min-height: 44px !important;
            width: 44px !important;
            height: 44px !important;
            padding: 12px !important;
          }

          /* Inline toolbar buttons */
          :global(.ce-inline-tool),
          :global(.ce-conversion-tool__icon) {
            min-width: 44px !important;
            min-height: 44px !important;
            padding: 10px !important;
          }

          /* Prevent toolbar from overflowing viewport */
          :global(.ce-inline-toolbar),
          :global(.ce-conversion-toolbar),
          :global(.ce-settings) {
            max-width: calc(100vw - 32px) !important;
            left: 16px !important;
            right: 16px !important;
          }

          /* Better spacing for block content */
          :global(.ce-block__content) {
            padding: 12px 8px !important;
          }

          /* Larger tap area for text selection */
          :global(.ce-paragraph),
          :global(.ce-header) {
            padding: 8px 0 !important;
            min-height: 44px !important;
          }

          /* Prevent horizontal scroll */
          :global(.codex-editor) {
            overflow-x: hidden !important;
          }

          /* Popover items touch-friendly */
          :global(.ce-popover-item) {
            min-height: 44px !important;
            padding: 12px 16px !important;
          }
        }

        /* Touch device specific styles (no mouse hover) */
        @media (hover: none) and (pointer: coarse) {
          /* Remove hover states on touch devices */
          :global(.ce-toolbar__plus:hover),
          :global(.ce-toolbar__settings-btn:hover) {
            background-color: transparent !important;
          }

          /* Add active/pressed states instead */
          :global(.ce-toolbar__plus:active),
          :global(.ce-toolbar__settings-btn:active) {
            background-color: rgb(229 231 235) !important;
            transform: scale(0.95);
          }

          :global(.dark .ce-toolbar__plus:active),
          :global(.dark .ce-toolbar__settings-btn:active) {
            background-color: rgb(55 65 81) !important;
          }

          :global(.ce-inline-tool:active),
          :global(.ce-conversion-tool:active),
          :global(.ce-popover-item:active) {
            background-color: rgb(229 231 235) !important;
          }

          :global(.dark .ce-inline-tool:active),
          :global(.dark .ce-conversion-tool:active),
          :global(.dark .ce-popover-item:active) {
            background-color: rgb(55 65 81) !important;
          }
        }
      `}</style>
    </div>
  );
}