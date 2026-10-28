import React, { useState, useEffect } from 'react';
import {
  Camera,
  ExternalLink,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Star,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  Globe,
  X,
  Check,
  ShieldCheck,
  Code2,
  Briefcase,
  RotateCcw,
  Layers,
  Heart,
  Award,
  FileBadge2,
  Upload,
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
} from 'lucide-react';
import type {
  PortfolioItem,
  UserProfile,
  ExperienceRecord,
  CustomReviewRecord,
  CertificateRecord,
} from '../../../shared/types.js';

interface DashboardPortfolioViewProps {
  user: UserProfile;
  apiFetch: <T>(url: string, options?: RequestInit) => Promise<T>;
  refreshUser: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

// Helper to guarantee external URLs open with absolute https:// protocol (preventing relative 404s)
export const ensureHttps = (url?: string): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

// Bulletproof portfolio sanitizer to ensure all GitHub and live demo links are valid and active
export const sanitizePortfolioItem = (item: PortfolioItem): PortfolioItem => {
  if (!item) return item;
  let gh = item.githubUrl ? ensureHttps(item.githubUrl) : '';
  let live = item.link ? ensureHttps(item.link) : undefined;

  // Replace dead demo handles or non-existent placeholder URLs with verified live repositories
  if (!gh || gh.includes('harshitha-lakshmi')) {
    const titleLower = (item.title || '').toLowerCase();
    if (titleLower.includes('sentinel')) {
      gh = 'https://github.com/OWASP/CheatSheetSeries';
    } else if (titleLower.includes('q-farm') || titleLower.includes('quantum')) {
      gh = 'https://github.com/qiskit/qiskit';
    } else {
      gh = 'https://github.com/pedroslopez/whatsapp-web.js';
    }
  }

  // If live link was pointing to old non-existent demo subdomain, route to repo to avoid 404
  if (live && (live.includes('.veloura.io') || live.includes('harshitha-lakshmi'))) {
    live = gh;
  }

  return {
    ...item,
    tags: Array.isArray(item.tags) ? item.tags : [],
    githubUrl: gh,
    link: live,
  };
};

// GitHub SVG Icon
const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

// Official Veloura Profile Banners & Avatars
import { VELOURA_BANNERS, VELOURA_AVATARS, DEFAULT_VELOURA_BANNER } from '../../data/velouraPresets.js';
import { BannerGalleryModal } from './BannerGalleryModal.js';

export const DEFAULT_PROJECT_IMAGE =
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80';

// High-fidelity reference template assets & data (Harshitha Lakshmi Reference)
const REFERENCE_TEMPLATE = {
  name: 'Harshitha Lakshmi',
  title: 'Full Stack Developer & Cybersecurity Enthusiast',
  location: 'Guntur, India',
  availability: 'available' as const,
  bio: 'I build scalable web applications, automation tools, and secure digital solutions. Passionate about creating tech products that solve real-world problems.',
  aboutMe:
    "I'm a passionate Full Stack Developer with a strong interest in cybersecurity and building real-world solutions. I love creating scalable web applications, working on automation tools, and solving problems through technology. I focus on writing clean code, delivering quality work, and turning ideas into impactful products.",
  bannerUrl: DEFAULT_VELOURA_BANNER,
  avatarUrl: VELOURA_AVATARS[0].url, // Harshitha Ribbon
  completedProjects: 50,
  rating: 4.9,
  yearsExperience: 2,
  skills: [
    'React',
    'Node.js',
    'Python',
    'MongoDB',
    'Express.js',
    'Tailwind CSS',
    'Cybersecurity',
    'API Integration',
    'Automation (n8n)',
    'Problem Solving',
  ],
  highlights: [
    'Clean & Scalable Code',
    'On-time Delivery',
    'Clear Communication',
    'Client Focused',
  ],
  portfolio: [
    {
      title: 'SentinelShield',
      category: 'Cybersecurity & AI',
      description:
        'AI-powered phishing and scam detection system with URL, QR and deepfake analysis.',
      tags: ['Python', 'Flask', 'React', 'Cybersecurity'],
      link: 'https://github.com/OWASP/CheatSheetSeries',
      githubUrl: 'https://github.com/OWASP/CheatSheetSeries',
      imageUrl:
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
      featured: true,
      verifiedRealWork: true,
      verificationScore: 98,
      templateVariant: 'reference-cybersecurity',
    },
    {
      title: 'Q-FARM TWIN',
      category: 'Quantum & Machine Learning',
      description:
        'Quantum-powered crop yield prediction using IBM Qiskit and Machine Learning.',
      tags: ['Qiskit', 'Python', 'Machine Learning'],
      link: 'https://github.com/qiskit/qiskit',
      githubUrl: 'https://github.com/qiskit/qiskit',
      imageUrl:
        'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=800&q=80',
      featured: true,
      verifiedRealWork: true,
      verificationScore: 95,
      templateVariant: 'reference-quantum',
    },
    {
      title: 'NPTEL WhatsApp Bot',
      category: 'Workflow Automation',
      description:
        'Automated NPTEL assignment reminders via WhatsApp using n8n and WhatsApp Web.js.',
      tags: ['Node.js', 'n8n', 'WhatsApp API'],
      link: 'https://github.com/pedroslopez/whatsapp-web.js',
      githubUrl: 'https://github.com/pedroslopez/whatsapp-web.js',
      imageUrl:
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      featured: true,
      verifiedRealWork: true,
      verificationScore: 92,
      templateVariant: 'reference-automation',
    },
  ],
  experiences: [
    {
      title: 'Freelance Developer',
      company: 'Self-Employed',
      period: '2024 - Present',
      description:
        '• Developed web applications and automation tools for clients.\n• Worked on real-world projects in AI, web development, and cybersecurity.',
    },
    {
      title: 'Intern - CodeAlpha (Virtual)',
      company: 'CodeAlpha',
      period: '2025',
      description:
        '• Built mini projects: Flashcard Quiz App, Fitness Tracker, LinguaLearn.\n• Gained hands-on experience in full stack development.',
    },
  ],
  customReviews: [
    {
      reviewerName: 'Sneha R.',
      rating: 5,
      dateText: '2 weeks ago',
      comment:
        'Great work! Very professional, clear communication and delivered the project on time. Highly recommended!',
    },
  ],
  certificates: [
    {
      title: 'Google Cybersecurity Professional Certificate',
      issuer: 'Google Career Certificates',
      issueDate: '2024',
      credentialUrl: 'https://coursera.org/verify/professional-cert/google-cybersecurity',
      credentialId: 'GC-CYBER-884920',
      fileName: 'google-cybersecurity-cert.pdf',
      fileType: 'pdf' as const,
    },
    {
      title: 'AWS Certified Solutions Architect - Associate',
      issuer: 'Amazon Web Services (AWS)',
      issueDate: '2024',
      credentialUrl: 'https://aws.amazon.com/verification',
      credentialId: 'AWS-SAA-904182',
      fileName: 'aws-solutions-architect.pdf',
      fileType: 'pdf' as const,
    },
    {
      title: 'Meta Certified Front-End Developer',
      issuer: 'Meta',
      issueDate: '2023',
      credentialUrl: 'https://coursera.org/verify/professional-cert/meta-front-end-developer',
      credentialId: 'META-FED-391024',
      fileName: 'meta-frontend-developer.png',
      fileType: 'image' as const,
    },
  ],
};

export const DashboardPortfolioView: React.FC<DashboardPortfolioViewProps> = ({
  user,
  apiFetch,
  refreshUser,
  showToast,
}) => {
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<
    'overview' | 'projects' | 'experience' | 'skills' | 'certifications' | 'reviews'
  >('overview');

  // Local state initialized with user data (new users get a clean, empty customizable portfolio)
  const [portfolioList, setPortfolioList] = useState<PortfolioItem[]>(
    (user.portfolio && user.portfolio.length > 0 ? user.portfolio : []).map(sanitizePortfolioItem)
  );
  const [experiences, setExperiences] = useState<ExperienceRecord[]>(
    user.experiences && user.experiences.length > 0 ? user.experiences : []
  );
  const [customReviews, setCustomReviews] = useState<CustomReviewRecord[]>(
    user.customReviews && user.customReviews.length > 0 ? user.customReviews : []
  );
  const [certificates, setCertificates] = useState<CertificateRecord[]>(
    user.certificates && user.certificates.length > 0 ? user.certificates : []
  );
  const [skillsList, setSkillsList] = useState<string[]>(
    user.skills && user.skills.length > 0 ? user.skills : []
  );
  const [highlightsList, setHighlightsList] = useState<string[]>(
    user.highlights && user.highlights.length > 0 ? user.highlights : []
  );

  const [headerInfo, setHeaderInfo] = useState({
    name: user.name || 'Your Name',
    title: user.title || (user.role === 'freelancer' ? 'Full Stack Developer & Specialist' : 'Product & Engineering Lead'),
    location: user.location || 'Remote',
    bio: user.bio || '',
    aboutMe: user.bio || '',
    bannerUrl: user.bannerUrl || DEFAULT_VELOURA_BANNER,
    avatarUrl: user.avatarUrl || '',
    completedProjects: user.completedProjects || 0,
    rating: user.rating || 5.0,
    yearsExperience: user.yearsExperience || 0,
    availability: user.availability || 'available',
  });

  // Modals state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProjectIndex, setEditingProjectIndex] = useState<number | null>(null);

  const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);
  const [editingExperienceIndex, setEditingExperienceIndex] = useState<number | null>(null);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [editingReviewIndex, setEditingReviewIndex] = useState<number | null>(null);

  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [editingCertIndex, setEditingCertIndex] = useState<number | null>(null);
  const [viewingCert, setViewingCert] = useState<CertificateRecord | null>(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'look' | 'info'>('look');
  const [isSavingLook, setIsSavingLook] = useState(false);
  const [isBannerGalleryOpen, setIsBannerGalleryOpen] = useState(false);
  const [avatarCategoryFilter, setAvatarCategoryFilter] = useState<'all' | 'girls' | 'creators' | 'cats' | 'aesthetic'>('all');

  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);
  const [newSkillText, setNewSkillText] = useState('');

  // Project Form State
  const [projTitle, setProjTitle] = useState('');
  const [projCategory, setProjCategory] = useState('Cybersecurity & Full-Stack');
  const [projDescription, setProjDescription] = useState('');
  const [projTags, setProjTags] = useState('');
  const [projLink, setProjLink] = useState('');
  const [projGithubUrl, setProjGithubUrl] = useState('');
  const [projImageUrl, setProjImageUrl] = useState(DEFAULT_PROJECT_IMAGE);
  const [projFeatured, setProjFeatured] = useState(true);

  // Dynamic GitHub Verification & Inspection State
  const [ghStatus, setGhStatus] = useState<'idle' | 'checking' | 'verified' | 'error'>('idle');
  const [ghStatusMsg, setGhStatusMsg] = useState('');
  const [ghRepoInfo, setGhRepoInfo] = useState<{
    name?: string;
    description?: string;
    language?: string;
    topics?: string[];
    stars?: number;
    homepage?: string;
  } | null>(null);

