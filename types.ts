
export enum CategoryType {
  YOGA = 'Yoga',
  MUSIC = 'Music',
  MEDITATION = 'Meditation',
  TALKS = 'Talks',
  DANCE = 'Dance',
  WORKSHOP = 'Workshop'
}

export interface Category {
  id: string;
  name: CategoryType;
  color: string;
}

export interface Venue {
  id: string;
  name: string;
  description?: string;
}

export interface Presenter {
  id: string;
  name: string;
  bio: string;
  image: string;
  website?: string;
  instagram?: string;
  facebook?: string;
}

export interface FestivalEvent {
  id: string;
  title: string;
  description: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  venueId: string;
  categoryId: string;
  presenterIds: string[];
  tags: string[];
}

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  favorites: string[];
  interests?: string[];
  phone?: string;
  avatarUrl?: string;
}

export type ViewMode = 'grid' | 'list' | 'venue';
