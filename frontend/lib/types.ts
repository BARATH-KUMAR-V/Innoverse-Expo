export interface PublicUser {
  id: string;
  name: string;
  email: string;
  picture: string | null;
  isAdmin: boolean;
}

export interface GalleryTeam {
  id: string;
  teamName: string;
  imageUrl: string | null;
}

export interface TeamDetail extends GalleryTeam {
  videoUrl: string | null;
}

export interface AdminTeam extends TeamDetail {
  isActive: boolean;
  votes: number;
  createdAt: string;
}

export type VotingState = "NOT_STARTED" | "LIVE" | "CLOSED" | "RESULTS_PUBLISHED";

export interface VotingStatus {
  votingOpen: boolean;
  votingState: VotingState;
  votingEndsAt: string | null;
  winnersAnnounceAt: string | null;
}

export interface EventSettings {
  expoName: string;
  expoDate: string | null;
  expoVenue: string | null;
  votingStartsAt: string | null;
  votingEndsAt: string | null;
  winnersAnnounceAt: string | null;
  votingState: VotingState;
}

export interface MyVote {
  hasVoted: boolean;
  teamId: string | null;
}

export interface AdminStats {
  votingOpen: boolean;
  winnersPublished: boolean;
  totalVotes: number;
  eligibleVoters: number;
  participation: number;
}

export interface RankingRow {
  teamId: string;
  teamName: string;
  votes: number;
}

export interface ResultsWinner {
  rank: number;
  teamId: string;
  teamName: string;
  votes: number;
}

export interface ResultsResponse {
  published: boolean;
  winners: ResultsWinner[];
}
