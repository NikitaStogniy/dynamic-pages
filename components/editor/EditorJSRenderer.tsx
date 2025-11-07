'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { OutputData } from '@/lib/types/editor';
import DOMPurify from 'isomorphic-dompurify';
import { toast } from 'sonner';

interface EditorJSRendererProps {
  data: OutputData | null;
}

export default function EditorJSRenderer({ data }: EditorJSRendererProps) {
  // Rate limiting: track last click time for each button (by index)
  const lastClickTime = useRef<Map<number, number>>(new Map());
  const [loadingButtons, setLoadingButtons] = useState<Set<number>>(new Set());

  if (!data || !data.blocks || data.blocks.length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400 italic">
        No content available
      </div>
    );
  }

  const renderBlock = (block: { type: string; data: Record<string, unknown> }, index: number) => {
    const key = `block-${index}`;

    if (process.env.NODE_ENV === 'development') {
      console.log('Rendering block:', { type: block.type, data: block.data, index });
    }

    switch (block.type) {
      case 'header':
        const HeaderTag = `h${block.data.level}` as React.ElementType;
        return (
          <HeaderTag
            key={key}
            className={`font-bold ${
              block.data.level === 1 ? 'text-4xl mb-4' :
              block.data.level === 2 ? 'text-3xl mb-3' :
              block.data.level === 3 ? 'text-2xl mb-3' :
              block.data.level === 4 ? 'text-xl mb-2' :
              block.data.level === 5 ? 'text-lg mb-2' :
              'text-base mb-2'
            }`}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(String(block.data.text || '')) }}
          />
        );

      case 'paragraph':
        return (
          <p
            key={key}
            className="mb-4 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(String(block.data.text || '')) }}
          />
        );

      case 'list':
        const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul';

        if (process.env.NODE_ENV === 'development') {
          console.log('Rendering list block:', block.data);
          console.log('List items:', block.data.items);
        }
        
        // Handle both string items and object items (newer Editor.js format)
        const renderListItem = (item: unknown): string => {
          // If item is a string, use it directly
          if (typeof item === 'string') {
            return item;
          }
          // If item is an object with content property (newer format)
          if (item && typeof item === 'object') {
            const obj = item as Record<string, unknown>;
            return String(obj.content || obj.text || item);
          }
          // Fallback to string conversion
          return String(item);
        };

        return (
          <ListTag
            key={key}
            className={`mb-4 ${block.data.style === 'ordered' ? 'list-decimal' : 'list-disc'} list-inside`}
          >
            {(block.data.items as unknown[]).map((item: unknown, i: number) => {
              const content = renderListItem(item);

              if (process.env.NODE_ENV === 'development') {
                console.log(`List item ${i}:`, item, 'Rendered as:', content);
              }

              return (
                <li 
                  key={`${key}-${i}`} 
                  className="mb-1"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
                />
              );
            })}
          </ListTag>
        );

      case 'checklist':
        return (
          <div key={key} className="mb-4">
            {(block.data.items as Array<{ text: string; checked: boolean }>).map((item, i: number) => (
              <div key={`${key}-${i}`} className="flex items-start mb-2">
                <input
                  type="checkbox"
                  checked={item.checked}
                  disabled
                  className="mt-1 mr-2"
                />
                <span
                  className={item.checked ? 'line-through text-gray-500' : ''}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.text) }}
                />
              </div>
            ))}
          </div>
        );

      case 'quote':
        return (
          <blockquote key={key} className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-2 mb-4 italic">
            <p
              className="mb-2"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(String(block.data.text || '')) }}
            />
            {!!block.data.caption && (
              <cite className="text-sm text-gray-600 dark:text-gray-400">
                — {String(block.data.caption)}
              </cite>
            )}
          </blockquote>
        );

      case 'code':
        return (
          <pre key={key} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4 overflow-x-auto">
            <code className="text-sm font-mono">
              {String(block.data.code || '')}
            </code>
          </pre>
        );

      case 'delimiter':
        return <hr key={key} className="my-8 border-gray-300 dark:border-gray-600" />;

      case 'image':
        // Validate image data structure
        const imageData = block.data as { file?: { url?: string }; caption?: string };
        if (!imageData.file?.url) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Invalid image block data:', block);
          }
          return (
            <div key={key} className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                ⚠️ Image data is invalid or missing
              </p>
            </div>
          );
        }

        return (
          <figure key={key} className="mb-4">
            <Image
              src={String(imageData.file.url)}
              alt={String(imageData.caption || 'Image')}
              width={800}
              height={600}
              className="w-full rounded-lg"
              onError={(e) => {
                if (process.env.NODE_ENV === 'development') {
                  console.error('Failed to load image:', imageData.file?.url);
                }
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const errorDiv = document.createElement('div');
                  errorDiv.className = 'p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg';
                  errorDiv.innerHTML = '<p class="text-sm text-red-800 dark:text-red-300">Failed to load image</p>';
                  parent.appendChild(errorDiv);
                }
              }}
            />
            {!!imageData.caption && (
              <figcaption className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                {String(imageData.caption)}
              </figcaption>
            )}
          </figure>
        );

      case 'table':
        return (
          <div key={key} className="overflow-x-auto mb-4">
            <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
              <tbody>
                {(block.data.content as string[][]).map((row, rowIndex: number) => (
                  <tr key={`${key}-row-${rowIndex}`}>
                    {row.map((cell, cellIndex: number) => (
                      <td
                        key={`${key}-cell-${rowIndex}-${cellIndex}`}
                        className="border border-gray-300 dark:border-gray-600 px-4 py-2"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(cell) }}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'linkTool':
        const linkData = block.data as { link?: string; meta?: { title?: string; description?: string } };
        return (
          <a
            key={key}
            href={String(linkData.link || '#')}
            target="_blank"
            rel="noopener noreferrer"
            className="block mb-4 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div className="font-semibold text-blue-600 dark:text-blue-400">
              {String(linkData.meta?.title || linkData.link || '')}
            </div>
            {!!linkData.meta?.description && (
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {String(linkData.meta.description)}
              </div>
            )}
          </a>
        );

      case 'warning':
        return (
          <div key={key} className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600">
            <div className="font-semibold text-yellow-800 dark:text-yellow-300">
              {String(block.data.title || '')}
            </div>
            <div className="text-yellow-700 dark:text-yellow-400 mt-1">
              {String(block.data.message || '')}
            </div>
          </div>
        );

      case 'raw':
        return (
          <div
            key={key}
            className="mb-4"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(String(block.data.html || '')) }}
          />
        );

      case 'embed':
        return (
          <div key={key} className="mb-4">
            <iframe
              src={String(block.data.embed || '')}
              width={String(block.data.width || '100%')}
              height={Number(block.data.height) || 400}
              frameBorder="0"
              allowFullScreen
              className="w-full rounded-lg"
            />
            {!!block.data.caption && (
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                {String(block.data.caption)}
              </div>
            )}
          </div>
        );

      case 'button':
        const buttonStyles: Record<string, string> = {
          primary: 'bg-blue-500 hover:bg-blue-600 text-white border-2 border-blue-500 hover:border-blue-600',
          secondary: 'bg-gray-500 hover:bg-gray-600 text-white border-2 border-gray-500 hover:border-gray-600',
          outline: 'bg-transparent hover:bg-blue-500 text-blue-500 hover:text-white border-2 border-blue-500',
          danger: 'bg-red-500 hover:bg-red-600 text-white border-2 border-red-500 hover:border-red-600'
        };

        const alignmentClasses: Record<string, string> = {
          left: 'text-left',
          center: 'text-center',
          right: 'text-right'
        };

        const buttonData = block.data as {
          url?: string;
          webhookId?: number;
          text?: string;
          style?: string;
          alignment?: string;
          openInNewTab?: boolean;
          successMessage?: string;
          errorMessage?: string;
        };

        console.log('Rendering button block:', {
          index,
          buttonData,
          hasWebhookId: !!buttonData.webhookId,
          hasUrl: !!buttonData.url
        });

        // Validate button has an action
        const hasValidUrl = buttonData.url && buttonData.url.trim() !== '';
        const hasValidWebhook = typeof buttonData.webhookId === 'number' && buttonData.webhookId > 0;

        if (!hasValidUrl && !hasValidWebhook) {
          // Button is incomplete - show warning message
          return (
            <div key={key} className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600">
              <div className="font-semibold text-yellow-800 dark:text-yellow-300">
                ⚠️ Incomplete Button
              </div>
              <div className="text-yellow-700 dark:text-yellow-400 mt-1">
                Button &quot;{String(buttonData.text || 'Click me')}&quot; has no action configured (no URL or webhook selected). Please edit this page to configure the button action.
              </div>
            </div>
          );
        }

        const isLoading = loadingButtons.has(index);
        const isWebhook = !!buttonData.webhookId;

        console.log('Button rendering mode:', isWebhook ? 'WEBHOOK' : 'URL');

        const handleWebhookClick = (e: React.MouseEvent) => {
          e.preventDefault();
          console.log('Webhook button clicked!', { webhookId: buttonData.webhookId, buttonText: buttonData.text });

          // Rate limiting: check last click time
          const now = Date.now();
          const lastClick = lastClickTime.current.get(index);
          const RATE_LIMIT_MS = 30000; // 30 seconds

          if (lastClick && now - lastClick < RATE_LIMIT_MS) {
            const remainingSeconds = Math.ceil((RATE_LIMIT_MS - (now - lastClick)) / 1000);
            console.log('Rate limited:', remainingSeconds, 'seconds remaining');
            toast.warning(`Please wait ${remainingSeconds} seconds before clicking again`);
            return;
          }

          // Check if already loading
          if (isLoading) {
            console.log('Already loading, ignoring click');
            return;
          }

          console.log('Starting webhook trigger...');
          // Set loading state
          setLoadingButtons(prev => new Set(prev).add(index));
          const loadingToast = toast.loading('Triggering webhook...');

          // Update last click time
          lastClickTime.current.set(index, now);

          // Trigger webhook via server-side API endpoint
          console.log('Sending webhook request to /api/webhooks/trigger', {
            webhookId: buttonData.webhookId,
            payload: {
              buttonText: String(buttonData.text || ''),
              timestamp: new Date().toISOString(),
              pageUrl: window.location.href,
            }
          });

          fetch('/api/webhooks/trigger', {
            method: 'POST',
            credentials: 'include', // Required for session authentication
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              webhookId: buttonData.webhookId,
              payload: {
                buttonText: String(buttonData.text || ''),
                timestamp: new Date().toISOString(),
                pageUrl: window.location.href,
              }
            })
          }).then(async response => {
            console.log('Webhook response received:', response.status, response.statusText);
            toast.dismiss(loadingToast);
            setLoadingButtons(prev => {
              const next = new Set(prev);
              next.delete(index);
              return next;
            });

            if (response.ok) {
              const data = await response.json();
              console.log('Webhook triggered successfully:', data);
              const successMsg = buttonData.successMessage || 'Webhook triggered successfully!';
              toast.success(successMsg);
            } else if (response.status === 429) {
              const data = await response.json();
              toast.error(`Rate limit exceeded. Please try again in ${data.retryAfter} seconds.`);
            } else if (response.status === 401) {
              toast.error('Unauthorized. Please sign in to trigger webhooks.');
            } else {
              const data = await response.json();
              console.error('Failed to trigger webhook:', data);
              const errorMsg = buttonData.errorMessage || 'Failed to trigger webhook';
              toast.error(`${errorMsg}: ${data.error || 'Unknown error'}`);
            }
          }).catch(error => {
            toast.dismiss(loadingToast);
            setLoadingButtons(prev => {
              const next = new Set(prev);
              next.delete(index);
              return next;
            });
            console.error('Error triggering webhook:', error);
            const errorMsg = buttonData.errorMessage || 'Failed to trigger webhook';
            toast.error(`${errorMsg}. Check console for details.`);
          });
        };

        return (
          <div key={key} className={`mb-4 ${alignmentClasses[String(buttonData.alignment || 'center')]}`}>
            {isWebhook ? (
              <button
                onClick={handleWebhookClick}
                disabled={isLoading}
                className={`inline-block px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                  buttonStyles[String(buttonData.style || 'primary')]
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {isLoading ? 'Loading...' : String(buttonData.text || 'Click me')}
              </button>
            ) : (
              <a
                href={String(buttonData.url || '#')}
                target={buttonData.openInNewTab ? '_blank' : '_self'}
                rel={buttonData.openInNewTab ? 'noopener noreferrer' : undefined}
                className={`inline-block px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                  buttonStyles[String(buttonData.style || 'primary')]
                } cursor-pointer`}
              >
                {String(buttonData.text || 'Click me')}
              </a>
            )}
          </div>
        );

      default:
        // For unknown block types, try to extract and display any text content
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Unknown block type: ${block.type}`, block);
        }

        // Try to find and render any text content in the block
        if (block.data?.text) {
          return (
            <p key={key} className="mb-4 leading-relaxed">
              {String(block.data.text)}
            </p>
          );
        }

        // Skip rendering if there's no recognizable content
        if (process.env.NODE_ENV === 'development') {
          console.log('Skipping unknown block with no text content:', block);
        }
        return null;
    }
  };

  return (
    <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert max-w-none">
      {data.blocks.map((block, index) => {
        const rendered = renderBlock(block, index);
        // Filter out null values from skipped blocks
        return rendered;
      }).filter(Boolean)}
    </div>
  );
}