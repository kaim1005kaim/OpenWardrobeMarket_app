/**
 * Event/Contest types for Influencer/VTuber design contests
 */

export interface Event {
  id: string;
  title: string;
  description: string;
  organizer: EventOrganizer;
  coverImageUrl: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'voting' | 'ended';
  category: 'fashion' | 'vtuber' | 'brand' | 'community';
  submissionCount: number;
  prizePool?: string;
  rules?: string;
  tags: string[];
  createdAt: string;
}

export interface EventOrganizer {
  id: string;
  name: string;
  type: 'influencer' | 'vtuber' | 'brand' | 'platform';
  avatarUrl?: string;
  verified: boolean;
}

export interface EventSubmission {
  id: string;
  eventId: string;
  userId: string;
  designId: string;
  imageUrl: string;
  title: string;
  description: string;
  submittedAt: string;
  votes: number;
  isWinner: boolean;
  winnerRank?: number;
}

export interface PublicationOptions {
  status: 'published' | 'draft';
  price: number;
  eventId?: string; // Optional: submit to an event
  isEventExclusive?: boolean; // If true, only visible in event context
}
