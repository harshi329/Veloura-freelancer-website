export type UserRole = 'client' | 'freelancer' | 'admin';

export type AvailabilityStatus = 'available' | 'part-time' | 'busy';

export type ExperienceLevel = 'mid' | 'senior' | 'principal';

export interface PortfolioItem {
  _id?: string;
  title: string;
  category: string;
  description: string;
  metrics?: string;
  link?: string;
  githubUrl?: string; // Mandatory PoC link
  imageUrl?: string;
  tags: string[];
  featured?: boolean;
  verifiedRealWork?: boolean;
  verificationScore?: number;
  templateVariant?: string;
}

export interface ExperienceRecord {
  _id?: string;
  title: string;
  company: string;
  period: string;
  description: string;
}

export interface CustomReviewRecord {
  _id?: string;
  reviewerName: string;
  rating: number;
  dateText: string;
  comment: string;
}

export interface CertificateRecord {
  _id?: string;
  title: string;
  issuer: string;
  issueDate: string;
  credentialUrl?: string;
  credentialId?: string;
  fileDataUrl?: string;
  fileName?: string;
  fileType?: 'image' | 'pdf';
}

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  bio: string;
  company?: string;
  location: string;
  avatarUrl?: string;
  bannerUrl?: string;
  skills: string[];
  highlights?: string[];
  experiences?: ExperienceRecord[];
  customReviews?: CustomReviewRecord[];
  certificates?: CertificateRecord[];
  hourlyRate: number;
  availability: AvailabilityStatus;
  experienceLevel: ExperienceLevel;
  yearsExperience: number;
  rating: number;
  reviewCount: number;
  completedProjects: number;
  completionRate: number;
  verified: boolean;
  emailVerified?: boolean;
  portfolio: PortfolioItem[];
  savedProjects?: string[];
  savedFreelancers?: string[];
  onboarded: boolean;
  isDemo?: boolean;
  createdAt: string;
}

export type ProjectStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

export interface MilestoneItem {
  title: string;
  amount: number;
  dueDays: number;
  status?: 'pending' | 'submitted' | 'approved';
}

export interface ProjectItem {
  _id: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  requiredSkills: string[];
  budgetMin: number;
  budgetMax: number;
  budgetType: 'fixed' | 'hourly';
  deadlineDays: number;
  experienceLevel: ExperienceLevel;
  status: ProjectStatus;
  client: {
    _id: string;
    name: string;
    company?: string;
    location?: string;
    verified?: boolean;
  };
  proposalCount: number;
  milestones: MilestoneItem[];
  acceptedProposalId?: string;
  assignedFreelancerId?: string;
  isDemo?: boolean;
  createdAt: string;
}

export type ProposalStatus = 'pending' | 'shortlisted' | 'accepted' | 'rejected';

export interface MatchFactor {
  key: 'skills' | 'budget' | 'experience' | 'portfolio' | 'availability';
  label: string;
  score: number;
  maxScore: number;
  explanation: string;
}

export interface MatchBreakdown {
  totalScore: number;
  tier: 'Exceptional Match' | 'Strong Match' | 'Balanced Match' | 'Exploratory Match';
  matchedSkills: string[];
  missingSkills: string[];
  factors: MatchFactor[];
}

export interface ProposalItem {
  _id: string;
  projectId: string | ProjectItem;
  freelancer: UserProfile;
  coverLetter: string;
  bidAmount: number;
  estimatedDays: number;
  milestones: MilestoneItem[];
  status: ProposalStatus;
  matchSnapshot: MatchBreakdown;
  createdAt: string;
}

export type ContractStatus =
  | 'pending_acceptance'
  | 'active'
  | 'submitted'
  | 'in_revision'
  | 'completed'
  | 'disputed'
  | 'cancelled';

export interface ContractItem {
  _id: string;
  projectId: ProjectItem;
  proposalId: string;
  client: UserProfile;
  freelancer: UserProfile;
  agreedAmount: number;
  estimatedDays: number;
  status: ContractStatus;
  deliverableSummary?: string;
  deliverableUrl?: string;
  revisionNotes?: string;
  disputeReason?: string;
  rejectionReason?: string;
  cancelledAt?: string;
  submittedAt?: string;
  completedAt?: string;
  milestones: MilestoneItem[];
  reviewSubmitted?: boolean;
  createdAt: string;
}

export interface MessageItem {
  _id: string;
  projectId: string;
  sender: {
    _id: string;
    name: string;
    role: UserRole;
  };
  recipient: {
    _id: string;
    name: string;
    role: UserRole;
  };
  body: string;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  userId: string;
  type: 'proposal' | 'contract' | 'message' | 'moderation' | 'system';
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface ReportItem {
  _id: string;
  reporter: {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  targetType: 'project' | 'user' | 'message';
  targetId: string;
  targetTitle: string;
  reason: string;
  details: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  resolutionNotes?: string;
  createdAt: string;
}
