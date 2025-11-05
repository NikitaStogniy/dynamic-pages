'use client';

import { OutputData } from '@/lib/types/editor';
import DOMPurify from 'isomorphic-dompurify';

interface EditorJSRendererProps {
  data: OutputData | null;
}

// Allowed webhook domains for security (SSRF prevention)
const ALLOWED_WEBHOOK_DOMAINS = [
  'hooks.slack.com',
  'discord.com',
  'webhook.site',
  'requestcatcher.com',
  // Add your own webhook domains here
];

/**
 * Validates webhook URL to prevent SSRF attacks
 * Only allows URLs from whitelisted domains
 */
function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Only allow HTTPS for security
    if (parsed.protocol !== 'https:') {
      console.error('Webhook URL must use HTTPS');
      return false;
    }

    // Check if domain is in whitelist
    const isAllowed = ALLOWED_WEBHOOK_DOMAINS.some(domain =>
      parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );

    if (!isAllowed) {
      console.error(`Webhook domain not allowed: ${parsed.hostname}`);
      console.error(`Allowed domains: ${ALLOWED_WEBHOOK_DOMAINS.join(', ')}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Invalid webhook URL:', error);
    return false;
  }
}

export default function EditorJSRenderer({ data }: EditorJSRendererProps) {
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
        const HeaderTag = `h${block.data.level}` as keyof JSX.IntrinsicElements;
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
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.data.text) }}
          />
        );

      case 'paragraph':
        return (
          <p 
            key={key} 
            className="mb-4 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.data.text) }}
          />
        );

      case 'list':
        const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul';

        if (process.env.NODE_ENV === 'development') {
          console.log('Rendering list block:', block.data);
          console.log('List items:', block.data.items);
        }
        
        // Handle both string items and object items (newer Editor.js format)
        const renderListItem = (item: unknown) => {
          // If item is a string, use it directly
          if (typeof item === 'string') {
            return item;
          }
          // If item is an object with content property (newer format)
          if (item && typeof item === 'object') {
            const obj = item as Record<string, unknown>;
            return obj.content || obj.text || String(item);
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
            {block.data.items.map((item: { text: string; checked: boolean }, i: number) => (
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
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.data.text) }}
            />
            {block.data.caption && (
              <cite className="text-sm text-gray-600 dark:text-gray-400">
                — {block.data.caption}
              </cite>
            )}
          </blockquote>
        );

      case 'code':
        return (
          <pre key={key} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4 overflow-x-auto">
            <code className="text-sm font-mono">
              {block.data.code}
            </code>
          </pre>
        );

      case 'delimiter':
        return <hr key={key} className="my-8 border-gray-300 dark:border-gray-600" />;

      case 'image':
        // Validate image data structure
        if (!block.data?.file?.url) {
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
            <img
              src={block.data.file.url}
              alt={block.data.caption || 'Image'}
              className="w-full rounded-lg"
              onError={(e) => {
                if (process.env.NODE_ENV === 'development') {
                  console.error('Failed to load image:', block.data.file.url);
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
            {block.data.caption && (
              <figcaption className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                {block.data.caption}
              </figcaption>
            )}
          </figure>
        );

      case 'table':
        return (
          <div key={key} className="overflow-x-auto mb-4">
            <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
              <tbody>
                {block.data.content.map((row: string[], rowIndex: number) => (
                  <tr key={`${key}-row-${rowIndex}`}>
                    {row.map((cell: string, cellIndex: number) => (
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
        return (
          <a 
            key={key}
            href={block.data.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block mb-4 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div className="font-semibold text-blue-600 dark:text-blue-400">
              {block.data.meta?.title || block.data.link}
            </div>
            {block.data.meta?.description && (
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {block.data.meta.description}
              </div>
            )}
          </a>
        );

      case 'warning':
        return (
          <div key={key} className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600">
            <div className="font-semibold text-yellow-800 dark:text-yellow-300">
              {block.data.title}
            </div>
            <div className="text-yellow-700 dark:text-yellow-400 mt-1">
              {block.data.message}
            </div>
          </div>
        );

      case 'raw':
        return (
          <div 
            key={key}
            className="mb-4"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.data.html) }}
          />
        );

      case 'embed':
        return (
          <div key={key} className="mb-4">
            <iframe
              src={block.data.embed}
              width={block.data.width || '100%'}
              height={block.data.height || 400}
              frameBorder="0"
              allowFullScreen
              className="w-full rounded-lg"
            />
            {block.data.caption && (
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                {block.data.caption}
              </div>
            )}
          </div>
        );

      case 'button':
        const buttonStyles = {
          primary: 'bg-blue-500 hover:bg-blue-600 text-white border-2 border-blue-500 hover:border-blue-600',
          secondary: 'bg-gray-500 hover:bg-gray-600 text-white border-2 border-gray-500 hover:border-gray-600',
          outline: 'bg-transparent hover:bg-blue-500 text-blue-500 hover:text-white border-2 border-blue-500',
          danger: 'bg-red-500 hover:bg-red-600 text-white border-2 border-red-500 hover:border-red-600'
        };

        const alignmentClasses = {
          left: 'text-left',
          center: 'text-center',
          right: 'text-right'
        };

        return (
          <div key={key} className={`mb-4 ${alignmentClasses[block.data.alignment || 'center']}`}>
            <a
              href={block.data.url || '#'}
              target={block.data.openInNewTab !== false ? '_blank' : '_self'}
              rel={block.data.openInNewTab !== false ? 'noopener noreferrer' : undefined}
              className={`inline-block px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                buttonStyles[block.data.style || 'primary']
              }`}
              onClick={(e) => {
                if (block.data.url && block.data.url.startsWith('webhook://')) {
                  e.preventDefault();
                  // Extract webhook URL (remove webhook:// prefix)
                  const webhookUrl = block.data.url.substring(10);

                  // Validate webhook URL to prevent SSRF attacks
                  if (!isValidWebhookUrl(webhookUrl)) {
                    alert('Invalid webhook URL. Only whitelisted domains are allowed for security.');
                    return;
                  }

                  // Trigger webhook
                  fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      buttonText: block.data.text,
                      timestamp: new Date().toISOString(),
                      pageUrl: window.location.href,
                    })
                  }).then(response => {
                    if (response.ok) {
                      console.log('Webhook triggered successfully');
                    } else {
                      console.error('Failed to trigger webhook');
                    }
                  }).catch(error => {
                    console.error('Error triggering webhook:', error);
                  });
                }
              }}
            >
              {block.data.text || 'Click me'}
            </a>
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
              {block.data.text}
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