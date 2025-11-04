import { apiService } from './api.service';
import type { Page } from '@/lib/db/schema';
import type { OutputData } from '@/lib/types/editor';

export interface CreatePageRequest {
  title: string;
  slug: string;
  content: OutputData;
}

export interface UpdatePageRequest {
  title?: string;
  content?: OutputData;
}

class PagesService {
  private readonly basePath = '/api/pages';

  /**
   * Get all pages for the authenticated user
   */
  async getAllPages(): Promise<Page[]> {
    return apiService.get<Page[]>(this.basePath);
  }

  /**
   * Get a single page by slug
   */
  async getPageBySlug(slug: string): Promise<Page> {
    return apiService.get<Page>(`${this.basePath}/${slug}`);
  }

  /**
   * Create a new page
   */
  async createPage(data: CreatePageRequest): Promise<Page> {
    return apiService.post<Page>(this.basePath, data);
  }

  /**
   * Update an existing page
   */
  async updatePage(slug: string, data: UpdatePageRequest): Promise<Page> {
    return apiService.put<Page>(`${this.basePath}/${slug}`, data);
  }

  /**
   * Delete a page
   */
  async deletePage(slug: string): Promise<void> {
    return apiService.delete<void>(`${this.basePath}/${slug}`);
  }
}

export const pagesService = new PagesService();
export default PagesService;