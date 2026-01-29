
import { Category, CategoryType, Venue, Presenter, FestivalEvent } from './types';

export const CATEGORIES: Category[] = [
  { id: 'cat-1', name: CategoryType.YOGA, color: '#ef4444' }, // Red
  { id: 'cat-2', name: CategoryType.MUSIC, color: '#22c55e' }, // Green
  { id: 'cat-3', name: CategoryType.MEDITATION, color: '#3b82f6' }, // Blue
  { id: 'cat-4', name: CategoryType.TALKS, color: '#eab308' }, // Yellow
  { id: 'cat-5', name: CategoryType.DANCE, color: '#a855f7' }, // Purple
  { id: 'cat-6', name: CategoryType.WORKSHOP, color: '#f97316' }, // Orange
];

export const VENUES: Venue[] = [
  { id: 'v-1', name: 'Dharma Pavilion', description: 'The main stage for large-scale yoga and flow sessions.' },
  { id: 'v-2', name: 'Spirit Pool Stage', description: 'Sun-drenched stage perfect for upbeat music and movement.' },
  { id: 'v-3', name: 'The Grove', description: 'A shaded sanctuary under tropical trees for workshops.' },
  { id: 'v-4', name: 'Soul Lounge', description: 'Intimate space for talks, storytelling, and acoustic music.' },
  { id: 'v-5', name: 'Healing Shala', description: 'Dedicated space for meditation and deep restorative practices.' },
];

export const PRESENTERS: Presenter[] = [
  { 
    id: 'p-1', 
    name: 'Ananda Das', 
    bio: 'Renowned kirtan artist and yoga teacher with 20 years experience in the bhakti tradition.',
    image: 'https://picsum.photos/seed/ananda/400/400',
    instagram: '@anandadas',
    website: 'anandadas.com'
  },
  { 
    id: 'p-2', 
    name: 'Sarah Flow', 
    bio: 'Vinyasa flow specialist focused on somatic movement and the intersection of dance and yoga.',
    image: 'https://picsum.photos/seed/sarah/400/400',
    instagram: '@sarahflow_yoga'
  },
  { 
    id: 'p-3', 
    name: 'DJ Sol', 
    bio: 'Ecstatic dance pioneer from Ibiza, mixing tribal rhythms with deep house medicine.',
    image: 'https://picsum.photos/seed/djsol/400/400',
    instagram: '@dj_sol_spirit'
  },
  { 
    id: 'p-4', 
    name: 'Maya Fiennes', 
    bio: 'Global Kundalini teacher known for her unique style combining yoga, tai chi, and qi gong.',
    image: 'https://picsum.photos/seed/maya/400/400',
    website: 'mayafiennes.com'
  },
  { 
    id: 'p-5', 
    name: 'Simon Borg-Olivier', 
    bio: 'Physiotherapist and yoga synergy founder with over 30 years of teaching experience.',
    image: 'https://picsum.photos/seed/simon/400/400'
  },
  { 
    id: 'p-6', 
    name: 'Janet Stone', 
    bio: 'San Francisco-based teacher focusing on the vinyasa of life and the power of breath.',
    image: 'https://picsum.photos/seed/janet/400/400',
    instagram: '@janetstoneyoga'
  },
  { 
    id: 'p-7', 
    name: 'Dustin Thomas', 
    bio: 'International beatbox-roots-folk artist known for his high-energy acoustic performances.',
    image: 'https://picsum.photos/seed/dustin/400/400'
  },
  { 
    id: 'p-8', 
    name: 'Malaika MaVeena', 
    bio: 'Expert facilitator of 5Rhythms and African dance, bridging culture and consciousness.',
    image: 'https://picsum.photos/seed/malaika/400/400'
  },
  { 
    id: 'p-9', 
    name: 'Tenzin Priyadarshi', 
    bio: 'Buddhist monk and philosopher focused on the ethics of compassion and technology.',
    image: 'https://picsum.photos/seed/tenzin/400/400'
  },
  { 
    id: 'p-10', 
    name: 'Guru Ganesha', 
    bio: 'Guitarist and singer blending traditional Sikh chants with Western musical arrangements.',
    image: 'https://picsum.photos/seed/guru/400/400'
  }
];

const D1 = '2025-05-01'; // Day 1
const D2 = '2025-05-02'; // Day 2

