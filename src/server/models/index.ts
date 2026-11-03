import mongoose, { Schema, Document } from 'mongoose';
import type {
  UserRole,
  AvailabilityStatus,
  ExperienceLevel,
  PortfolioItem,
  ProjectStatus,
  MilestoneItem,
  ProposalStatus,
  MatchBreakdown,
  ContractStatus,
} from '../../shared/types.js';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  title: string;
  bio: string;
  company?: string;
  location: string;
  avatarUrl?: string;
  bannerUrl?: string;
  skills: string[];
  highlights?: string[];
  experiences?: {
    _id?: string;
    title: string;
    company: string;
    period: string;
    description: string;
  }[];
  customReviews?: {
    _id?: string;
    reviewerName: string;
    rating: number;
    dateText: string;
    comment: string;
  }[];
  certificates?: {
    _id?: string;
    title: string;
    issuer: string;
    issueDate: string;
    credentialUrl?: string;
    credentialId?: string;
    fileDataUrl?: string;
    fileName?: string;
    fileType?: 'image' | 'pdf';
  }[];
  hourlyRate: number;
  availability: AvailabilityStatus;
  experienceLevel: ExperienceLevel;
  yearsExperience: number;
  rating: number;
  reviewCount: number;
  completedProjects: number;
  completionRate: number;
  verified: boolean;
  emailVerified: boolean;
  portfolio: PortfolioItem[];
  savedProjects: string[];
  savedFreelancers: string[];
  onboarded: boolean;
  isDemo: boolean;
  googleId?: string;
  githubId?: string;
  resetPasswordTokenHash?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioItemSchema = new Schema<PortfolioItem>(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    metrics: { type: String },
    link: { type: String },
    githubUrl: { type: String },
    imageUrl: { type: String },
    tags: [{ type: String }],
    featured: { type: Boolean, default: false },
    verifiedRealWork: { type: Boolean, default: false },
    verificationScore: { type: Number, default: 0 },
    templateVariant: { type: String },
  },
  { _id: true }
);

const ExperienceSchema = new Schema(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    period: { type: String, required: true },
    description: { type: String, default: '' },
  },
  { _id: true }
);

const CustomReviewSchema = new Schema(
  {
    reviewerName: { type: String, required: true },
    rating: { type: Number, default: 5 },
    dateText: { type: String, default: 'Recently' },
    comment: { type: String, required: true },
  },
  { _id: true }
);

const CertificateSchema = new Schema(
  {
    title: { type: String, required: true },
    issuer: { type: String, required: true },
    issueDate: { type: String, required: true },
    credentialUrl: { type: String, default: '' },
    credentialId: { type: String, default: '' },
    fileDataUrl: { type: String, default: '' },
    fileName: { type: String, default: '' },
    fileType: { type: String, enum: ['image', 'pdf'] },
  },
  { _id: true }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['client', 'freelancer', 'admin'], required: true, default: 'freelancer' },
    title: { type: String, default: '' },
    bio: { type: String, default: '' },
    company: { type: String, default: '' },
    location: { type: String, default: 'Remote' },
    avatarUrl: { type: String, default: '' },
    bannerUrl: { type: String, default: '' },
    skills: { type: [String], default: [] },
    highlights: { type: [String], default: [] },
    experiences: { type: [ExperienceSchema], default: [] },
    customReviews: { type: [CustomReviewSchema], default: [] },
    certificates: { type: [CertificateSchema], default: [] },
    hourlyRate: { type: Number, default: 95 },
    availability: { type: String, enum: ['available', 'part-time', 'busy'], default: 'available' },
    experienceLevel: { type: String, enum: ['mid', 'senior', 'principal'], default: 'senior' },
    yearsExperience: { type: Number, default: 5 },
    rating: { type: Number, default: 5.0 },
    reviewCount: { type: Number, default: 0 },
    completedProjects: { type: Number, default: 0 },
    completionRate: { type: Number, default: 100 },
    verified: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    portfolio: { type: [PortfolioItemSchema], default: [] },
    savedProjects: { type: [String], default: [] },
    savedFreelancers: { type: [String], default: [] },
    onboarded: { type: Boolean, default: false },
    isDemo: { type: Boolean, default: false },
    googleId: { type: String, index: true, sparse: true },
    githubId: { type: String, index: true, sparse: true },
    resetPasswordTokenHash: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

UserSchema.index({ role: 1, availability: 1 });
UserSchema.index({ skills: 1 });

export interface IProject extends Document {
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
  client: mongoose.Types.ObjectId;
  proposalCount: number;
  milestones: MilestoneItem[];
  acceptedProposalId?: mongoose.Types.ObjectId;
  assignedFreelancerId?: mongoose.Types.ObjectId;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSchema = new Schema<MilestoneItem>(
  {
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    dueDays: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'submitted', 'approved'], default: 'pending' },
  },
  { _id: false }
);

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true, trim: true },
    summary: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    requiredSkills: { type: [String], required: true, index: true },
    budgetMin: { type: Number, required: true },
    budgetMax: { type: Number, required: true },
    budgetType: { type: String, enum: ['fixed', 'hourly'], default: 'fixed' },
    deadlineDays: { type: Number, required: true, default: 21 },
    experienceLevel: { type: String, enum: ['mid', 'senior', 'principal'], default: 'senior' },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'completed', 'cancelled'],
      default: 'open',
      index: true,
    },
    client: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    proposalCount: { type: Number, default: 0 },
    milestones: { type: [MilestoneSchema], default: [] },
    acceptedProposalId: { type: Schema.Types.ObjectId, ref: 'Proposal' },
    assignedFreelancerId: { type: Schema.Types.ObjectId, ref: 'User' },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export interface IProposal extends Document {
  projectId: mongoose.Types.ObjectId;
  freelancer: mongoose.Types.ObjectId;
  coverLetter: string;
  bidAmount: number;
  estimatedDays: number;
  milestones: MilestoneItem[];
  status: ProposalStatus;
  matchSnapshot: MatchBreakdown;
  createdAt: Date;
  updatedAt: Date;
}

