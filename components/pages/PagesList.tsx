'use client';

import Link from 'next/link';
import { useCallback } from 'react';
import { usePages, useDeletePage } from '@/lib/hooks/queries/usePages';
import ShowQR from './ShowQR';
import {Compass, Delete, LoaderCircle, Plus, SquarePen} from "lucide-react";

interface PagesListProps {
    selectedSlug?: string | null;
    onSelectPage?: (slug: string | null) => void;
}

export function PagesList({ selectedSlug, onSelectPage }: PagesListProps) {
    const { data: pages = [], isLoading } = usePages();
    const deletePage = useDeletePage();

    const handleDelete = useCallback(async (slug: string) => {
        if (!confirm('Are you sure you want to delete this page?')) return;

        try {
            await deletePage.mutateAsync(slug);
        } catch (error) {
            console.error('Error deleting page:', error);
            alert('Failed to delete page. Please try again.');
        }
    }, [deletePage]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-500 animate-spin"><LoaderCircle /></div>
            </div>
        );
    }

    const pagesCount = pages.length;
    const maxPages = 5; // Максимальное количество страниц

    return (
        <div className="space-y-4">
            <p className="">{pagesCount}/{maxPages}</p>
            <div
                className="transition-all shadow overflow-hidden">
                <ul className="divide-y dark:divide-gray-700 divide-gray-200 flex flex-col gap-1">
                        {pages.map((page) => (
                            <li 
                                key={page.id} 
                                className={`px-4 py-1 cursor-pointer transition-colors  rounded-full ${
                                    selectedSlug === page.slug 
                                        ? 'bg-blue-100 dark:bg-blue-900/30' 
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                                onClick={() => onSelectPage?.(page.slug)}
                            >
                                <div className="flex items-center justify-between">
                                        <p className="text-lg font-medium dark:text-gray-300 text-gray-900">
                                            {page.title}
                                        </p>
                                        <div className="flex items-center space-x-1">
                                            <Link
                                                href={`/p/${page.slug}`}
                                                target="_blank"
                                                className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 px-3 py-1 text-sm font-medium transition-all cursor-pointer"
                                            >
                                                <Compass/>
                                            </Link>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectPage?.(page.slug);
                                                }}
                                                className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 px-3 py-1 text-sm font-medium transition-all cursor-pointer"
                                            >
                                                <SquarePen/>
                                            </button>
                                            <ShowQR pageSlug={page.slug} pageTitle={page.title}/>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(page.slug);
                                                }}
                                                className="text-gray-500 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-500 px-3 py-1 text-sm font-medium transition-all cursor-pointer"
                                            >
                                                <Delete/>
                                            </button>
                                        </div>
                                    </div>
                            </li>
                        ))}
                    </ul>
            </div>
            <div className="flex justify-between items-center">
                {pagesCount < maxPages ? (
                    <Link
                        href="/dashboard/pages/new"
                        className="bg-gray-200 dark:text-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors dark:bg-gray-400 dark:hover:bg-gray-500"
                    >
                        <Plus />
                    </Link>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            disabled
                            className="bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed opacity-50"
                            title="Maximum pages limit reached"
                        >
                            <Plus />
                        </button>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Limit reached</span>
                    </div>
                )}
            </div>
        </div>
    );
}