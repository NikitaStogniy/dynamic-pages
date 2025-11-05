import { pagesService } from '@/lib/services/pages.service';
import type { Page } from '@/lib/db/schema';
import type { OutputData } from '@/lib/types/editor';

export interface CreatePageData {
  title: string;
  content: OutputData;
  slug?: string;
  qrExpiryMinutes?: number | null;
}

export interface UpdatePageData {
  title?: string;
  content?: OutputData;
  qrExpiryMinutes?: number | null;
}

class PagesController {
  /**
   * Generate a random 8-character alphanumeric slug
   */
  generateSlug(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Validate page data before creation
   */
  validatePageData(data: CreatePageData): void {
    if (!data.title?.trim()) {
      throw new Error('Title is required');
    }
    
    if (data.title.length > 255) {
      throw new Error('Title must be less than 255 characters');
    }
  }

  /**
   * Get all pages for the current user
   */
  async getAllPages(): Promise<Page[]> {
    return pagesService.getAllPages();
  }

  /**
   * Get a single page by slug
   */
  async getPageBySlug(slug: string): Promise<Page> {
    if (!slug) {
      throw new Error('Slug is required');
    }
    return pagesService.getPageBySlug(slug);
  }

  /**
   * Create a new page
   */
  async createPage(data: CreatePageData): Promise<Page> {
    this.validatePageData(data);

    const pageData = {
      title: data.title.trim(),
      slug: data.slug || this.generateSlug(),
      content: data.content || {},
      qrExpiryMinutes: data.qrExpiryMinutes,
    };

    return pagesService.createPage(pageData);
  }

  /**
   * Update an existing page
   */
  async updatePage(slug: string, data: UpdatePageData): Promise<Page> {
    if (!slug) {
      throw new Error('Slug is required');
    }

    if (data.title !== undefined && !data.title.trim()) {
      throw new Error('Title cannot be empty');
    }

    const updateData: UpdatePageData = {};

    if (data.title !== undefined) {
      updateData.title = data.title.trim();
    }

    if (data.content !== undefined) {
      updateData.content = data.content;
    }

    if (data.qrExpiryMinutes !== undefined) {
      updateData.qrExpiryMinutes = data.qrExpiryMinutes;
    }

    return pagesService.updatePage(slug, updateData);
  }

  /**
   * Delete a page
   */
  async deletePage(slug: string): Promise<void> {
    if (!slug) {
      throw new Error('Slug is required');
    }
    return pagesService.deletePage(slug);
  }

  /**
   * Check if a slug is available
   */
  async isSlugAvailable(slug: string): Promise<boolean> {
    try {
      await pagesService.getPageBySlug(slug);
      return false;
    } catch (error) {
      // If we get a 404, the slug is available
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        return true;
      }
      // For any other error, re-throw it
      throw error;
    }
  }

  /**
   * Generate a unique slug with retry mechanism
   */
  async generateUniqueSlug(maxRetries: number = 10): Promise<string | null> {
    for (let i = 0; i < maxRetries; i++) {
      const slug = this.generateSlug();
      const isAvailable = await this.isSlugAvailable(slug);
      if (isAvailable) {
        return slug;
      }
    }
    return null; // Failed to generate unique slug after max retries
  }

  /**
   * Batch delete multiple pages
   */
  async deleteMultiplePages(slugs: string[]): Promise<void> {
    const deletePromises = slugs.map(slug => this.deletePage(slug));
    await Promise.all(deletePromises);
  }

  /**
   * Export page content in different formats
   */
  exportPageContent(page: Page, format: 'json' | 'markdown' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify({
        title: page.title,
        content: page.content,
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
      }, null, 2);
    }
    
    // Basic markdown export (can be enhanced based on Editor.js content structure)
    return `# ${page.title}\n\n${JSON.stringify(page.content)}`;
  }
}

export const pagesController = new PagesController();
export default PagesController;