const ProposalSchema = new Schema<IProposal>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    freelancer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    coverLetter: { type: String, required: true },
    bidAmount: { type: Number, required: true },
    estimatedDays: { type: Number, required: true },
    milestones: { type: [MilestoneSchema], default: [] },
    status: {
      type: String,
      enum: ['pending', 'shortlisted', 'accepted', 'rejected'],
      default: 'pending',
    },
    matchSnapshot: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

ProposalSchema.index({ projectId: 1, freelancer: 1 }, { unique: true });

export interface IContract extends Document {
  projectId: mongoose.Types.ObjectId;
  proposalId: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  freelancer: mongoose.Types.ObjectId;
  agreedAmount: number;
  estimatedDays: number;
  status: ContractStatus;
  deliverableSummary?: string;
  deliverableUrl?: string;
  revisionNotes?: string;
  disputeReason?: string;
  rejectionReason?: string;
  cancelledAt?: Date;
  submittedAt?: Date;
  completedAt?: Date;
  milestones: MilestoneItem[];
  reviewSubmitted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ContractSchema = new Schema<IContract>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, unique: true },
    proposalId: { type: Schema.Types.ObjectId, ref: 'Proposal', required: true },
    client: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    freelancer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    agreedAmount: { type: Number, required: true },
    estimatedDays: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        'pending_acceptance',
        'active',
        'submitted',
        'in_revision',
        'completed',
        'disputed',
        'cancelled',
      ],
      default: 'pending_acceptance',
    },
    deliverableSummary: { type: String },
    deliverableUrl: { type: String },
    revisionNotes: { type: String },
    disputeReason: { type: String },
    rejectionReason: { type: String },
    cancelledAt: { type: Date },
    submittedAt: { type: Date },
    completedAt: { type: Date },
    milestones: { type: [MilestoneSchema], default: [] },
    reviewSubmitted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export interface IReview extends Document {
  contractId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  freelancer: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    contractId: { type: Schema.Types.ObjectId, ref: 'Contract', required: true, unique: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    client: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    freelancer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

export interface IMessage extends Document {
  projectId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  body: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    body: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'proposal' | 'contract' | 'message' | 'moderation' | 'system';
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['proposal', 'contract', 'message', 'moderation', 'system'],
      default: 'system',
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    link: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export interface IReport extends Document {
  reporter: mongoose.Types.ObjectId;
  targetType: 'project' | 'user' | 'message';
  targetId: string;
  targetTitle: string;
  reason: string;
  details: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  resolutionNotes?: string;
  createdAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['project', 'user', 'message'], required: true },
    targetId: { type: String, required: true },
    targetTitle: { type: String, required: true },
    reason: { type: String, required: true },
    details: { type: String, required: true },
    status: {
      type: String,
      enum: ['open', 'investigating', 'resolved', 'dismissed'],
      default: 'open',
      index: true,
    },
    resolutionNotes: { type: String },
  },
  { timestamps: true }
);

export interface ISupportRequest extends Document {
  name: string;
  email: string;
  topic: 'account' | 'billing' | 'project' | 'trust' | 'other';
  message: string;
  userId?: mongoose.Types.ObjectId;
  status: 'open' | 'closed';
  createdAt: Date;
}

const SupportRequestSchema = new Schema<ISupportRequest>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    topic: {
      type: String,
      enum: ['account', 'billing', 'project', 'trust', 'other'],
      default: 'other',
    },
    message: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
  },
  { timestamps: true }
);

export const User: mongoose.Model<IUser> =
  (mongoose.models.User as mongoose.Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
export const Project: mongoose.Model<IProject> =
  (mongoose.models.Project as mongoose.Model<IProject>) ||
  mongoose.model<IProject>('Project', ProjectSchema);
export const Proposal: mongoose.Model<IProposal> =
  (mongoose.models.Proposal as mongoose.Model<IProposal>) ||
  mongoose.model<IProposal>('Proposal', ProposalSchema);
export const Contract: mongoose.Model<IContract> =
  (mongoose.models.Contract as mongoose.Model<IContract>) ||
  mongoose.model<IContract>('Contract', ContractSchema);
export const Review: mongoose.Model<IReview> =
  (mongoose.models.Review as mongoose.Model<IReview>) ||
  mongoose.model<IReview>('Review', ReviewSchema);
export const Message: mongoose.Model<IMessage> =
  (mongoose.models.Message as mongoose.Model<IMessage>) ||
  mongoose.model<IMessage>('Message', MessageSchema);
export const Notification: mongoose.Model<INotification> =
  (mongoose.models.Notification as mongoose.Model<INotification>) ||
  mongoose.model<INotification>('Notification', NotificationSchema);
export const Report: mongoose.Model<IReport> =
  (mongoose.models.Report as mongoose.Model<IReport>) ||
  mongoose.model<IReport>('Report', ReportSchema);
export const SupportRequest: mongoose.Model<ISupportRequest> =
  (mongoose.models.SupportRequest as mongoose.Model<ISupportRequest>) ||
  mongoose.model<ISupportRequest>('SupportRequest', SupportRequestSchema);

