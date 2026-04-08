export type CommunityVisibility = 'public' | 'private';

export type CommunityRules = {
  allowProfanity: boolean;
  ageRestricted: boolean;
  spamProtection: boolean;
  allowImages: boolean;
  autoBan: boolean;
};

export type Community = {
  id: number;
  owner: string;
  name: string;
  description: string;
  categories: string[];
  visibility: CommunityVisibility;
  rules: CommunityRules;
  colorScheme?: string;
  thumbnailUrl?: string;
  createdAt: string;
};