export const INITIAL_EVENTS: FestivalEvent[] = [
  // DAY 1
  {
    id: 'e-1',
    title: 'Sunrise Flow: Grounding in Bali',
    description: 'A gentle morning vinyasa to connect with the island spirits.',
    startTime: `${D1}T07:30:00`,
    endTime: `${D1}T09:00:00`,
    venueId: 'v-1',
    categoryId: 'cat-1',
    presenterIds: ['p-2'],
    tags: ['Yoga Flow', 'Spiritual Growth']
  },
  {
    id: 'e-2',
    title: 'The Art of Conscious Breathing',
    description: 'Pranayama workshop to unlock vital energy and mental clarity.',
    startTime: `${D1}T09:30:00`,
    endTime: `${D1}T11:00:00`,
    venueId: 'v-3',
    categoryId: 'cat-6',
    presenterIds: ['p-5'],
    tags: ['Breathwork', 'Active Workshops']
  },
  {
    id: 'e-3',
    title: 'Kirtan Jam with Ananda',
    description: 'Devotional chanting to open the heart and raise the collective vibration.',
    startTime: `${D1}T11:30:00`,
    endTime: `${D1}T13:00:00`,
    venueId: 'v-2',
    categoryId: 'cat-2',
    presenterIds: ['p-1'],
    tags: ['Kirtan', 'Healing Music']
  },
  {
    id: 'e-4',
    title: 'Sustainability in Spirituality',
    description: 'Panel talk on how to live an eco-conscious life in a modern world.',
    startTime: `${D1}T14:00:00`,
    endTime: `${D1}T15:30:00`,
    venueId: 'v-4',
    categoryId: 'cat-4',
    presenterIds: ['p-9'],
    tags: ['Philosophy', 'Sustainability']
  },
  {
    id: 'e-5',
    title: 'Ecstatic Dance Opening',
    description: 'Shake off the past and move into the present with DJ Sol.',
    startTime: `${D1}T16:00:00`,
    endTime: `${D1}T18:00:00`,
    venueId: 'v-2',
    categoryId: 'cat-5',
    presenterIds: ['p-3'],
    tags: ['Ecstatic Dance', 'High Energy']
  },
  {
    id: 'e-6',
    title: 'Evening Zen Meditation',
    description: 'Silent meditation focused on mindfulness and stillness.',
    startTime: `${D1}T18:30:00`,
    endTime: `${D1}T19:30:00`,
    venueId: 'v-5',
    categoryId: 'cat-3',
    presenterIds: ['p-9'],
    tags: ['Meditation', 'Deep Restorative']
  },
  {
    id: 'e-7',
    title: 'Acoustic Soul Session',
    description: 'Heartfelt melodies and beatbox rhythms under the stars.',
    startTime: `${D1}T20:00:00`,
    endTime: `${D1}T21:30:00`,
    venueId: 'v-4',
    categoryId: 'cat-2',
    presenterIds: ['p-7'],
    tags: ['Healing Music', 'Community']
  },
  {
    id: 'e-8',
    title: 'Bhakti Flow Yoga',
    description: 'Dynamic movement coupled with devotional song.',
    startTime: `${D1}T11:30:00`,
    endTime: `${D1}T13:00:00`,
    venueId: 'v-1',
    categoryId: 'cat-1',
    presenterIds: ['p-6'],
    tags: ['Yoga Flow', 'Kirtan']
  },
  {
    id: 'e-9',
    title: 'African Rhythm & Movement',
    description: 'Traditional dance workshop focusing on polyrhythms and joy.',
    startTime: `${D1}T14:00:00`,
    endTime: `${D1}T15:30:00`,
    venueId: 'v-2',
    categoryId: 'cat-5',
    presenterIds: ['p-8'],
    tags: ['Active Workshops', 'Ecstatic Dance']
  },
  {
    id: 'e-10',
    title: 'Sound Healing Bath',
    description: 'Crystal bowls and sacred chants for deep cellular repair.',
    startTime: `${D1}T16:00:00`,
    endTime: `${D1}T17:30:00`,
    venueId: 'v-5',
    categoryId: 'cat-3',
    presenterIds: ['p-1', 'p-10'],
    tags: ['Sound Healing', 'Deep Restorative']
  }
];
