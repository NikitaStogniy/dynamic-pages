'use client';

import dynamic from 'next/dynamic';
import { OutputData } from '@/lib/types/editor';

const EditorComponent = dynamic(
  () => import('./EditorJSComponent'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[200px] text-gray-500">
        Loading editor...
      </div>
    )
  }
);

interface EditorJSProps {
  data?: OutputData;
  onChange?: (data: OutputData) => void;
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: number;
}

export default function EditorJS(props: EditorJSProps) {
  return <EditorComponent {...props} />;
}