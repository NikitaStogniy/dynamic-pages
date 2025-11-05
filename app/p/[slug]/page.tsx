'use client';

import { useState, useEffect, use } from 'react';
import { notFound } from 'next/navigation';
import EditorJSRenderer from '@/components/editor/EditorJSRenderer';
import { OutputData } from '@/lib/types/editor';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface Page {
  id: number;
  userId: number;
  title: string;
  slug: string;
  content: OutputData;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PublicPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchPage();
  }, [resolvedParams.slug]);

  const fetchPage = async () => {
    try {
      const response = await fetch(`/api/pages/${resolvedParams.slug}`);
      
      if (!response.ok) {
        setError(true);
        return;
      }

      const data = await response.json();
      console.log('Fetched page data:', data);
      console.log('Page content:', data.content);
      console.log('Content blocks:', data.content?.blocks);
      setPage(data);
    } catch (err) {
      console.error('Error fetching page:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !page) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <article>
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {page.title}
            </h1>
            <div className="text-sm text-gray-500">
              Last updated: {new Date(page.updatedAt).toLocaleDateString()}
            </div>
          </header>

          <div className="prose prose-lg max-w-none">
            <EditorJSRenderer data={page.content} />
          </div>
        </article>
      </div>
    </div>
  );
}