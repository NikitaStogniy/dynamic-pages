'use client';

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageEditor from '@/components/editor/PageEditor';
import { usePage, useUpdatePage } from '@/lib/hooks/queries/usePages';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function EditPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: page, isLoading, error: fetchError } = usePage(resolvedParams.slug);
  const updatePage = useUpdatePage(resolvedParams.slug);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<any>({
    time: Date.now(),
    blocks: [],
    version: "2.29.1"
  });
  const [qrExpiryMinutes, setQrExpiryMinutes] = useState<number | null>(null);
  const [error, setError] = useState('');

  // Update local state when page data is loaded
  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setContent(page.content || {
        time: Date.now(),
        blocks: [],
        version: "2.29.1"
      });
      setQrExpiryMinutes(page.qrExpiryMinutes || null);
    }
  }, [page]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setError('');

    try {
      await updatePage.mutateAsync({
        title,
        content,
        qrExpiryMinutes: qrExpiryMinutes || undefined,
      });
      router.push('/dashboard/pages');
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {fetchError?.message || 'Page not found'}
        </div>
        <Link
          href="/dashboard/pages"
          className="mt-4 inline-block text-blue-600 hover:text-blue-700"
        >
          ← Back to Pages
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/dashboard/pages"
          className="text-gray-600 hover:text-gray-900 flex items-center"
        >
          ← Back to Pages
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">Edit Page</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Page Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter page title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Page URL
          </label>
          <div className="flex items-center">
            <span className="text-gray-500 bg-gray-100 px-3 py-2 rounded-lg border border-gray-300">
              /p/{page?.slug || resolvedParams.slug}
            </span>
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ⏱️ QR Code Timer (Optional)
          </label>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Set how long QR code links remain active. Leave empty for permanent links.
          </p>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="1"
              max="1440"
              value={qrExpiryMinutes || ''}
              onChange={(e) => setQrExpiryMinutes(e.target.value ? parseInt(e.target.value) : null)}
              className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="30"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">minutes</span>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setQrExpiryMinutes(15)}
              className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              15 min
            </button>
            <button
              type="button"
              onClick={() => setQrExpiryMinutes(30)}
              className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              30 min
            </button>
            <button
              type="button"
              onClick={() => setQrExpiryMinutes(60)}
              className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              1 hour
            </button>
            <button
              type="button"
              onClick={() => setQrExpiryMinutes(null)}
              className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              No limit
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <div className="border border-gray-300 rounded-lg p-4">
            <PageEditor slug={""}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={updatePage.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updatePage.isPending ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            href="/dashboard/pages"
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}