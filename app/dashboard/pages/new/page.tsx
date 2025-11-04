'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import EditorJS from '@/components/editor/EditorJS';
import { OutputData, ensureValidEditorData } from '@/lib/types/editor';
import { useCreatePage, usePages } from '@/lib/hooks/queries/usePages';
import { pagesController } from '@/lib/controllers/pages.controller';

export default function NewPage() {
  const router = useRouter();
  const createPage = useCreatePage();
  const { data: pages = [] } = usePages();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState<OutputData>(ensureValidEditorData());
  const [error, setError] = useState('');
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(true);
  const [slugStatus, setSlugStatus] = useState<'generating' | 'checking' | 'ready' | 'error'>('generating');
  
  const isLimitReached = pages.length >= 5;

  useEffect(() => {
    const generateUniqueSlug = async () => {
      setSlugStatus('generating');
      try {
        const uniqueSlug = await pagesController.generateUniqueSlug();
        if (uniqueSlug) {
          setSlug(uniqueSlug);
          setSlugStatus('ready');
        } else {
          setError('Failed to generate unique slug. Please try again.');
          setSlugStatus('error');
        }
      } catch (err) {
        console.error('Error generating slug:', err);
        setError('Failed to generate slug. Please try again.');
        setSlugStatus('error');
      } finally {
        setIsGeneratingSlug(false);
      }
    };
    generateUniqueSlug();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !slug.trim()) {
      setError('Title and slug are required');
      return;
    }

    if (slugStatus !== 'ready') {
      setError('Please wait for slug generation to complete');
      return;
    }

    setError('');
    setSlugStatus('checking');

    try {
      // Double-check slug availability before submission
      const isAvailable = await pagesController.isSlugAvailable(slug);
      if (!isAvailable) {
        // Try to regenerate if not available
        setSlugStatus('generating');
        const newSlug = await pagesController.generateUniqueSlug();
        if (newSlug) {
          setSlug(newSlug);
          setSlugStatus('ready');
          setError('Slug was already taken. Generated a new one. Please submit again.');
          return;
        } else {
          setError('Failed to generate unique slug. Please refresh and try again.');
          setSlugStatus('error');
          return;
        }
      }

      await createPage.mutateAsync({
        title,
        slug,
        content
      });
      router.push('/dashboard/pages');
    } catch (err) {
      if (err instanceof Error) {
        // Check if it's a response error with status
        const errorMessage = err.message;
        if (errorMessage.includes('maximum limit of 5 pages')) {
          setError('You have reached the maximum limit of 5 pages. Please delete an existing page to create a new one.');
        } else {
          setError(errorMessage);
        }
      } else {
        setError('An error occurred');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/dashboard/pages"
          className="text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 hover:text-gray-900 flex items-center"
        >
          ← Back to Pages
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">Create New Page</h1>

      {isLimitReached && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-6">
          <p className="font-medium">Page limit reached</p>
          <p className="text-sm mt-1">You have reached the maximum limit of 5 pages. Please delete an existing page to create a new one.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-950 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium dark:text-gray-300  text-gray-700 mb-2">
            Page Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border dark:border-gray-500 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter page title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
            Content
          </label>
          <div className="border border-gray-300 rounded-lg p-4">
            <EditorJS
              data={content}
              onChange={setContent}
              placeholder="Start writing your page content... Press Tab or / for commands"
              minHeight={300}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={createPage.isPending || isLimitReached || isGeneratingSlug || slugStatus === 'error'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createPage.isPending ? 'Creating...' : 
             isGeneratingSlug ? 'Generating ID...' :
             slugStatus === 'error' ? 'Error' :
             isLimitReached ? 'Limit Reached' : 'Create Page'}
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