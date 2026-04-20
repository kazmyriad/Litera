// Valid community categories - must match database schema
export const VALID_CATEGORIES = [
  'fantasy',
  'horror',
  'art',
  'science',
  'music',
  'sports',
  'movies',
  'literature',
  'travel',
  'food',
  'romance',
  'sci-fi',
  'fiction',
  'non-fiction'
] as const;

export type CategoryType = typeof VALID_CATEGORIES[number];

export const formatCategoryName = (category: string): string => {
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-');
};
