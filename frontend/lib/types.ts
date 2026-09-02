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

export interface VotingStatus {
  votingOpen: boolean;
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
