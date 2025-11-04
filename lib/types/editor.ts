import { OutputData } from '@editorjs/editorjs';

// Re-export the OutputData type for use throughout the application
export type { OutputData };

// You can add additional editor-related types here if needed
export interface EditorContent extends OutputData {
  // OutputData already has: version?, time?, blocks
  // Add any app-specific extensions here if needed
}

// Type guard to check if an object is valid OutputData
export function isValidOutputData(data: unknown): data is OutputData {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  const obj = data as any;
  
  // blocks is required and must be an array
  if (!Array.isArray(obj.blocks)) {
    return false;
  }
  
  // Optional fields can be present but must have correct types
  if (obj.version !== undefined && typeof obj.version !== 'string') {
    return false;
  }
  
  if (obj.time !== undefined && typeof obj.time !== 'number') {
    return false;
  }
  
  return true;
}

// Helper to ensure data has at least one block (for Editor.js initialization)
export function ensureValidEditorData(data?: unknown): OutputData {
  if (isValidOutputData(data) && data.blocks.length > 0) {
    return data;
  }
  
  // Return default data with an empty paragraph block
  return {
    blocks: [
      {
        type: 'paragraph',
        data: {
          text: ''
        }
      }
    ],
    time: Date.now(),
    version: '2.29.0'
  };
}