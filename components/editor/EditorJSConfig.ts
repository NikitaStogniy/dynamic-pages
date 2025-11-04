import { ToolConstructable, ToolSettings } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';
import Code from '@editorjs/code';
import Table from '@editorjs/table';
import Paragraph from '@editorjs/paragraph';
import Image from '@editorjs/image';
import InlineCode from '@editorjs/inline-code';
import Delimiter from '@editorjs/delimiter';
import Warning from '@editorjs/warning';
import ButtonTool from './ButtonTool';

export const EDITOR_TOOLS: Record<string, ToolConstructable | ToolSettings> = {
  header: {
    class: Header as unknown as ToolConstructable,
    inlineToolbar: true,
    config: {
      placeholder: 'Enter a header',
      levels: [1, 2, 3, 4, 5, 6],
      defaultLevel: 3
    }
  },
  paragraph: {
    class: Paragraph as unknown as ToolConstructable,
    inlineToolbar: true,
    config: {
      placeholder: 'Type something...'
    }
  },
  list: {
    class: List as unknown as ToolConstructable,
    inlineToolbar: true,
    config: {
      defaultStyle: 'unordered'
    }
  },
  quote: {
    class: Quote as unknown as ToolConstructable,
    inlineToolbar: true,
    // Temporarily disabled to avoid conflicts
    // shortcut: 'CMD+SHIFT+O',
    config: {
      quotePlaceholder: 'Enter a quote',
      captionPlaceholder: 'Quote\'s author'
    }
  },
  code: {
    class: Code as unknown as ToolConstructable,
    config: {
      placeholder: 'Enter code'
    }
  },
  delimiter: Delimiter as unknown as ToolConstructable,
  inlineCode: {
    class: InlineCode as unknown as ToolConstructable,
    shortcut: 'CMD+SHIFT+C'
  },
  table: {
    class: Table as unknown as ToolConstructable,
    inlineToolbar: true,
    config: {
      rows: 2,
      cols: 3
    }
  },
  image: {
    class: Image as unknown as ToolConstructable,
    config: {
      uploader: {
        async uploadByFile(file: File) {
          try {
            // Get session token from localStorage
            const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('sessionToken') : null;
            
            if (!sessionToken) {
              throw new Error('Not authenticated. Please sign in to upload images.');
            }

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${sessionToken}`,
              },
              body: formData,
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Upload failed');
            }

            const result = await response.json();
            return {
              success: result.success,
              file: {
                url: result.file.url
              }
            };
          } catch (error) {
            console.error('Upload error:', error);
            // Fallback to base64 if upload fails
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => {
                resolve({
                  success: 1,
                  file: {
                    url: reader.result as string
                  }
                });
              };
              reader.onerror = error => reject(error);
            });
          }
        },
        uploadByUrl(url: string) {
          return Promise.resolve({
            success: 1,
            file: {
              url: url
            }
          });
        }
      },
      captionPlaceholder: 'Image caption'
    }
  },
  warning: {
    class: Warning as unknown as ToolConstructable,
    inlineToolbar: true,
    shortcut: 'CMD+SHIFT+W',
    config: {
      titlePlaceholder: 'Title',
      messagePlaceholder: 'Message'
    }
  },
  button: {
    class: ButtonTool as unknown as ToolConstructable,
    inlineToolbar: false
  },
};

export const EDITOR_CONFIG = {
  holder: 'editorjs',
  placeholder: 'Let\'s write an awesome story! Press Tab or click here to start...',
  autofocus: true,
  tools: EDITOR_TOOLS,
  defaultBlock: 'paragraph',
  i18n: {
    messages: {
      ui: {
        blockTunes: {
          toggler: {
            'Click to tune': 'Click to tune',
            'or drag to move': 'or drag to move'
          }
        },
        inlineToolbar: {
          converter: {
            'Convert to': 'Convert to'
          }
        },
        toolbar: {
          toolbox: {
            Add: 'Add',
            Filter: 'Filter',
            'Nothing found': 'Nothing found'
          }
        }
      },
      toolNames: {
        Text: 'Text',
        Heading: 'Heading',
        List: 'List',
        Checklist: 'Checklist',
        Quote: 'Quote',
        Code: 'Code',
        Delimiter: 'Delimiter',
        'Raw HTML': 'Raw HTML',
        Table: 'Table',
        Link: 'Link',
        Marker: 'Marker',
        Bold: 'Bold',
        Italic: 'Italic',
        InlineCode: 'InlineCode',
        Image: 'Image',
        Warning: 'Warning',
        Embed: 'Embed',
        Button: 'Button'
      },
      blockTunes: {
        delete: {
          Delete: 'Delete',
          'Click to delete': 'Click to delete'
        },
        moveUp: {
          'Move up': 'Move up'
        },
        moveDown: {
          'Move down': 'Move down'
        }
      }
    }
  }
};