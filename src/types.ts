export interface AnimalItem {
  id: string;
  name: string;
  status: string;
  description: string;
  imageUrl: string;
  imagePosition?: string;
  tag: string;
  fullStory?: string;
  rescueDetails?: string;
}

export interface CarouselImage {
  id: string;
  url: string;
  title: string;
  caption: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  date: string;
  imageUrl: string;
  readTime: string;
}

export interface AnimalStory {
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  imageUrl: string;
  status: string;
}

export interface CauseAllocation {
  icon: string;
  cents: number;
  label: string;
  title: string;
  detail: string;
}

export interface CampaignStats {
  goal_cents: number;
  raised_cents: number;
  donors_count: number;
  people_helped: number;
  surgery_cost_cents: number;
}
