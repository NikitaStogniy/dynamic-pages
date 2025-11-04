'use client';

import { useState, useEffect } from 'react';
import EditorJS from '@/components/editor/EditorJS';
import { OutputData, ensureValidEditorData } from '@/lib/types/editor';
import { usePage, useUpdatePage } from '@/lib/hooks/queries/usePages';

interface PageEditorProps {
  slug: string;
}

export default function PageEditor({ slug }: PageEditorProps) {
  const { data: page, isLoading, error: fetchError } = usePage(slug);
  const updatePage = useUpdatePage(slug);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<OutputData>(ensureValidEditorData());
  const [error, setError] = useState('');

  // Update local state when page data is loaded
  useEffect(() => {
    if (page) {
      setTitle(page.title);
      if (page.content && typeof page.content === 'object') {
          setContent(ensureValidEditorData(page.content));
      }
    }
  }, [page]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setError('');

    try {
      await updatePage.mutateAsync({
        title,
        content
      });
      // Show success message instead of redirecting
      setError(''); 
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading page...</div>
      </div>
    );
  }

  if (fetchError || (!isLoading && !page)) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        {fetchError?.message || 'Page not found'}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Page Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          placeholder="Enter page title"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Page URL
        </label>
        <div className="flex items-center">
          <span className="text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600">
            /p/{page?.slug || slug}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Content
        </label>
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 dark:bg-gray-800">
          <EditorJS
            key={page?.slug || 'new'} // Force remount when page changes
            data={content}
            onChange={setContent}
            placeholder="Start writing your page content... Press Tab or / for commands"
            minHeight={300}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={updatePage.isPending}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updatePage.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}