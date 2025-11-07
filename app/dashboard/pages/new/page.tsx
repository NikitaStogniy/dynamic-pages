'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import EditorJS from '@/components/editor/EditorJS';
import { OutputData, ensureValidEditorData } from '@/lib/types/editor';
import { useCreatePage, usePages } from '@/lib/hooks/queries/usePages';
import { pagesController } from '@/lib/controllers/pages.controller';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4 min-h-[44px]">
          <Link href="/dashboard">
            ← Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Create New Page</h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">
          Fill in the details below to create a new page
        </p>
      </div>

      {isLimitReached && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Page limit reached</AlertTitle>
          <AlertDescription>
            You have reached the maximum limit of 5 pages. Please delete an existing page to create a new one.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Page Details</CardTitle>
          <CardDescription>
            Enter a title and content for your new page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Page Title</Label>
              <Input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter page title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <div className="border rounded-lg p-4">
                <EditorJS
                  data={content}
                  onChange={setContent}
                  placeholder="Start writing your page content... Press Tab or / for commands"
                  minHeight={300}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                type="submit"
                disabled={createPage.isPending || isLimitReached || isGeneratingSlug || slugStatus === 'error'}
                className="w-full sm:w-auto min-h-[48px]"
              >
                {createPage.isPending ? 'Creating...' :
                 isGeneratingSlug ? 'Generating ID...' :
                 slugStatus === 'error' ? 'Error' :
                 isLimitReached ? 'Limit Reached' : 'Create Page'}
              </Button>
              <Button variant="outline" asChild className="w-full sm:w-auto min-h-[48px]">
                <Link href="/dashboard">
                  Cancel
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}