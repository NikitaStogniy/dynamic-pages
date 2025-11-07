'use client';

import Link from 'next/link';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePages, useDeletePage } from '@/lib/hooks/queries/usePages';
import ShowQR from './ShowQR';
import { Compass, Trash2, LoaderCircle, Plus, SquarePen } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PagesListProps {
    selectedSlug?: string | null;
    onSelectPage?: (slug: string | null) => void;
}

export function PagesList({ selectedSlug, onSelectPage }: PagesListProps) {
    const { data: pages = [], isLoading } = usePages();
    const deletePage = useDeletePage();
    const router = useRouter();

    const handleEdit = useCallback((e: React.MouseEvent, slug: string) => {
        e.stopPropagation();

        // On mobile (<768px), navigate to full-screen edit page
        // On desktop, use the sidebar editor
        if (window.innerWidth < 768) {
            router.push(`/dashboard/pages/${slug}/edit`);
        } else {
            onSelectPage?.(slug);
        }
    }, [router, onSelectPage]);

    const handleDelete = useCallback(async (slug: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

        try {
            await deletePage.mutateAsync(slug);
            toast.success('Page deleted successfully');
        } catch (error) {
            console.error('Error deleting page:', error);
            toast.error('Failed to delete page. Please try again.');
        }
    }, [deletePage]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-20" />
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        );
    }

    const pagesCount = pages.length;
    const maxPages = 5;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">My Pages</h2>
                <Badge variant={pagesCount >= maxPages ? "destructive" : "secondary"}>
                    {pagesCount}/{maxPages}
                </Badge>
            </div>

            {pages.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <p className="text-muted-foreground mb-4">No pages yet</p>
                        <Button asChild className="min-h-[44px]">
                            <Link href="/dashboard/pages/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Create your first page
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="space-y-2">
                        {pages.map((page) => (
                            <Card
                                key={page.id}
                                className={cn(
                                    "cursor-pointer transition-all hover:shadow-md",
                                    selectedSlug === page.slug && "border-primary shadow-md"
                                )}
                                onClick={() => onSelectPage?.(page.slug)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold truncate flex-1 mr-4">
                                            {page.title}
                                        </h3>
                                        <TooltipProvider>
                                            <div className="flex items-center space-x-1">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            asChild
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="min-h-[44px] min-w-[44px]"
                                                        >
                                                            <Link href={`/p/${page.slug}`} target="_blank">
                                                                <Compass className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>View page</TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => handleEdit(e, page.slug)}
                                                            className="min-h-[44px] min-w-[44px]"
                                                        >
                                                            <SquarePen className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Edit page</TooltipContent>
                                                </Tooltip>

                                                <ShowQR pageSlug={page.slug} pageTitle={page.title} />

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(page.slug, page.title);
                                                            }}
                                                            className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Delete page</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </TooltipProvider>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="flex justify-center">
                        {pagesCount < maxPages ? (
                            <Button asChild className="min-h-[44px]">
                                <Link href="/dashboard/pages/new">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create new page
                                </Link>
                            </Button>
                        ) : (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div>
                                            <Button disabled className="min-h-[44px]">
                                                <Plus className="mr-2 h-4 w-4" />
                                                Create new page
                                            </Button>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Maximum pages limit reached (5/5)</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}