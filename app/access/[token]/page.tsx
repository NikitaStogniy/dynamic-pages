'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import EditorJSRenderer from '@/components/editor/EditorJSRenderer';
import { OutputData } from '@editorjs/editorjs';

interface PageData {
  id: number;
  title: string;
  slug: string;
  content: OutputData;
}

export default function AccessPage() {
  const params = useParams();
  const token = params?.token as string;

  const [pageData, setPageData] = useState<PageData | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (!token) return;

    const fetchPage = async () => {
      try {
        const response = await fetch(`/api/access-token/verify?token=${token}`);

        if (!response.ok) {
          const data = await response.json();
          setError(data.error || 'Access denied');
          setLoading(false);
          return;
        }

        const data = await response.json();
        setPageData(data.page);
        setExpiresAt(new Date(data.expiresAt));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching page:', err);
        setError('Failed to load page');
        setLoading(false);
      }
    };

    fetchPage();
  }, [token]);

  // Timer countdown
  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = new Date();
      const remaining = expiresAt.getTime() - now.getTime();

      if (remaining <= 0) {
        setTimeRemaining(0);
        setError('This link has expired');
        return;
      }

      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl text-center">
          <div className="text-6xl mb-4">⏰</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Expired
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Page not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Timer Banner */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">⏱️ Time Remaining:</span>
            <span className="text-xl font-bold font-mono">{formatTime(timeRemaining)}</span>
          </div>
          <div className="text-xs opacity-90">
            This page will expire automatically
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
            {pageData.title}
          </h1>
          <EditorJSRenderer data={pageData.content} />
        </div>
      </div>
    </div>
  );
}