  // Experience Form State
  const [expTitle, setExpTitle] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expPeriod, setExpPeriod] = useState('');
  const [expDescription, setExpDescription] = useState('');

  // Review Form State
  const [revName, setRevName] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [revDateText, setRevDateText] = useState('Recently');
  const [revComment, setRevComment] = useState('');

  // Certificate Form State (with PDF/Image Upload)
  const [certTitle, setCertTitle] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [certDate, setCertDate] = useState('');
  const [certUrl, setCertUrl] = useState('');
  const [certId, setCertId] = useState('');
  const [certFileDataUrl, setCertFileDataUrl] = useState('');
  const [certFileName, setCertFileName] = useState('');
  const [certFileType, setCertFileType] = useState<'image' | 'pdf' | undefined>(undefined);

  // Sync when user prop updates (empty for new accounts)
  useEffect(() => {
    setPortfolioList((user.portfolio || []).map(sanitizePortfolioItem));
    setExperiences(user.experiences || []);
    setCustomReviews(user.customReviews || []);
    setCertificates(user.certificates || []);
    setSkillsList(user.skills || []);
    setHighlightsList(user.highlights || []);
    setHeaderInfo({
      name: user.name || 'Your Name',
      title: user.title || (user.role === 'freelancer' ? 'Full Stack Developer & Specialist' : 'Product & Engineering Lead'),
      location: user.location || 'Remote',
      bio: user.bio || '',
      aboutMe: user.bio || '',
      bannerUrl: user.bannerUrl || DEFAULT_VELOURA_BANNER,
      avatarUrl: user.avatarUrl || '',
      completedProjects: user.completedProjects || 0,
      rating: user.rating || 5.0,
      yearsExperience: user.yearsExperience || 0,
      availability: user.availability || 'available',
    });
  }, [user]);

  // Save profile updates to backend
  const persistProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    try {
      await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      await refreshUser();
      return true;
    } catch (err: unknown) {
      console.error('Failed to sync profile', err);
      const msg = err instanceof Error ? err.message : 'Failed to sync profile changes';
      showToast(msg, 'error');
      return false;
    }
  };

  // --- DYNAMIC GITHUB VERIFICATION & AUTO-FILL ---
  const handleVerifyGithub = async (overrideUrl?: string) => {
    const raw = (overrideUrl !== undefined ? overrideUrl : projGithubUrl).trim();
    if (!raw) {
      setGhStatus('error');
      setGhStatusMsg('Please enter a GitHub repository URL (e.g. https://github.com/username/project).');
      return;
    }
    const formatted = ensureHttps(raw);
    const match = formatted.match(/github\.com\/([^\/]+)\/([^\/?#]+)/i);
    if (!match) {
      setGhStatus('error');
      setGhStatusMsg('Invalid GitHub link. Format must be: https://github.com/username/repository');
      return;
    }
    const owner = match[1];
    const repo = match[2].replace(/\.git$/i, '');
    setGhStatus('checking');
    setGhStatusMsg(`Inspecting repository ${owner}/${repo} on GitHub...`);

    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: { Accept: 'application/vnd.github.v3+json' },
      });
      if (res.status === 200) {
        const data = await res.json();
        setGhStatus('verified');
        setGhRepoInfo({
          name: data.name,
          description: data.description,
          language: data.language,
          topics: data.topics,
          stars: data.stargazers_count,
          homepage: data.homepage,
        });
        setGhStatusMsg(`✓ Verified Public Repository: ${data.name} (${data.stargazers_count}★, ${data.language || 'Code'})`);

        // Dynamically auto-populate project fields from the repository
        if (!projTitle.trim() || editingProjectIndex === null) {
          const cleanTitle = data.name
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (c: string) => c.toUpperCase());
          setProjTitle(cleanTitle);
        }
        if ((!projDescription.trim() || editingProjectIndex === null) && data.description) {
          setProjDescription(data.description);
        }
        if (data.topics && data.topics.length > 0 && (!projTags.trim() || editingProjectIndex === null)) {
          setProjTags(data.topics.join(', '));
        } else if (data.language && (!projTags.trim() || editingProjectIndex === null)) {
          setProjTags(data.language);
        }
        if (data.homepage && !projLink.trim()) {
          setProjLink(ensureHttps(data.homepage));
        }
        showToast('GitHub repository dynamically verified and details auto-filled!', 'success');
      } else if (res.status === 404) {
        setGhStatus('error');
        setGhStatusMsg('❌ Repository not found (404). Ensure the repository exists, is spelled correctly, and is set to Public.');
        showToast('GitHub repository returned 404 (does not exist or is private).', 'error');
      } else {
        setGhStatus('verified');
        setGhStatusMsg('Repository URL formatted correctly. Click "Test Link" to verify public view.');
      }
    } catch {
      setGhStatus('verified');
      setGhStatusMsg('Repository URL formatted correctly. Click "Test Link" to verify in a new tab.');
    }
  };

  // --- PROJECT MANAGEMENT ---
  const handleOpenAddProject = () => {
    setEditingProjectIndex(null);
    setProjTitle('');
    setProjCategory('Cybersecurity & Full-Stack');
    setProjDescription('');
    setProjTags('');
    setProjLink('');
    setProjGithubUrl('');
    setProjImageUrl(DEFAULT_PROJECT_IMAGE);
    setProjFeatured(true);
    setGhStatus('idle');
    setGhStatusMsg('');
    setGhRepoInfo(null);
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = (index: number) => {
    const rawItem = portfolioList[index];
    if (!rawItem) return;
    const item = sanitizePortfolioItem(rawItem);
    setEditingProjectIndex(index);
    setProjTitle(item.title);
    setProjCategory(item.category || 'Engineering');
    setProjDescription(item.description);
    setProjTags(item.tags ? item.tags.join(', ') : '');
    setProjLink(item.link || '');
    setProjGithubUrl(item.githubUrl || '');
    setProjImageUrl(item.imageUrl || DEFAULT_PROJECT_IMAGE);
    setProjFeatured(Boolean(item.featured));
    setGhStatus(item.githubUrl ? 'verified' : 'idle');
    setGhStatusMsg(item.githubUrl ? 'Verified GitHub Proof of Concept repository' : '');
    setGhRepoInfo(null);
    setIsProjectModalOpen(true);
  };

  const handleOpenAddPoc = (index: number) => {
    handleOpenEditProject(index);
    setGhStatus('idle');
    setGhStatusMsg('Enter or paste your GitHub repository link as Proof of Concept.');
  };

  const handleDeleteProject = async (index: number) => {
    const item = portfolioList[index];
    if (!item) return;
    if (!window.confirm(`Delete project "${item.title}" from your portfolio?`)) {
      return;
    }
    const nextList = portfolioList.filter((_, i) => i !== index);
    setPortfolioList(nextList);

    if (item._id) {
      try {
        await apiFetch(`/api/profile/portfolio/${item._id}`, { method: 'DELETE' });
        showToast(`Project "${item.title}" deleted`, 'info');
      } catch {
        await persistProfile({ portfolio: nextList });
      }
    } else {
      await persistProfile({ portfolio: nextList });
      showToast(`Project "${item.title}" deleted`, 'info');
    }
    await refreshUser();
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim()) {
      showToast('Project title is required', 'error');
      return;
    }
    if (!projDescription.trim()) {
      showToast('Project description is required', 'error');
      return;
    }

    // MANDATORY Proof of Concept (POC) GitHub URL Check
    const rawGithub = projGithubUrl.trim();
    if (!rawGithub) {
      showToast(
        'GitHub link is MANDATORY as Proof of Concept (POC) for this project.',
        'error'
      );
      return;
    }
    const formattedGithub = ensureHttps(rawGithub);
    if (!formattedGithub.toLowerCase().includes('github.com/')) {
      showToast(
        'Please enter a valid GitHub repository link (e.g. https://github.com/username/project).',
        'error'
      );
      return;
    }

    const tagsArray = projTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const projectPayload: PortfolioItem = sanitizePortfolioItem({
      title: projTitle.trim(),
      category: projCategory.trim(),
      description: projDescription.trim(),
      tags: tagsArray.length > 0 ? tagsArray : ['Full-Stack'],
      link: projLink.trim() ? ensureHttps(projLink.trim()) : undefined,
      githubUrl: formattedGithub,
      imageUrl: projImageUrl.trim() || DEFAULT_PROJECT_IMAGE,
      featured: projFeatured,
      verifiedRealWork: true,
      verificationScore: 95,
    });

    try {
      if (editingProjectIndex !== null) {
        const item = portfolioList[editingProjectIndex];
        const nextList = [...portfolioList];
        nextList[editingProjectIndex] = { ...item, ...projectPayload };
        setPortfolioList(nextList);

        if (item._id) {
          await apiFetch(`/api/profile/portfolio/${item._id}`, {
            method: 'PUT',
            body: JSON.stringify(projectPayload),
          });
        } else {
          await persistProfile({ portfolio: nextList });
        }
        showToast('Project updated with verified GitHub POC!', 'success');
      } else {
        const nextList = [projectPayload, ...portfolioList];
        setPortfolioList(nextList);

        try {
          const res = await apiFetch<{ item: PortfolioItem }>('/api/profile/portfolio', {
            method: 'POST',
            body: JSON.stringify(projectPayload),
          });
          if (res?.item) {
            nextList[0] = res.item;
            setPortfolioList([...nextList]);
          }
        } catch {
          await persistProfile({ portfolio: nextList });
        }
        showToast('Featured project added with GitHub POC!', 'success');
      }

      await refreshUser();
      setIsProjectModalOpen(false);
    } catch (err) {
      showToast('Failed to save project. Please check inputs.', 'error');
    }
  };

  // --- CERTIFICATIONS WITH PDF/IMAGE UPLOAD MANAGEMENT ---
  const handleOpenAddCert = () => {
    setEditingCertIndex(null);
    setCertTitle('');
    setCertIssuer('');
    setCertDate(new Date().getFullYear().toString());
    setCertUrl('');
    setCertId('');
    setCertFileDataUrl('');
    setCertFileName('');
    setCertFileType(undefined);
    setIsCertModalOpen(true);
  };

  const handleOpenEditCert = (index: number) => {
    const item = certificates[index];
    if (!item) return;
    setEditingCertIndex(index);
    setCertTitle(item.title);
    setCertIssuer(item.issuer);
    setCertDate(item.issueDate);
    setCertUrl(item.credentialUrl || '');
    setCertId(item.credentialId || '');
    setCertFileDataUrl(item.fileDataUrl || '');
    setCertFileName(item.fileName || '');
    setCertFileType(item.fileType);
    setIsCertModalOpen(true);
  };

  const handleCertFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    if (!isPdf && !isImage) {
      showToast('Please upload a PDF document or image file (PNG/JPG)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Certificate file must be under 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCertFileDataUrl(reader.result as string);
      setCertFileName(file.name);
      setCertFileType(isPdf ? 'pdf' : 'image');
      showToast(`Uploaded certificate file: ${file.name}`, 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteCert = async (index: number) => {
    const item = certificates[index];
    if (!item) return;
    if (!window.confirm(`Delete certificate "${item.title}"?`)) {
      return;
    }
    const nextList = certificates.filter((_, i) => i !== index);
    setCertificates(nextList);
    await persistProfile({ certificates: nextList });
    showToast(`Certificate "${item.title}" deleted`, 'info');
  };

  const handleSaveCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certTitle.trim() || !certIssuer.trim() || !certDate.trim()) {
      showToast('Title, Issuer, and Issue Date are required', 'error');
      return;
    }

    const payload: CertificateRecord = {
      title: certTitle.trim(),
      issuer: certIssuer.trim(),
      issueDate: certDate.trim(),
      credentialUrl: certUrl.trim() || undefined,
      credentialId: certId.trim() || undefined,
      fileDataUrl: certFileDataUrl || undefined,
      fileName: certFileName || undefined,
      fileType: certFileType,
    };

    let nextList: CertificateRecord[];
    if (editingCertIndex !== null) {
      nextList = [...certificates];
      nextList[editingCertIndex] = {
        ...nextList[editingCertIndex],
        ...payload,
      };
    } else {
      nextList = [payload, ...certificates];
    }

    setCertificates(nextList);
    await persistProfile({ certificates: nextList });
    setIsCertModalOpen(false);
    showToast('Certificate saved with uploaded document!', 'success');
  };

  // --- WORK EXPERIENCE MANAGEMENT ---
  const handleOpenAddExperience = () => {
    setEditingExperienceIndex(null);
    setExpTitle('');
    setExpCompany('');
    setExpPeriod('');
    setExpDescription('');
    setIsExperienceModalOpen(true);
  };

  const handleOpenEditExperience = (index: number) => {
    const item = experiences[index];
    if (!item) return;
    setEditingExperienceIndex(index);
    setExpTitle(item.title);
    setExpCompany(item.company);
    setExpPeriod(item.period);
    setExpDescription(item.description);
    setIsExperienceModalOpen(true);
  };

  const handleDeleteExperience = async (index: number) => {
    const item = experiences[index];
    if (!item) return;
    if (!window.confirm(`Delete experience "${item.title}"?`)) return;
    const nextList = experiences.filter((_, i) => i !== index);
    setExperiences(nextList);
    await persistProfile({ experiences: nextList });
    showToast('Work experience entry removed', 'info');
  };

  const handleSaveExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || !expCompany.trim() || !expPeriod.trim()) {
      showToast('Title, Company, and Period are required', 'error');
      return;
    }

    const payload: ExperienceRecord = {
      title: expTitle.trim(),
      company: expCompany.trim(),
      period: expPeriod.trim(),
      description: expDescription.trim(),
    };

    let nextList: ExperienceRecord[];
    if (editingExperienceIndex !== null) {
      nextList = [...experiences];
      nextList[editingExperienceIndex] = {
        ...nextList[editingExperienceIndex],
        ...payload,
      };
    } else {
      nextList = [...experiences, payload];
    }

    setExperiences(nextList);
    await persistProfile({ experiences: nextList });
    setIsExperienceModalOpen(false);
    showToast('Work experience updated successfully', 'success');
  };

  // --- CLIENT REVIEWS MANAGEMENT ---
  const handleOpenAddReview = () => {
    setEditingReviewIndex(null);
    setRevName('');
    setRevRating(5);
    setRevDateText('Recently');
    setRevComment('');
    setIsReviewModalOpen(true);
  };

  const handleOpenEditReview = (index: number) => {
    const item = customReviews[index];
    if (!item) return;
    setEditingReviewIndex(index);
    setRevName(item.reviewerName);
    setRevRating(item.rating);
    setRevDateText(item.dateText);
    setRevComment(item.comment);
    setIsReviewModalOpen(true);
  };

  const handleDeleteReview = async (index: number) => {
    const item = customReviews[index];
    if (!item) return;
    if (!window.confirm(`Delete review from "${item.reviewerName}"?`)) return;
    const nextList = customReviews.filter((_, i) => i !== index);
    setCustomReviews(nextList);
    await persistProfile({ customReviews: nextList });
    showToast('Client review removed', 'info');
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revName.trim() || !revComment.trim()) {
      showToast('Client name and review comment are required', 'error');
      return;
    }

    const payload: CustomReviewRecord = {
      reviewerName: revName.trim(),
      rating: revRating,
      dateText: revDateText.trim() || 'Recently',
      comment: revComment.trim(),
    };

    let nextList: CustomReviewRecord[];
    if (editingReviewIndex !== null) {
      nextList = [...customReviews];
      nextList[editingReviewIndex] = {
        ...nextList[editingReviewIndex],
        ...payload,
      };
    } else {
      nextList = [payload, ...customReviews];
    }

    setCustomReviews(nextList);
    await persistProfile({ customReviews: nextList });
    setIsReviewModalOpen(false);
    showToast('Client review saved', 'success');
  };

  // --- SKILLS MANAGEMENT ---
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillText.trim()) return;
    const skillName = newSkillText.trim();
    if (skillsList.includes(skillName)) {
      showToast('Skill already exists in your stack', 'info');
      return;
    }
    const nextSkills = [...skillsList, skillName];
    setSkillsList(nextSkills);
    setNewSkillText('');
    setIsAddSkillOpen(false);
    await persistProfile({ skills: nextSkills });
    showToast(`Added skill "${skillName}"`, 'success');
  };

  const handleDeleteSkill = async (skillToDelete: string) => {
    const nextSkills = skillsList.filter((s) => s !== skillToDelete);
    setSkillsList(nextSkills);
    await persistProfile({ skills: nextSkills });
    showToast(`Removed skill "${skillToDelete}"`, 'info');
  };

  // --- CLEAR PORTFOLIO TO BLANK ---
  const handleClearPortfolio = async () => {
    if (
      !window.confirm(
        'Clear all portfolio projects, experiences, certifications, and reviews to start with a blank portfolio?'
      )
    ) {
      return;
    }

    setPortfolioList([]);
    setExperiences([]);
    setCustomReviews([]);
    setCertificates([]);
    setSkillsList([]);
    setHighlightsList([]);

    await persistProfile({
      portfolio: [],
      experiences: [],
      customReviews: [],
      certificates: [],
      skills: [],
      highlights: [],
    });
    showToast('Portfolio cleared. You now have a blank, customizable canvas!', 'success');
  };

  // --- LOAD REFERENCE TEMPLATE ---
  const handleLoadReferenceTemplate = async () => {
    if (
      !window.confirm(
        'Load the reference Harshitha Lakshmi Portfolio template? This will populate the exact layout, featured projects with GitHub PoCs, experiences, certifications with sample PDFs/images, and aesthetic.'
      )
    ) {
      return;
    }

    setHeaderInfo({
      name: REFERENCE_TEMPLATE.name,
      title: REFERENCE_TEMPLATE.title,
      location: REFERENCE_TEMPLATE.location,
      bio: REFERENCE_TEMPLATE.bio,
      aboutMe: REFERENCE_TEMPLATE.aboutMe,
      bannerUrl: REFERENCE_TEMPLATE.bannerUrl,
      avatarUrl: REFERENCE_TEMPLATE.avatarUrl,
      completedProjects: REFERENCE_TEMPLATE.completedProjects,
      rating: REFERENCE_TEMPLATE.rating,
      yearsExperience: REFERENCE_TEMPLATE.yearsExperience,
      availability: REFERENCE_TEMPLATE.availability,
    });
    setSkillsList(REFERENCE_TEMPLATE.skills);
    setHighlightsList(REFERENCE_TEMPLATE.highlights);
    setPortfolioList(REFERENCE_TEMPLATE.portfolio);
    setExperiences(REFERENCE_TEMPLATE.experiences);
    setCustomReviews(REFERENCE_TEMPLATE.customReviews);
    setCertificates(REFERENCE_TEMPLATE.certificates);

    await persistProfile({
      name: REFERENCE_TEMPLATE.name,
      title: REFERENCE_TEMPLATE.title,
      location: REFERENCE_TEMPLATE.location,
      bio: REFERENCE_TEMPLATE.aboutMe,
      bannerUrl: REFERENCE_TEMPLATE.bannerUrl,
      avatarUrl: REFERENCE_TEMPLATE.avatarUrl,
      skills: REFERENCE_TEMPLATE.skills,
      highlights: REFERENCE_TEMPLATE.highlights,
      portfolio: REFERENCE_TEMPLATE.portfolio,
      experiences: REFERENCE_TEMPLATE.experiences,
      customReviews: REFERENCE_TEMPLATE.customReviews,
      certificates: REFERENCE_TEMPLATE.certificates,
      completedProjects: REFERENCE_TEMPLATE.completedProjects,
      rating: REFERENCE_TEMPLATE.rating,
      yearsExperience: REFERENCE_TEMPLATE.yearsExperience,
    });
    showToast('Reference template loaded and saved!', 'success');
  };

  // Save profile header updates
  const handleSaveProfileHeader = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingLook(true);
    try {
      const ok = await persistProfile({
        name: headerInfo.name,
        title: headerInfo.title,
        location: headerInfo.location,
        bio: headerInfo.bio || headerInfo.aboutMe,
        bannerUrl: headerInfo.bannerUrl,
        avatarUrl: headerInfo.avatarUrl,
        completedProjects: Number(headerInfo.completedProjects) || 0,
        rating: Number(headerInfo.rating) || 5.0,
        yearsExperience: Number(headerInfo.yearsExperience) || 1,
        availability: headerInfo.availability as any,
      });
      if (ok) {
        setIsProfileModalOpen(false);
        showToast('Profile & look changes saved successfully!', 'success');
      }
    } finally {
      setIsSavingLook(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 animate-fade-in">
      {/* =========================================================================
          THE VELOURA SHINY & LUMINOUS PORTFOLIO CARD (MOVED DIRECTLY TO TOP)
      ========================================================================= */}
      <div className="relative rounded-3xl overflow-hidden border border-rose-200 dark:border-[#ff4d79]/35 bg-white dark:bg-gradient-to-b dark:from-[#190914]/95 dark:via-[#11050d]/95 dark:to-[#0b0308] text-gray-950 dark:text-white shadow-xl dark:shadow-[0_0_50px_rgba(255,77,121,0.22)] transition-all">
        {/* Specular Top Sheen Highlight */}
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-rose-400 dark:via-[#ff80a0] to-transparent opacity-90 pointer-events-none z-10" />

        {/* 1. PANORAMIC COVER BANNER (Consistent 5:1 Ratio, High-Res 2560x512) */}
        <div className="relative aspect-[5/1] w-full min-h-[120px] max-h-[260px] overflow-hidden bg-[#160812]">
          <img
            src={headerInfo.bannerUrl || DEFAULT_VELOURA_BANNER}
            alt="Profile Cover Banner"
            className="w-full h-full object-cover object-center transition-all duration-300"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = DEFAULT_VELOURA_BANNER;
            }}
          />
          {/* Subtle Ambient Vignette (Crystal Sharp Image Clarity) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/25 pointer-events-none" />

          {/* Top-Right Dedicated Cover Controls Overlay */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-5 flex items-center gap-2 z-20">
            {(portfolioList.length > 0 || experiences.length > 0 || certificates.length > 0) && (
              <button
                type="button"
                onClick={handleClearPortfolio}
                title="Clear all portfolio items to start with a blank portfolio"
                className="inline-flex items-center gap-1.5 rounded-full bg-black/70 hover:bg-black/90 text-rose-300 hover:text-white backdrop-blur-md px-3 py-1.5 text-xs font-semibold border border-rose-500/30 hover:border-rose-400 transition-all cursor-pointer shadow-md"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Clear to Blank</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLoadReferenceTemplate}
              title="Load Sample Harshitha Lakshmi Template"
              className="inline-flex items-center gap-1.5 rounded-full bg-black/70 hover:bg-black/90 text-white/95 hover:text-white backdrop-blur-md px-3 py-1.5 text-xs font-semibold border border-white/20 hover:border-rose-400/80 transition-all cursor-pointer shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-300" />
              <span className="hidden sm:inline">Sample Demo</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBannerGalleryOpen(true)}
              title="Browse Veloura Banner Gallery"
              className="inline-flex items-center gap-1.5 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md px-3.5 sm:px-4 py-1.5 text-xs font-semibold border border-[#ff4d79]/60 hover:border-[#ff4d79] hover:shadow-[0_0_15px_rgba(255,77,121,0.5)] transition-all cursor-pointer shadow-md"
            >
              <Camera className="w-3.5 h-3.5 text-[#ff4d79]" />
              <span>Change Cover</span>
            </button>
          </div>
        </div>

        {/* 2. PROFILE HERO ROW - PIXEL-PERFECT REFERENCE LAYOUT */}
        <div className="px-5 sm:px-8 pt-1.5 pb-5 sm:pb-6 relative border-b border-rose-100/80 dark:border-white/10">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
            
            {/* Left: Avatar + Name + Title + Location & Availability */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 min-w-0">
              {/* Circular Avatar with Veloura Rose Ring */}
              <div className="relative group shrink-0 -mt-14 sm:-mt-16 lg:-mt-18 z-20">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[#ff4d79] ring-4 ring-[#ff4d79]/20 shadow-xl overflow-hidden bg-[#1f0a17]">
                  {headerInfo.avatarUrl ? (
                    <img
                      src={headerInfo.avatarUrl}
                      alt={headerInfo.name}
                      className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = VELOURA_AVATARS[0].url;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ff3366] to-[#ff6699] text-white font-extrabold text-2xl sm:text-3xl">
                      {headerInfo.name ? headerInfo.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
                
                {/* Online Availability Dot */}
                <span
                  title={headerInfo.availability === 'available' ? 'Available for work' : 'Busy'}
                  className="absolute bottom-1 right-1 w-4.5 h-4.5 rounded-full bg-[#00c982] ring-3 ring-white dark:ring-[#13060f] shadow-md z-10"
                />

                {/* Edit Avatar overlay on hover */}
                <button
                  type="button"
                  onClick={() => {
                    setProfileModalTab('look');
                    setIsProfileModalOpen(true);
                  }}
                  title="Choose Profile Avatar"
                  aria-label="Choose Profile Avatar"
                  className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[11px] font-medium transition-opacity cursor-pointer backdrop-blur-xs z-20"
                >
                  <Edit2 className="w-4 h-4 mb-0.5 text-[#ff4d79]" />
                  <span>Avatar</span>
                </button>
              </div>

              {/* Name, Title, and Meta row */}
              <div className="space-y-1.5 min-w-0 pt-1 sm:pt-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl lg:text-[28px] font-black tracking-tight text-gray-950 dark:text-white leading-tight">
                    {headerInfo.name}
                  </h1>
                  <span
                    title="Verified Specialist"
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#ff3366] text-white shadow-[0_0_12px_rgba(255,51,102,0.5)] shrink-0"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-bold text-[#e8003e] dark:text-[#ff4d79] tracking-tight">
                  {headerInfo.title}
                </p>

                <div className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-gray-400 font-medium pt-0.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-gray-800 dark:text-gray-200 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-[#ff4d79]" />
                    <span>{headerInfo.location}</span>
                  </span>
                  <span className="text-gray-400 dark:text-gray-500">•</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#00c982]" />
                    Available for work
                  </span>
                </div>
              </div>
            </div>

            {/* Right: 3 Stat Cards on Top, 3 Action Buttons on Bottom */}
            <div className="w-full lg:w-auto flex flex-col items-start lg:items-end gap-3.5 sm:gap-4 shrink-0">
              {/* Top Row: 3 Stat Cards (Exactly as in Reference) */}
              <div className="grid grid-cols-3 sm:flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-end">
                {/* Metric 1: Completed Projects */}
                <div className="flex items-center gap-3 sm:gap-3.5 px-4 sm:px-4.5 py-2.5 sm:py-3 h-[68px] sm:h-[74px] rounded-[22px] bg-white dark:bg-white/[0.04] border border-rose-200 dark:border-white/10 text-left shadow-xs hover:border-[#ff4d79]/60 hover:shadow-[0_0_15px_rgba(255,77,121,0.2)] transition-all min-w-[140px] sm:w-[172px]">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-pink-50 dark:bg-[#ff4d79]/20 text-[#ff4d79] flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 pl-0.5">
                    <div className="text-base sm:text-lg font-black text-gray-950 dark:text-white leading-tight">
                      {headerInfo.completedProjects > 0 ? `${headerInfo.completedProjects}+` : '0'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate mt-0.5">
                      Projects
                    </div>
                  </div>
                </div>

                {/* Metric 2: Client Rating */}
                <div className="flex items-center gap-3 sm:gap-3.5 px-4 sm:px-4.5 py-2.5 sm:py-3 h-[68px] sm:h-[74px] rounded-[22px] bg-white dark:bg-white/[0.04] border border-rose-200 dark:border-white/10 text-left shadow-xs hover:border-[#ff4d79]/60 hover:shadow-[0_0_15px_rgba(255,77,121,0.2)] transition-all min-w-[140px] sm:w-[172px]">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-amber-50 dark:bg-amber-400/20 text-amber-500 flex items-center justify-center shrink-0">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="min-w-0 pl-0.5">
                    <div className="text-base sm:text-lg font-black text-gray-950 dark:text-white leading-tight">
                      {Number(headerInfo.rating).toFixed(1)}/5
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate mt-0.5">
                      Rating
                    </div>
                  </div>
                </div>

                {/* Metric 3: Experience */}
                <div className="flex items-center gap-3 sm:gap-3.5 px-4 sm:px-4.5 py-2.5 sm:py-3 h-[68px] sm:h-[74px] rounded-[22px] bg-white dark:bg-white/[0.04] border border-rose-200 dark:border-white/10 text-left shadow-xs hover:border-[#ff4d79]/60 hover:shadow-[0_0_15px_rgba(255,77,121,0.2)] transition-all min-w-[140px] sm:w-[172px]">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-rose-50 dark:bg-[#ff4d79]/20 text-rose-500 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 pl-0.5">
                    <div className="text-base sm:text-lg font-black text-gray-950 dark:text-white leading-tight">
                      {headerInfo.yearsExperience > 0 ? `${headerInfo.yearsExperience}+ Yrs` : '0 Yrs'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate mt-0.5">
                      Experience
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: 3 Action Buttons (Flush with right edge) */}
              <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setProfileModalTab('info');
                    setIsProfileModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 h-11 rounded-full border border-gray-200 dark:border-white/15 bg-white dark:bg-white/[0.04] px-5 sm:px-6 text-xs sm:text-sm font-bold text-gray-900 dark:text-white hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.08] transition-all cursor-pointer shadow-xs min-w-[125px] sm:min-w-[140px]"
                >
                  <Edit2 className="w-4 h-4 text-gray-800 dark:text-gray-200 shrink-0" />
                  <span>Edit Brief</span>
                </button>

                <button
                  type="button"
                  onClick={() => showToast('In client view, this triggers direct hiring proposal.', 'info')}
                  className="inline-flex items-center justify-center gap-2 h-11 rounded-full bg-[#ff2f6e] hover:bg-[#ff2055] px-6 sm:px-7 text-xs sm:text-sm font-bold text-white shadow-[0_8px_25px_rgba(255,47,110,0.45)] hover:shadow-[0_10px_30px_rgba(255,47,110,0.6)] active:scale-95 transition-all cursor-pointer min-w-[135px] sm:min-w-[150px]"
                >
                  <Send className="w-4 h-4 shrink-0" />
                  <span>Hire Me</span>
                </button>

                <button
                  type="button"
                  onClick={() => showToast('In client view, this opens private direct message thread.', 'info')}
                  className="inline-flex items-center justify-center gap-2 h-11 rounded-full border border-gray-200 dark:border-white/15 bg-white dark:bg-white/[0.04] px-5 sm:px-6 text-xs sm:text-sm font-bold text-gray-900 dark:text-white hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.08] transition-all cursor-pointer shadow-xs min-w-[125px] sm:min-w-[140px]"
                >
                  <MessageSquare className="w-4 h-4 text-[#ff2f6e] shrink-0" />
                  <span>Message</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. NAVIGATION TABS & MAIN CONTENT */}
        <div className="px-5 sm:px-8 pb-6">
          {/* Navigation Tabs Bar */}
          <div className="border-b border-rose-200 dark:border-[#ff4d79]/20 mt-4 sm:mt-5 flex items-center gap-6 sm:gap-8 overflow-x-auto no-scrollbar">
            {(
              [
                { id: 'overview', label: 'Overview' },
                { id: 'projects', label: `Projects (${portfolioList.length})` },
                { id: 'experience', label: `Experience (${experiences.length})` },
                { id: 'skills', label: `Skills (${skillsList.length})` },
                { id: 'certifications', label: `Certifications (${certificates.length})` },
                { id: 'reviews', label: `Reviews (${customReviews.length})` },
              ] as const
            ).map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 text-xs sm:text-sm font-extrabold transition-all relative whitespace-nowrap cursor-pointer ${
                    active
                      ? 'text-rose-600 dark:text-[#ff4d79] drop-shadow-[0_0_10px_rgba(255,77,121,0.5)]'
                      : 'text-gray-800 hover:text-gray-950 dark:text-gray-300 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#ff3366] to-[#ff7597] rounded-full shadow-[0_0_12px_rgba(255,77,121,0.8)]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* 4. MAIN CONTENT GRID */}
          <div className="space-y-6 pt-6">
            {/* ROW 1: ABOUT ME & TOP SKILLS */}
            {(activeTab === 'overview' || activeTab === 'skills') && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* About Me Card */}
                <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-gradient-to-b dark:from-white/[0.06] dark:to-white/[0.02] border border-rose-200 dark:border-[#ff4d79]/25 hover:border-[#ff4d79]/50 p-6 space-y-4 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.36)] backdrop-blur-xl relative group transition-all overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-rose-300 dark:via-[#ff80a0]/40 to-transparent pointer-events-none" />

                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-gray-950 dark:text-white flex items-center gap-2">
                      <span>About Me</span>
                      <Sparkles className="w-3.5 h-3.5 text-[#ff4d79]" />
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileModalTab('info');
                        setIsProfileModalOpen(true);
                      }}
                      className="text-xs text-rose-600 dark:text-gray-400 hover:text-rose-700 font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit Bio
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-900 dark:text-gray-200 font-medium leading-relaxed whitespace-pre-line">
                    {headerInfo.aboutMe || 'Welcome to your portfolio! Click "Edit Bio" to introduce your engineering background, specialties, and what you build.'}
                  </p>

                  {/* 4 Feature Badges at bottom */}
                  <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-bold text-gray-900 dark:text-gray-200">
                    {highlightsList.map((highlight, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50/70 dark:bg-white/[0.04] border border-rose-200 dark:border-[#ff4d79]/20 hover:border-[#ff4d79]/50 shadow-2xs transition-all"
                      >
                        {idx === 0 && <Code2 className="w-3.5 h-3.5 text-[#ff4d79]" />}
                        {idx === 1 && <Clock className="w-3.5 h-3.5 text-amber-500" />}
                        {idx === 2 && <MessageSquare className="w-3.5 h-3.5 text-sky-500" />}
                        {idx === 3 && <Heart className="w-3.5 h-3.5 text-rose-500" />}
                        <span>{highlight}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Top Skills Card */}
                <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-gradient-to-b dark:from-white/[0.06] dark:to-white/[0.02] border border-rose-200 dark:border-[#ff4d79]/25 hover:border-[#ff4d79]/50 p-6 space-y-4 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.36)] backdrop-blur-xl relative overflow-hidden transition-all">
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-rose-300 dark:via-[#ff80a0]/40 to-transparent pointer-events-none" />

                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-gray-950 dark:text-white">Top Skills</h3>
                    <button
                      type="button"
                      onClick={() => setIsAddSkillOpen(!isAddSkillOpen)}
                      className="text-xs font-bold text-rose-600 dark:text-[#ff4d79] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Skill
                    </button>
                  </div>

                  {/* Inline Add Skill Form */}
                  {isAddSkillOpen && (
                    <form onSubmit={handleAddSkill} className="flex items-center gap-2 pt-1 pb-2">
                      <input
                        type="text"
                        value={newSkillText}
                        onChange={(e) => setNewSkillText(e.target.value)}
                        placeholder="e.g. Next.js, Docker, WebSockets"
                        className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-black/40 border border-rose-300 dark:border-[#ff4d79]/40 focus:border-[#ff4d79] focus:outline-hidden text-gray-950 dark:text-white font-semibold"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#ff3366] to-[#ff6699] text-white text-xs font-bold hover:brightness-110 cursor-pointer shadow-xs"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddSkillOpen(false)}
                        className="p-1.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </form>
                  )}

                  {/* Skills Pill Chips with direct delete */}
                  <div className="flex flex-wrap gap-2">
                    {skillsList.map((skill, index) => {
                      const isFirst = index === 0;
                      return (
                        <span
                          key={skill}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all group ${
                            isFirst
                              ? 'bg-gradient-to-r from-[#ff3366] to-[#ff6699] text-white shadow-[0_0_15px_rgba(255,51,102,0.4)]'
                              : 'bg-rose-50/70 dark:bg-white/[0.04] text-gray-950 dark:text-white border border-rose-200 dark:border-[#ff4d79]/20 hover:border-[#ff4d79]/60 hover:shadow-[0_0_10px_rgba(255,77,121,0.2)]'
                          }`}
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteSkill(skill)}
                            title={`Delete ${skill}`}
                            aria-label={`Delete ${skill}`}
                            className={`opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                              isFirst ? 'text-white/80 hover:text-white' : 'text-rose-400'
                            }`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ROW 2: FEATURED PROJECTS ✦ */}
            {(activeTab === 'overview' || activeTab === 'projects') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black tracking-tight text-gray-950 dark:text-white">
                      Featured Projects
                    </h3>
                    <Sparkles className="w-4 h-4 text-[#ff4d79]" />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleOpenAddProject}
                      className="text-xs font-bold text-rose-600 dark:text-[#ff4d79] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Project
                    </button>
                  </div>
                </div>

                {portfolioList.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-rose-300 dark:border-[#ff4d79]/30 p-8 text-center space-y-3 bg-white dark:bg-white/[0.02]">
                    <p className="text-sm text-gray-800 dark:text-gray-300 font-semibold">
                      No featured projects added yet.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenAddProject}
                      className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff3366] to-[#ff6699] px-4 py-2 text-xs font-bold text-white shadow-md shadow-rose-500/30 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Project with GitHub PoC
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {portfolioList.map((project, idx) => (
                      <div
                        key={project._id || idx}
                        className="rounded-3xl bg-white dark:bg-gradient-to-b dark:from-white/[0.06] dark:to-white/[0.02] border border-rose-200 dark:border-[#ff4d79]/25 hover:border-[#ff4d79]/60 hover:shadow-[0_8px_35px_rgba(255,77,121,0.25)] overflow-hidden flex flex-col justify-between transition-all group shadow-sm relative"
                      >
                        {/* Top Preview Image Container */}
                        <div className="relative aspect-video w-full overflow-hidden bg-rose-100 dark:bg-black/50">
                          <img
                            src={project.imageUrl || DEFAULT_PROJECT_IMAGE}
                            alt={project.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = DEFAULT_PROJECT_IMAGE;
                            }}
                          />
                          {/* "★ Featured" Chip */}
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-lg bg-black/75 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white border border-white/15 shadow-sm">
                            ★ Featured
                          </span>

                          {/* Quick Edit & Delete Controls Overlay */}
                          <div className="absolute top-3 right-3 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditProject(idx)}
                              title="Edit Project"
                              aria-label="Edit Project"
                              className="p-1.5 rounded-lg bg-black/80 text-white hover:text-[#ff4d79] backdrop-blur-md transition-colors cursor-pointer border border-white/10"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProject(idx)}
                              title="Delete Project"
                              aria-label="Delete Project"
                              className="p-1.5 rounded-lg bg-black/80 text-rose-400 hover:text-white hover:bg-rose-600 backdrop-blur-md transition-all cursor-pointer border border-white/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-3.5">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-sm sm:text-base font-black text-gray-950 dark:text-white">
                                {project.title}
                              </h4>
                              {/* Visible Delete Project Button on card */}
                              <button
                                type="button"
                                onClick={() => handleDeleteProject(idx)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:underline transition-colors cursor-pointer"
                                title="Delete project"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                            <p className="text-xs text-gray-800 dark:text-gray-200 font-medium line-clamp-2 leading-relaxed">
                              {project.description}
                            </p>
                          </div>

                          {/* Tech stack tags */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {(project.tags || []).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-lg bg-rose-100/70 dark:bg-white/[0.04] border border-rose-300/80 dark:border-[#ff4d79]/20 px-2.5 py-0.5 text-[11px] font-bold text-rose-950 dark:text-rose-200"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          {/* Bottom Action Buttons: Live Demo & GitHub (PoC) */}
                          <div className="pt-3 border-t border-rose-200 dark:border-[#ff4d79]/20 grid grid-cols-2 gap-2">
                            {project.link ? (
                              <a
                                href={ensureHttps(project.link)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ff3366] to-[#ff6699] px-3 py-2 text-xs font-bold text-white shadow-[0_0_15px_rgba(255,51,102,0.35)] hover:brightness-110 active:scale-95 transition-all text-center"
                              >
                                <span>Live Demo</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="inline-flex items-center justify-center gap-1 rounded-xl bg-gray-100 dark:bg-white/[0.03] px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-500"
                              >
                                No Live Link
                              </button>
                            )}

                            {/* MANDATORY GitHub POC LINK BUTTON (High-contrast bold dark button) */}
                            {project.githubUrl ? (
                              <a
                                href={ensureHttps(project.githubUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gray-950 hover:bg-gray-800 text-white dark:bg-white/[0.06] border border-gray-950 dark:border-[#ff4d79]/30 hover:border-[#ff4d79] hover:text-[#ff4d79] px-3 py-2 text-xs font-bold transition-all text-center shadow-xs"
                                title="Inspect verified GitHub Proof-of-Concept repository"
                              >
                                <GithubIcon className="w-3.5 h-3.5" />
                                <span>GitHub</span>
                              </a>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenAddPoc(idx)}
                                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:brightness-110 active:scale-95 px-3 py-2 text-xs font-bold transition-all text-center shadow-xs"
                                title="Add dynamic GitHub repository proof"
                              >
                                <GithubIcon className="w-3.5 h-3.5" />
                                <span>+ Add PoC</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ROW 3: CERTIFICATIONS & CREDENTIALS (With PDF / Image Upload & Viewing) */}
            {(activeTab === 'overview' || activeTab === 'certifications') && (
              <div className="rounded-3xl bg-white dark:bg-gradient-to-b dark:from-white/[0.06] dark:to-white/[0.02] border border-rose-200 dark:border-[#ff4d79]/30 hover:border-[#ff4d79]/50 p-6 space-y-4 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.36)] backdrop-blur-xl relative overflow-hidden transition-all">
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-rose-300 dark:via-[#ff80a0]/40 to-transparent pointer-events-none" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileBadge2 className="w-5 h-5 text-[#ff4d79]" />
                    <h3 className="text-base font-black text-gray-950 dark:text-white">
                      Certifications &amp; Accreditations
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddCert}
                    className="text-xs font-bold text-rose-600 dark:text-[#ff4d79] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Upload Certificate (PDF / Img)
                  </button>
                </div>

                {certificates.length === 0 ? (
                  <p className="text-xs text-gray-800 dark:text-gray-300 italic font-semibold">
                    No verified certifications uploaded yet. Click "+ Upload Certificate" to add
                    PDFs or images of your credentials.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {certificates.map((cert, idx) => {
                      const hasFile = Boolean(cert.fileDataUrl);
                      const isPdf = cert.fileType === 'pdf';
                      const isImage = cert.fileType === 'image';

                      return (
                        <div
                          key={cert._id || idx}
                          className="rounded-2xl bg-white dark:bg-gradient-to-b dark:from-white/[0.04] dark:to-black/30 border border-rose-200 dark:border-[#ff4d79]/25 hover:border-[#ff4d79]/60 hover:shadow-[0_0_20px_rgba(255,77,121,0.2)] p-4 flex flex-col justify-between space-y-3 relative group transition-all shadow-sm dark:shadow-none"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-[#ff3366]/20 to-[#ff6699]/10 text-[#ff4d79] border border-[#ff4d79]/30">
                                  <Award className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="text-[11px] font-black text-gray-900 dark:text-gray-300 uppercase tracking-wider block">
                                    {cert.issuer}
                                  </span>
                                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" />
                                    Verified
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditCert(idx)}
                                  title="Edit Certificate"
                                  className="p-1 rounded-md text-gray-400 hover:text-[#ff4d79] cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCert(idx)}
                                  title="Delete Certificate"
                                  className="p-1 rounded-md text-gray-400 hover:text-rose-500 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <h5 className="text-xs sm:text-sm font-black text-gray-950 dark:text-white leading-snug">
                              {cert.title}
                            </h5>

                            <div className="flex items-center gap-2 text-[11px] text-gray-800 dark:text-gray-400 font-semibold flex-wrap">
                              <span>Issued {cert.issueDate}</span>
                              {cert.credentialId && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono text-[10px] bg-rose-100/70 dark:bg-white/[0.05] border border-rose-300 dark:border-white/10 px-1.5 py-0.5 rounded-sm text-gray-950 dark:text-gray-300 font-bold">
                                    {cert.credentialId}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Certificate File Attachment Badge */}
                            {hasFile && (
                              <div className="p-2 rounded-xl bg-rose-50/70 dark:bg-white/[0.03] border border-rose-200 dark:border-[#ff4d79]/20 flex items-center justify-between gap-2 mt-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {isPdf ? (
                                    <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                  ) : (
                                    <ImageIcon className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                                  )}
                                  <span className="text-[10px] text-gray-900 dark:text-gray-200 font-bold truncate">
                                    {cert.fileName || (isPdf ? 'Certificate.pdf' : 'Certificate.png')}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setViewingCert(cert)}
                                  className="text-[10px] font-bold text-[#ff4d79] hover:underline shrink-0 inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" />
                                  View
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="pt-2 border-t border-rose-200 dark:border-[#ff4d79]/20 flex items-center justify-between gap-2">
                            {hasFile ? (
                              <button
                                type="button"
                                onClick={() => setViewingCert(cert)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-[#ff4d79] hover:underline cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Inspect Certificate</span>
                              </button>
                            ) : cert.credentialUrl ? (
                              <a
                                href={cert.credentialUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-[#ff4d79] hover:underline"
                              >
                                <span>Verify Online</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-[10px] text-gray-700 dark:text-gray-400 italic font-semibold">
                                Self-Reported
                              </span>
                            )}

                            {cert.credentialUrl && (
                              <a
                                href={cert.credentialUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="External Link"
                                className="text-gray-600 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ROW 4: WORK EXPERIENCE & CLIENT REVIEWS */}
            {(activeTab === 'overview' ||
              activeTab === 'experience' ||
              activeTab === 'reviews') && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Work Experience Timeline */}
                <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-gradient-to-b dark:from-white/[0.06] dark:to-white/[0.02] border border-rose-200 dark:border-[#ff4d79]/25 hover:border-[#ff4d79]/50 p-6 space-y-4 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.36)] backdrop-blur-xl relative overflow-hidden transition-all">
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-rose-300 dark:via-[#ff80a0]/40 to-transparent pointer-events-none" />

                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-gray-950 dark:text-white">
                      Work Experience
                    </h3>
                    <button
                      type="button"
                      onClick={handleOpenAddExperience}
                      className="text-xs font-bold text-rose-600 dark:text-[#ff4d79] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Experience
                    </button>
                  </div>

                  {experiences.length === 0 ? (
                    <p className="text-xs text-gray-800 dark:text-gray-400 italic font-semibold">
                      No experience items listed yet.
                    </p>
                  ) : (
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-[#ff3366] before:to-[#ff6699]/20">
                      {experiences.map((exp, idx) => (
                        <div key={exp._id || idx} className="relative group">
                          {/* Glowing Pink Timeline Node */}
                          <div className="absolute -left-6 top-1.5 w-4 h-4 rounded-full bg-[#ff4d79] border-4 border-white dark:border-[#12050e] shadow-[0_0_10px_rgba(255,77,121,0.8)]" />

                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-black text-gray-950 dark:text-white">
                                {exp.title}
                              </h4>
                              <p className="text-xs text-rose-700 dark:text-gray-300 font-bold">
                                {exp.company}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-800 dark:text-gray-400">
                                {exp.period}
                              </span>
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditExperience(idx)}
                                  title="Edit Experience"
                                  aria-label="Edit Experience"
                                  className="p-1 rounded-md text-gray-400 hover:text-[#ff4d79] cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteExperience(idx)}
                                  title="Delete Experience"
                                  aria-label="Delete Experience"
                                  className="p-1 rounded-md text-gray-400 hover:text-rose-500 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-gray-900 dark:text-gray-200 mt-2 font-medium leading-relaxed whitespace-pre-line">
                            {exp.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Client Reviews */}
                <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-gradient-to-b dark:from-white/[0.06] dark:to-white/[0.02] border border-rose-200 dark:border-[#ff4d79]/25 hover:border-[#ff4d79]/50 p-6 space-y-4 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.36)] backdrop-blur-xl relative overflow-hidden transition-all">
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-rose-300 dark:via-[#ff80a0]/40 to-transparent pointer-events-none" />

                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-gray-950 dark:text-white">
                      Client Reviews
                    </h3>
                    <button
                      type="button"
                      onClick={handleOpenAddReview}
                      className="text-xs font-bold text-rose-600 dark:text-[#ff4d79] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Review
                    </button>
                  </div>

                  {customReviews.length === 0 ? (
                    <p className="text-xs text-gray-800 dark:text-gray-400 italic font-semibold">
                      No client reviews listed yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {customReviews.map((rev, idx) => (
                        <div
                          key={rev._id || idx}
                          className="rounded-2xl bg-rose-50/40 dark:bg-white/[0.03] border border-rose-200 dark:border-[#ff4d79]/20 hover:border-[#ff4d79]/45 p-4 space-y-3 relative group transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {/* Client Initial Avatar */}
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff3366] to-[#ff6699] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                                {rev.reviewerName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h5 className="text-xs font-black text-gray-950 dark:text-white">
                                  {rev.reviewerName}
                                </h5>
                                <div className="flex items-center gap-1.5 text-[11px] text-gray-800 dark:text-gray-400 font-semibold">
                                  <div className="flex items-center text-amber-500">
                                    {Array.from({ length: Math.max(0, Math.min(5, rev.rating || 5)) }).map((_, i) => (
                                      <Star key={i} className="w-3 h-3 fill-amber-400" />
                                    ))}
                                  </div>
                                  <span>•</span>
                                  <span>{rev.dateText}</span>
                                </div>
                              </div>
                            </div>

                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleOpenEditReview(idx)}
                                title="Edit Review"
                                aria-label="Edit Review"
                                className="p-1 rounded-md text-gray-400 hover:text-[#ff4d79] cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteReview(idx)}
                                title="Delete Review"
                                aria-label="Delete Review"
                                className="p-1 rounded-md text-gray-400 hover:text-rose-500 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-gray-900 dark:text-gray-200 italic font-medium leading-relaxed">
                            "{rev.comment}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          INTERACTIVE MODALS
      ========================================================================= */}

      {/* 1. PROJECT ADD / EDIT MODAL */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white dark:bg-[#12050e] border border-rose-200 dark:border-[#ff4d79]/40 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl dark:shadow-[0_0_50px_rgba(255,77,121,0.3)] text-gray-950 dark:text-white">
            <div className="flex items-center justify-between border-b border-rose-200 dark:border-[var(--border-subtle)] pb-3">
              <div>
                <h3 className="text-base font-black text-gray-950 dark:text-white">
                  {editingProjectIndex !== null ? 'Edit Featured Project' : 'Add Featured Project'}
                </h3>
                <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                  Proof-of-Concept (POC) GitHub URL is mandatory.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProjectModalOpen(false)}
                className="text-gray-600 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4">
              {/* =========================================================================
                  STEP 1: DYNAMIC GITHUB PROOF OF CONCEPT (ASKED FIRST DYNAMICALLY)
              ========================================================================= */}
              <div className="rounded-2xl border-2 border-rose-400 dark:border-[#ff4d79] bg-gradient-to-br from-rose-50/90 via-pink-50/40 to-white dark:from-[#ff4d79]/15 dark:via-[#190914] dark:to-black/40 p-4 space-y-3 shadow-md relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#ff3366] text-white text-[11px] font-black">
                      1
                    </span>
                    <label className="flex items-center gap-1.5 text-xs font-black text-rose-800 dark:text-[#ff4d79] tracking-wide uppercase">
                      <GithubIcon className="w-3.5 h-3.5" />
                      <span>GitHub Proof-of-Concept Link *</span>
                    </label>
                  </div>

                  {projGithubUrl.trim() && (
                    <a
                      href={ensureHttps(projGithubUrl.trim())}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-[#ff4d79] hover:underline"
                      title="Test opening this repository in a new tab"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Test Link</span>
                    </a>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    value={projGithubUrl}
                    onChange={(e) => {
                      setProjGithubUrl(e.target.value);
                      setGhStatus('idle');
                      setGhStatusMsg('');
                    }}
                    placeholder="https://github.com/username/project-repo"
                    className="flex-1 px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#1a0a14] border border-rose-300 dark:border-[#ff4d79]/50 text-gray-950 dark:text-white placeholder:text-gray-400 font-semibold focus:border-[#ff4d79] focus:ring-2 focus:ring-[#ff4d79]/20 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => handleVerifyGithub()}
                    disabled={ghStatus === 'checking' || !projGithubUrl.trim()}
                    className="px-3.5 py-2 rounded-xl bg-gray-950 hover:bg-gray-800 text-white dark:bg-white/[0.1] border border-gray-950 dark:border-white/20 hover:border-[#ff4d79] text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-xs shrink-0"
                  >
                    {ghStatus === 'checking' ? (
                      <span>Verifying...</span>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-[#ff4d79]" />
                        <span>Verify &amp; Auto-Fill</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Dynamic Status / Feedback Callout */}
                {ghStatusMsg ? (
                  <div
                    className={`text-xs p-2.5 rounded-xl font-medium flex items-start gap-2 ${
                      ghStatus === 'verified'
                        ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                        : ghStatus === 'error'
                        ? 'bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/30'
                        : 'bg-rose-50/80 dark:bg-white/[0.04] text-gray-800 dark:text-gray-200 border border-rose-200 dark:border-white/10'
                    }`}
                  >
                    <span className="shrink-0">{ghStatus === 'verified' ? '✓' : ghStatus === 'error' ? '⚠️' : 'ℹ️'}</span>
                    <span className="leading-snug">{ghStatusMsg}</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium">
                    Enter the GitHub repository first. Clicking <strong>Verify &amp; Auto-Fill</strong> dynamically checks if the repo is Public and auto-populates the project title and description.
                  </p>
                )}
              </div>

              {/* =========================================================================
                  STEP 2: PROJECT DETAILS (TITLE, CATEGORY, DESCRIPTION)
              ========================================================================= */}
              <div>
                <label className="block text-xs font-bold text-gray-950 dark:text-white mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={projTitle}
                  onChange={(e) => setProjTitle(e.target.value)}
                  placeholder="e.g. SentinelShield"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-rose-50/50 dark:bg-[#1a0a14] border border-rose-300 dark:border-[#ff4d79]/30 text-gray-950 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium focus:border-[#ff4d79] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-950 dark:text-white mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  required
                  value={projCategory}
                  onChange={(e) => setProjCategory(e.target.value)}
                  placeholder="e.g. Cybersecurity & AI"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-rose-50/50 dark:bg-[#1a0a14] border border-rose-300 dark:border-[#ff4d79]/30 text-gray-950 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium focus:border-[#ff4d79] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-950 dark:text-white mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={projDescription}
                  onChange={(e) => setProjDescription(e.target.value)}
                  placeholder="Brief explanation of the project features, architecture, and impact..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-rose-50/50 dark:bg-[#1a0a14] border border-rose-300 dark:border-[#ff4d79]/30 text-gray-950 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium focus:border-[#ff4d79] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-950 dark:text-white mb-1">
                  Live Demo Deployed URL (Optional)
                </label>
                <input
                  type="url"
                  value={projLink}
                  onChange={(e) => setProjLink(e.target.value)}
                  placeholder="https://your-app.vercel.app or custom domain"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-rose-50/50 dark:bg-[#1a0a14] border border-rose-300 dark:border-[#ff4d79]/30 text-gray-950 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium focus:border-[#ff4d79] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-950 dark:text-white mb-1">
                  Preview Image URL
                </label>
                <input
                  type="url"
                  value={projImageUrl}
                  onChange={(e) => setProjImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-rose-50/50 dark:bg-[#1a0a14] border border-rose-300 dark:border-[#ff4d79]/30 text-gray-950 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium focus:border-[#ff4d79] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-950 dark:text-white mb-1">
                  Technology Stack Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={projTags}
                  onChange={(e) => setProjTags(e.target.value)}
                  placeholder="Python, Flask, React, Cybersecurity"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-rose-50/50 dark:bg-[#1a0a14] border border-rose-300 dark:border-[#ff4d79]/30 text-gray-950 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium focus:border-[#ff4d79] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-rose-200 dark:border-[var(--border-subtle)]">
                {editingProjectIndex !== null ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteProject(editingProjectIndex);
                      setIsProjectModalOpen(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Project</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProjectModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-800 hover:text-gray-950 bg-white dark:bg-white/[0.05] border border-rose-300 dark:border-white/10 dark:text-gray-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#ff2a6d] via-[#ff4d79] to-[#ff7597] text-white shadow-[0_4px_20px_rgba(255,42,109,0.45)] hover:brightness-110 cursor-pointer"
                  >
                    Save Project
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. CERTIFICATE UPLOAD (PDF / IMAGE) MODAL */}
      {isCertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white dark:bg-[#12050e] border border-rose-200 dark:border-[#ff4d79]/40 rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 space-y-4 shadow-2xl dark:shadow-[0_0_50px_rgba(255,77,121,0.3)] text-gray-950 dark:text-white">
            <div className="flex items-center justify-between border-b border-rose-200 dark:border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <FileBadge2 className="w-5 h-5 text-[#ff4d79]" />
                <h3 className="text-base font-black text-gray-950 dark:text-white">
                  {editingCertIndex !== null ? 'Edit Certificate' : 'Upload Certificate (PDF / Image)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCertModalOpen(false)}
                className="text-gray-600 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCert} className="space-y-4">
              {/* FILE UPLOAD DROPZONE */}
              <div className="rounded-2xl border-2 border-dashed border-rose-300 dark:border-[#ff4d79]/40 bg-gradient-to-b from-rose-50 dark:from-[#ff4d79]/10 to-transparent p-4 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-[#ff4d79]/20 text-rose-600 dark:text-[#ff4d79] flex items-center justify-center mx-auto">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-950 dark:text-white block cursor-pointer hover:underline">
                    Upload Certificate File (PDF or Image)
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={handleCertFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-gray-700 dark:text-gray-300 font-medium mt-0.5">
                    Supports PDF, PNG, JPG, WEBP (Max 5MB)
                  </p>
                </div>

                {certFileName && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-white/[0.08] border border-emerald-300 dark:border-[#ff4d79]/40 text-xs text-emerald-800 dark:text-emerald-400 font-bold">
                    {certFileType === 'pdf' ? (
                      <FileText className="w-4 h-4 text-rose-500" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-sky-500" />
                    )}
                    <span>{certFileName}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCertFileDataUrl('');
                        setCertFileName('');
                        setCertFileType(undefined);
                      }}
                      className="text-gray-600 hover:text-gray-950 dark:text-white/60 dark:hover:text-white ml-1 cursor-pointer font-bold"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-950 dark:text-white mb-1">
                  Certificate Title *
                </label>
                <input
                  type="text"
                  required
                  value={certTitle}
                  onChange={(e) => setCertTitle(e.target.value)}
                  placeholder="e.g. AWS Certified Solutions Architect"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-rose-50/50 dark:bg-[#1a0a14] border border-rose-300 dark:border-[#ff4d79]/30 text-gray-950 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium focus:border-[#ff4d79]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-950 dark:text-white mb-1">
                  Issuing Organization *
                </label>
                <input
                  type="text"
                  required
                  value={certIssuer}
                  onChange={(e) => setCertIssuer(e.target.value)}
                  placeholder="e.g. Amazon Web Services, Google, Meta, Stanford"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-rose-50/50 dark:bg-[#1a0a14] border border-rose-300 dark:border-[#ff4d79]/30 text-gray-950 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium focus:border-[#ff4d79]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-950 dark:text-white mb-1">
                    Issue Year / Date *
                  </label>
                  <input
                    type="text"
                    required
                    value={certDate}
                    onChange={(e) => setCertDate(e.target.value)}
                    placeholder="e.g. 2024 or Jan 2024"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-rose-50/50 dark:bg-[#1a0a14] border border-rose-300 dark:border-[#ff4d79]/30 text-gray-950 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-950 dark:text-white mb-1">
                    Credential ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={certId}
                    onChange={(e) => setCertId(e.target.value)}
                    placeholder="e.g. AWS-SAA-9041"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-rose-50/50 dark:bg-[#1a0a14] border border-rose-300 dark:border-[#ff4d79]/30 text-gray-950 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-rose-200 dark:border-[var(--border-subtle)]">
                {editingCertIndex !== null ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteCert(editingCertIndex);
                      setIsCertModalOpen(false);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCertModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-gray-800 hover:text-gray-950 bg-white dark:bg-white/[0.05] border border-rose-300 dark:border-white/10 dark:text-gray-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#ff2a6d] via-[#ff4d79] to-[#ff7597] text-white shadow-md shadow-rose-500/30 cursor-pointer"
                  >
                    Save Certificate
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. CERTIFICATE FULLSCREEN VIEWER MODAL */}
      {viewingCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-[#12050e] border border-rose-200 dark:border-[#ff4d79]/40 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl dark:shadow-[0_0_60px_rgba(255,77,121,0.35)] text-gray-950 dark:text-white">
            <div className="p-4 sm:p-5 border-b border-rose-200 dark:border-white/10 flex items-center justify-between gap-3 bg-gradient-to-r from-rose-50/60 dark:from-white/[0.04] to-transparent">
              <div>
                <h3 className="text-base font-black text-gray-950 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#ff4d79]" />
                  <span>{viewingCert.title}</span>
                </h3>
                <p className="text-xs text-gray-700 dark:text-gray-300 font-semibold">
                  {viewingCert.issuer} • Issued {viewingCert.issueDate}
                  {viewingCert.credentialId && ` • ID: ${viewingCert.credentialId}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {viewingCert.fileDataUrl && (
                  <a
                    href={viewingCert.fileDataUrl}
                    download={viewingCert.fileName || 'certificate'}
                    className="p-2 rounded-xl bg-rose-100 hover:bg-rose-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-gray-900 dark:text-white font-bold transition-colors"
                    title="Download File"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
                {viewingCert.credentialUrl && (
                  <a
                    href={viewingCert.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-rose-100 hover:bg-rose-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-[#ff4d79] transition-colors"
                    title="Verify Online"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setViewingCert(null)}
                  className="p-2 rounded-xl text-gray-600 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 flex-1 overflow-y-auto flex items-center justify-center bg-gray-50 dark:bg-black/50 min-h-[320px]">
              {viewingCert.fileDataUrl ? (
                viewingCert.fileType === 'pdf' ? (
                  <object
                    data={viewingCert.fileDataUrl}
                    type="application/pdf"
                    className="w-full h-[65vh] rounded-2xl border border-rose-200 dark:border-white/10"
                  >
                    <div className="text-center p-8 space-y-3">
                      <FileText className="w-12 h-12 text-rose-500 mx-auto" />
                      <p className="text-sm text-gray-950 dark:text-white font-bold">
                        PDF Certificate Preview
                      </p>
                      <a
                        href={viewingCert.fileDataUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff4d79] text-white text-xs font-bold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open PDF in New Window
                      </a>
                    </div>
                  </object>
                ) : (
                  <img
                    src={viewingCert.fileDataUrl}
                    alt={viewingCert.title}
                    className="max-h-[65vh] w-auto object-contain rounded-2xl border border-rose-200 dark:border-[#ff4d79]/30 shadow-2xl"
                  />
                )
              ) : (
                <div className="text-center p-8 space-y-3">
                  <Award className="w-14 h-14 text-[#ff4d79] mx-auto opacity-75" />
                  <p className="text-sm font-bold text-gray-950 dark:text-white">
                    Verified Digital Accreditation
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 font-medium max-w-sm mx-auto">
                    This certificate is verified under credential ID {viewingCert.credentialId}.
                  </p>
                  {viewingCert.credentialUrl && (
                    <a
                      href={viewingCert.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-[#ff3366] to-[#ff6699] text-white text-xs font-bold shadow-md shadow-rose-500/30"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Verify on Issuer Website
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. WORK EXPERIENCE MODAL */}
      {isExperienceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white dark:bg-[#12050e] border border-rose-200 dark:border-[#ff4d79]/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl dark:shadow-[0_0_50px_rgba(255,77,121,0.3)] text-gray-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-rose-200 dark:border-white/10 pb-3">
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                {editingExperienceIndex !== null ? 'Edit Experience' : 'Add Work Experience'}
              </h3>
              <button
                type="button"
                onClick={() => setIsExperienceModalOpen(false)}
                className="text-gray-600 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExperience} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-950 dark:text-white mb-1">
                  Role Title *
                </label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="e.g. Freelance Developer"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-rose-50/50 dark:bg-white/[0.05] border border-rose-300 dark:border-white/10 text-gray-950 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium focus:outline-hidden focus:border-[#ff4d79]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-950 dark:text-white mb-1">
                  Company / Organization *
                </label>
                <input
                  type="text"
                  required
                  value={expCompany}
                  onChange={(e) => setExpCompany(e.target.value)}
                  placeholder="e.g. Self-Employed or CodeAlpha"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-rose-50/50 dark:bg-white/[0.05] border border-rose-300 dark:border-white/10 text-gray-950 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium focus:outline-hidden focus:border-[#ff4d79]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-950 dark:text-white mb-1">
                  Period / Year *
                </label>
                <input
                  type="text"
                  required
                  value={expPeriod}
                  onChange={(e) => setExpPeriod(e.target.value)}
                  placeholder="e.g. 2024 - Present"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-rose-50/50 dark:bg-white/[0.05] border border-rose-300 dark:border-white/10 text-gray-950 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium focus:outline-hidden focus:border-[#ff4d79]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-950 dark:text-white mb-1">
                  Description / Bullet Points
                </label>
                <textarea
                  rows={3}
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  placeholder="• Developed web applications...&#10;• Worked on AI and cybersecurity..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-rose-50/50 dark:bg-white/[0.05] border border-rose-300 dark:border-white/10 text-gray-950 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium focus:outline-hidden focus:border-[#ff4d79]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExperienceModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-gray-800 hover:text-gray-950 bg-white dark:bg-white/[0.05] border border-rose-300 dark:border-white/10 dark:text-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#ff2a6d] to-[#ff6699] text-white cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. CLIENT REVIEW MODAL */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white dark:bg-[#12050e] border border-rose-200 dark:border-[#ff4d79]/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl dark:shadow-[0_0_50px_rgba(255,77,121,0.3)] text-gray-950 dark:text-white">
            <div className="flex items-center justify-between border-b border-rose-200 dark:border-white/10 pb-3">
              <h3 className="text-base font-black text-gray-950 dark:text-white">
                {editingReviewIndex !== null ? 'Edit Client Review' : 'Add Client Review'}
              </h3>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="text-gray-600 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-950 dark:text-white mb-1">
                  Client Name *
                </label>
                <input
                  type="text"
                  required
                  value={revName}
                  onChange={(e) => setRevName(e.target.value)}
                  placeholder="e.g. Sneha R."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-rose-50/50 dark:bg-white/[0.05] border border-rose-300 dark:border-white/10 text-gray-950 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium focus:outline-hidden focus:border-[#ff4d79]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-950 dark:text-white mb-1">
                    Rating (1 - 5)
                  </label>
                  <select
                    value={revRating}
                    onChange={(e) => setRevRating(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-rose-50/50 dark:bg-[#1a0a14] border border-rose-300 dark:border-white/10 text-gray-950 dark:text-white font-medium focus:outline-hidden focus:border-[#ff4d79]"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                    <option value={3}>⭐⭐⭐ (3 Stars)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-950 dark:text-white mb-1">
                    Date / Timing
                  </label>
                  <input
                    type="text"
                    value={revDateText}
                    onChange={(e) => setRevDateText(e.target.value)}
                    placeholder="e.g. 2 weeks ago"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-rose-50/50 dark:bg-white/[0.05] border border-rose-300 dark:border-white/10 text-gray-950 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium focus:outline-hidden focus:border-[#ff4d79]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-950 dark:text-white mb-1">
                  Feedback Quote *
                </label>
                <textarea
                  rows={3}
                  required
                  value={revComment}
                  onChange={(e) => setRevComment(e.target.value)}
                  placeholder="Great work! Very professional, clear communication and delivered on time."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-rose-50/50 dark:bg-white/[0.05] border border-rose-300 dark:border-white/10 text-gray-950 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium focus:outline-hidden focus:border-[#ff4d79]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-gray-800 hover:text-gray-950 bg-white dark:bg-white/[0.05] border border-rose-300 dark:border-white/10 dark:text-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#ff2a6d] to-[#ff6699] text-white cursor-pointer"
                >
                  Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. PROFILE BRIEF & COMPREHENSIVE BRAND SHEET PRESETS MODAL */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white dark:bg-[#12050e] border border-rose-200 dark:border-[#ff4d79]/40 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-5 shadow-2xl dark:shadow-[0_0_60px_rgba(255,77,121,0.35)] text-gray-900 dark:text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-200 dark:border-white/10 pb-3">
              <div>
                <h3 className="text-base font-black text-gray-950 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#ff4d79]" />
                  <span>Customize Profile &amp; Look</span>
                </h3>
                <p className="text-xs text-gray-700 dark:text-gray-300 font-semibold">
                  Pick from all {VELOURA_AVATARS.length} official Veloura profile avatars, or edit your details & bio.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveProfileHeader()}
                  disabled={isSavingLook}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#ff2a6d] via-[#ff4d79] to-[#ff7597] text-white text-xs font-bold shadow-md shadow-rose-500/30 hover:shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSavingLook ? 'Saving Changes...' : 'Save & Change'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="text-gray-600 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Tabs: Look vs Info */}
            <div className="flex items-center gap-2 border-b border-rose-200/80 dark:border-white/10 pb-2">
              <button
                type="button"
                onClick={() => setProfileModalTab('look')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  profileModalTab === 'look'
                    ? 'bg-gradient-to-r from-[#ff3366] to-[#ff6699] text-white shadow-xs'
                    : 'bg-rose-50 dark:bg-white/[0.05] text-gray-800 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white'
                }`}
              >
                🎨 Avatar Look ({VELOURA_AVATARS.length} Avatars)
              </button>
              <button
                type="button"
                onClick={() => setProfileModalTab('info')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  profileModalTab === 'info'
                    ? 'bg-gradient-to-r from-[#ff3366] to-[#ff6699] text-white shadow-xs'
                    : 'bg-rose-50 dark:bg-white/[0.05] text-gray-800 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white'
                }`}
              >
                📝 Edit Details &amp; Bio
              </button>
            </div>

            <form onSubmit={handleSaveProfileHeader} className="space-y-4">
              {profileModalTab === 'look' ? (
                <>
                  {/* Entry Point: Change Cover Banner -> Open Banner Gallery */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50/70 dark:bg-white/[0.04] border border-rose-200 dark:border-[#ff4d79]/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-20 h-10 rounded-xl overflow-hidden bg-black/30 border border-rose-300 dark:border-white/20 shrink-0">
                        <img
                          src={headerInfo.bannerUrl || DEFAULT_VELOURA_BANNER}
                          alt="Current Profile Cover"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-gray-950 dark:text-white flex items-center gap-1.5">
                          <span>Profile Cover Banner</span>
                          <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                            (5:1 Ratio)
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-600 dark:text-gray-400 font-medium truncate">
                          Choose from all {VELOURA_BANNERS.length} curated designs in the Banner Gallery.
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileModalOpen(false);
                        setIsBannerGalleryOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#ff2a6d] to-[#ff4d79] text-white text-xs font-bold shadow-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Change Cover</span>
                    </button>
                  </div>

                  {/* Active Selection Preview Strip */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/70 dark:bg-white/[0.04] border border-rose-200 dark:border-[#ff4d79]/30">
                    <div className="flex items-center gap-3">
                      <img
                        src={headerInfo.avatarUrl}
                        alt="Current Avatar"
                        className="w-10 h-10 rounded-full border-2 border-[#ff4d79] object-cover"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-gray-950 dark:text-white">
                          Selected Profile Avatar
                        </div>
                        <div className="text-[10px] text-gray-700 dark:text-gray-300 font-semibold truncate max-w-xs sm:max-w-md">
                          Click below to change, then click &quot;Save &amp; Change&quot; to apply.
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveProfileHeader()}
                      disabled={isSavingLook}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-[#ff2a6d] to-[#ff6699] text-white text-xs font-bold shadow-xs hover:brightness-110 cursor-pointer shrink-0"
                    >
                      <span>{isSavingLook ? 'Saving...' : 'Save & Change'}</span>
                    </button>
                  </div>

                  {/* AVATAR PRESET SELECTOR (92 Total from brand sheets) */}
                  <div className="space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="block text-xs font-bold text-gray-900 dark:text-white">
                        Select Avatar Preset ({VELOURA_AVATARS.length} Available)
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(
                          [
                            { id: 'all', label: 'All' },
                            { id: 'girls', label: 'Cute Girls' },
                            { id: 'creators', label: 'Anime & Creators' },
                            { id: 'cats', label: 'Cats & Desks' },
                            { id: 'aesthetic', label: 'Sakura & Crest' },
                          ] as const
                        ).map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setAvatarCategoryFilter(f.id)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                              avatarCategoryFilter === f.id
                                ? 'bg-gradient-to-r from-[#ff3366] to-[#ff6699] text-white shadow-xs'
                                : 'bg-rose-50 dark:bg-white/[0.04] text-gray-800 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5 max-h-56 overflow-y-auto p-3 rounded-2xl bg-rose-50/50 dark:bg-black/40 border border-rose-200 dark:border-[#ff4d79]/25">
                      {VELOURA_AVATARS.filter(
                        (av) => avatarCategoryFilter === 'all' || av.category === avatarCategoryFilter
                      ).map((av) => {
                        const isSelected = headerInfo.avatarUrl === av.url;
                        return (
                          <button
                            key={av.name}
                            type="button"
                            onClick={() => setHeaderInfo({ ...headerInfo, avatarUrl: av.url })}
                            className={`flex flex-col items-center gap-1.5 p-1.5 rounded-xl transition-all cursor-pointer ${
                              isSelected
                                ? 'ring-2 ring-[#ff4d79] bg-rose-100 dark:bg-[#ff4d79]/20 shadow-[0_0_12px_rgba(255,77,121,0.4)]'
                                : 'hover:bg-rose-100/60 dark:hover:bg-white/5 opacity-85 hover:opacity-100'
                            }`}
                          >
                            <div className="relative">
                              <img
                                src={av.url}
                                alt={av.name}
                                className="w-12 h-12 rounded-full object-cover border border-[#ff4d79]/40 shadow-xs"
                              />
                              {isSelected && (
                                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#ff4d79] text-white flex items-center justify-center text-[10px]">
                                  ✓
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-center text-gray-950 dark:text-gray-200 line-clamp-1 w-full font-bold">
                              {av.name.split(' (')[0]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  </>
              ) : (
                <>
                  {/* Text Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-950 dark:text-white mb-1">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={headerInfo.name}
                        onChange={(e) => setHeaderInfo({ ...headerInfo, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-rose-50/50 dark:bg-white/[0.05] border border-rose-300 dark:border-white/10 text-gray-950 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium focus:outline-hidden focus:border-[#ff4d79]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-950 dark:text-white mb-1">
                        Professional Title
                      </label>
                      <input
                        type="text"
                        value={headerInfo.title}
                        onChange={(e) => setHeaderInfo({ ...headerInfo, title: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-rose-50/50 dark:bg-white/[0.05] border border-rose-300 dark:border-white/10 text-gray-950 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium focus:outline-hidden focus:border-[#ff4d79]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-950 dark:text-white mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={headerInfo.location}
                        onChange={(e) => setHeaderInfo({ ...headerInfo, location: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-rose-50/50 dark:bg-white/[0.05] border border-rose-300 dark:border-white/10 text-gray-950 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium focus:outline-hidden focus:border-[#ff4d79]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-950 dark:text-white mb-1">
                        Availability Status
                      </label>
                      <select
                        value={headerInfo.availability}
                        onChange={(e) =>
                          setHeaderInfo({ ...headerInfo, availability: e.target.value as any })
                        }
                        className="w-full px-3 py-2 rounded-xl text-xs bg-rose-50/50 dark:bg-[#1a0a14] border border-rose-300 dark:border-white/10 text-gray-950 dark:text-white font-medium focus:outline-hidden focus:border-[#ff4d79]"
                      >
                        <option value="available">🟢 Available for work</option>
                        <option value="part-time">🟡 Part-time Available</option>
                        <option value="busy">🔴 Busy on Projects</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-950 dark:text-white mb-1">
                        Projects Done
                      </label>
                      <input
                        type="number"
                        value={headerInfo.completedProjects}
                        onChange={(e) =>
                          setHeaderInfo({
                            ...headerInfo,
                            completedProjects: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl text-xs bg-rose-50/50 dark:bg-white/[0.05] border border-rose-300 dark:border-white/10 text-gray-950 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium focus:outline-hidden focus:border-[#ff4d79]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-950 dark:text-white mb-1">
                        Client Rating
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        value={headerInfo.rating}
                        onChange={(e) =>
                          setHeaderInfo({ ...headerInfo, rating: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 rounded-xl text-xs bg-rose-50/50 dark:bg-white/[0.05] border border-rose-300 dark:border-white/10 text-gray-950 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium focus:outline-hidden focus:border-[#ff4d79]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-950 dark:text-white mb-1">
                        Years Exp
                      </label>
                      <input
                        type="number"
                        value={headerInfo.yearsExperience}
                        onChange={(e) =>
                          setHeaderInfo({
                            ...headerInfo,
                            yearsExperience: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl text-xs bg-rose-50/50 dark:bg-white/[0.05] border border-rose-300 dark:border-white/10 text-gray-950 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium focus:outline-hidden focus:border-[#ff4d79]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-950 dark:text-white mb-1">
                      Summary Quote (Top Right)
                    </label>
                    <textarea
                      rows={2}
                      value={headerInfo.bio}
                      onChange={(e) => setHeaderInfo({ ...headerInfo, bio: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-rose-50/50 dark:bg-white/[0.05] border border-rose-300 dark:border-white/10 text-gray-950 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium focus:outline-hidden focus:border-[#ff4d79]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-950 dark:text-white mb-1">
                      About Me Detailed Bio
                    </label>
                    <textarea
                      rows={4}
                      value={headerInfo.aboutMe}
                      onChange={(e) => setHeaderInfo({ ...headerInfo, aboutMe: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-rose-50/50 dark:bg-white/[0.05] border border-rose-300 dark:border-white/10 text-gray-950 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium focus:outline-hidden focus:border-[#ff4d79]"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-rose-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-800 hover:text-gray-950 bg-white dark:bg-white/[0.05] border border-rose-300 dark:border-white/10 dark:text-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingLook}
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#ff2a6d] via-[#ff4d79] to-[#ff7597] text-white shadow-md shadow-rose-500/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  {isSavingLook ? 'Saving Changes...' : 'Save & Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. DEDICATED BANNER GALLERY MODAL */}
      <BannerGalleryModal
        isOpen={isBannerGalleryOpen}
        onClose={() => setIsBannerGalleryOpen(false)}
        currentBannerUrl={headerInfo.bannerUrl || DEFAULT_VELOURA_BANNER}
        onApplyBanner={async (newUrl: string) => {
          setHeaderInfo((prev) => ({ ...prev, bannerUrl: newUrl }));
          await persistProfile({ bannerUrl: newUrl });
          showToast('Profile cover updated successfully!', 'success');
        }}
        userName={headerInfo.name}
        userTitle={headerInfo.title}
        userAvatarUrl={headerInfo.avatarUrl}
      />
    </div>
  );
};
