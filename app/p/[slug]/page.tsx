"use client";

import { useState, useEffect, use, useCallback } from "react";
import { notFound } from "next/navigation";
import EditorJSRenderer from "@/components/editor/EditorJSRenderer";
import { OutputData } from "@/lib/types/editor";

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

  const fetchPage = useCallback(async () => {
    try {
      const response = await fetch(`/api/pages/${resolvedParams.slug}`);

      if (!response.ok) {
        setError(true);
        return;
      }

      const data = await response.json();
      console.log("Fetched page data:", data);
      console.log("Page content:", data.content);
      console.log("Content blocks:", data.content?.blocks);
      setPage(data);
    } catch (err) {
      console.error("Error fetching page:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.slug]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (error || !page) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12">
        <article>
          <header className="mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4 break-words">
              {page.title}
            </h1>
            <div className="text-xs sm:text-sm text-muted-foreground">
              Last updated: {new Date(page.updatedAt).toLocaleDateString()}
            </div>
          </header>

          <div className="prose prose-sm sm:prose-base md:prose-lg max-w-none dark:prose-invert">
            <EditorJSRenderer data={page.content} />
          </div>
        </article>
      </div>
    </div>
  );
}
