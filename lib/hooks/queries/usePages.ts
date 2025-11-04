'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pagesController } from '@/lib/controllers/pages.controller';
import type { Page } from '@/lib/db/schema';
import type { CreatePageData, UpdatePageData } from '@/lib/controllers/pages.controller';

export const PAGES_QUERY_KEY = ['pages'] as const;
export const PAGE_QUERY_KEY = (slug: string) => ['page', slug] as const;

/**
 * Hook to fetch all pages
 */
export function usePages() {
  return useQuery({
    queryKey: PAGES_QUERY_KEY,
    queryFn: () => pagesController.getAllPages(),
  });
}

/**
 * Hook to fetch a single page by slug
 */
export function usePage(slug: string) {
  return useQuery({
    queryKey: PAGE_QUERY_KEY(slug),
    queryFn: () => pagesController.getPageBySlug(slug),
    enabled: !!slug,
  });
}

/**
 * Hook to create a new page
 */
export function useCreatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePageData) => pagesController.createPage(data),
    onSuccess: (newPage) => {
      // Invalidate and refetch pages list
      queryClient.invalidateQueries({ queryKey: PAGES_QUERY_KEY });
      
      // Optionally, add the new page to the cache immediately
      queryClient.setQueryData(PAGE_QUERY_KEY(newPage.slug), newPage);
    },
  });
}

/**
 * Hook to update a page
 */
export function useUpdatePage(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePageData) => pagesController.updatePage(slug, data),
    onMutate: async (data) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: PAGE_QUERY_KEY(slug) });

      // Snapshot the previous value
      const previousPage = queryClient.getQueryData<Page>(PAGE_QUERY_KEY(slug));

      // Optimistically update to the new value
      if (previousPage) {
        queryClient.setQueryData<Page>(PAGE_QUERY_KEY(slug), {
          ...previousPage,
          ...data,
          updatedAt: new Date(),
        });
      }

      // Return a context with the previous and new page
      return { previousPage };
    },
    onError: (err, data, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousPage) {
        queryClient.setQueryData(PAGE_QUERY_KEY(slug), context.previousPage);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: PAGE_QUERY_KEY(slug) });
      queryClient.invalidateQueries({ queryKey: PAGES_QUERY_KEY });
    },
  });
}

/**
 * Hook to delete a page
 */
export function useDeletePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => pagesController.deletePage(slug),
    onMutate: async (slug) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: PAGES_QUERY_KEY });

      // Snapshot the previous value
      const previousPages = queryClient.getQueryData<Page[]>(PAGES_QUERY_KEY);

      // Optimistically remove the page from the list
      if (previousPages) {
        queryClient.setQueryData<Page[]>(
          PAGES_QUERY_KEY,
          previousPages.filter((page) => page.slug !== slug)
        );
      }

      // Return a context with the previous pages
      return { previousPages };
    },
    onError: (err, slug, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousPages) {
        queryClient.setQueryData(PAGES_QUERY_KEY, context.previousPages);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: PAGES_QUERY_KEY });
    },
  });
}

/**
 * Hook to check if a slug is available
 */
export function useCheckSlugAvailability(slug: string) {
  return useQuery({
    queryKey: ['slug-availability', slug] as const,
    queryFn: () => pagesController.isSlugAvailable(slug),
    enabled: !!slug && slug.length > 0,
    staleTime: 0, // Always fetch fresh data for availability checks
  });
}