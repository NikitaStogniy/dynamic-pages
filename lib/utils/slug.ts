import { SLUG_CONFIG } from '@/lib/constants';

/**
 * Generates a random alphanumeric slug
 */
export function generateSlug(): string {
  let slug = '';
  for (let i = 0; i < SLUG_CONFIG.LENGTH; i++) {
    slug += SLUG_CONFIG.CHARS.charAt(
      Math.floor(Math.random() * SLUG_CONFIG.CHARS.length)
    );
  }
  return slug;
}

/**
 * Generates multiple unique slug candidates
 */
export function generateSlugCandidates(count: number): string[] {
  const candidates = new Set<string>();

  while (candidates.size < count) {
    candidates.add(generateSlug());
  }

  return Array.from(candidates);
}

/**
 * Validates slug format
 */
export function isValidSlug(slug: string): boolean {
  const regex = new RegExp(`^[${SLUG_CONFIG.CHARS}]{${SLUG_CONFIG.LENGTH}}$`);
  return regex.test(slug);
}
