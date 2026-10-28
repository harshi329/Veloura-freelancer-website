import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  MessageSquare,
  Search,
  CheckCheck,
  Sparkles,
  ArrowRight,
  Briefcase,
  User,
  Clock,
  RefreshCw,
} from 'lucide-react';
import type { UserProfile, ProjectItem } from '../../../shared/types.js';

interface MessageThread {
  projectId: string;
  projectTitle: string;
  category: string;
  status: string;
  otherParty: {
    _id?: string;
    name?: string;
    title?: string;
    avatarUrl?: string;
    role?: string;
  };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount?: number;
}

interface MessageItem {
  _id: string;
  projectId: string;
  sender: {
    _id: string;
    name: string;
    role?: string;
    title?: string;
  };
  recipient: {
    _id: string;
    name: string;
    role?: string;
  };
  body: string;
  createdAt: string;
}

interface DashboardMessagesViewProps {
  user: UserProfile;
  apiFetch: <T>(url: string, options?: RequestInit) => Promise<T>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  initialProjectId?: string;
}

export const DashboardMessagesView: React.FC<DashboardMessagesViewProps> = ({
  user,
  apiFetch,
  showToast,
  initialProjectId,
}) => {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(initialProjectId || null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadThreads = async () => {
    try {
      const res = await apiFetch<{ threads: MessageThread[] }>('/api/my/threads');
      setThreads(res.threads || []);
      if (!activeProjectId && res.threads && res.threads.length > 0) {
        setActiveProjectId(res.threads[0].projectId);
      }
    } catch {
      // Partial failure fallback
    } finally {
      setLoadingThreads(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  const loadMessages = async (projId: string) => {
    setLoadingMessages(true);
    try {
      const res = await apiFetch<{ messages: MessageItem[] }>(`/api/messages/${projId}`);
      setMessages(res.messages || []);
      scrollToBottom();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load messages', 'error');
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activeProjectId) {
      loadMessages(activeProjectId);
    }
  }, [activeProjectId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeProjectId) return;

    const body = messageText.trim();
    setMessageText('');
    setSendingMessage(true);

    try {
      await apiFetch(`/api/messages/${activeProjectId}`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      });
      await loadMessages(activeProjectId);
      await loadThreads();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send message', 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  const activeThread = threads.find((t) => t.projectId === activeProjectId);

  const filteredThreads = threads.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.projectTitle.toLowerCase().includes(q) ||
      (t.otherParty?.name || '').toLowerCase().includes(q) ||
      t.lastMessage.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* View Header */}
      <div className="border-b border-[var(--border-subtle)] pb-4">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Collaboration Messages
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
          Direct, encrypted project messaging between clients and vetted specialists.
        </p>
      </div>

      {/* Main Dual-Pane Chat Hub */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border border-[var(--border-subtle)] rounded-3xl bg-[var(--bg-surface)] overflow-hidden min-h-[640px] shadow-sm">
        {/* ===================================================================
            LEFT 4-5 COLS: THREADS LIST
        =================================================================== */}
        <div className="md:col-span-5 lg:col-span-4 border-r border-[var(--border-subtle)] flex flex-col bg-[var(--bg-surface)]">
          {/* Thread Search */}
          <div className="p-3.5 border-b border-[var(--border-subtle)]">
            <div className="relative">
              <Search className="h-4 w-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 pl-9 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Threads Scroll List */}
          <div className="flex-1 overflow-y-auto max-h-[580px] divide-y divide-[var(--border-subtle)]">
            {loadingThreads ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-rose-500" />
                <span>Loading conversations...</span>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <MessageSquare className="h-8 w-8 text-[var(--text-muted)] mx-auto opacity-40" />
                <p className="text-xs text-[var(--text-muted)]">No active threads yet.</p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Messages will appear here as soon as a proposal is submitted or project started.
                </p>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = thread.projectId === activeProjectId;
                const other = thread.otherParty || { name: 'Specialist' };
                const initials = (other.name || 'User')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <button
                    key={thread.projectId}
                    type="button"
                    onClick={() => setActiveProjectId(thread.projectId)}
                    className={`w-full text-left p-3.5 transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-rose-500/10 border-l-4 border-rose-500 font-medium'
                        : 'hover:bg-[var(--bg-elevated)]/50'
                    }`}
                  >
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-xs font-bold text-white shadow-xs">
                      {initials}
                      {thread.unreadCount && thread.unreadCount > 0 ? (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white font-bold ring-2 ring-[var(--bg-surface)]">
                          {thread.unreadCount}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                          {other.name}
                        </p>
                        <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                          {new Date(thread.lastMessageAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      <p className="text-[11px] font-semibold text-rose-500/90 truncate">
                        {thread.projectTitle}
                      </p>

                      <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                        {thread.lastMessage}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ===================================================================
            RIGHT 7-8 COLS: CONVERSATION WINDOW
        =================================================================== */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col bg-[var(--bg-canvas)]/40 min-h-[500px]">
          {activeThread ? (
            <>
              {/* Chat Top Banner */}
              <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-xs font-bold text-white shadow-xs">
                    {(activeThread.otherParty?.name || 'U')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] truncate">
                      {activeThread.otherParty?.name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      Project: <span className="text-rose-500 font-semibold">{activeThread.projectTitle}</span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-300/30">
                    {activeThread.category}
                  </span>
                </div>
              </div>

              {/* Message Bubbles History */}
              <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3.5 max-h-[460px]">
                {loadingMessages ? (
                  <div className="p-8 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-rose-500" />
                    <span>Loading messages...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <Sparkles className="h-7 w-7 text-rose-400 mx-auto" />
                    <p className="text-xs font-semibold text-[var(--text-primary)]">
                      Start of the Project Channel
                    </p>
                    <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                      Clarify project milestones, exchange architectural specifications, or coordinate sprint deliverables.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = String(msg.sender._id) === String(user._id);

                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-[11px] font-bold text-[var(--text-secondary)]">
                            {isMe ? 'You' : msg.sender.name}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div
                          className={`max-w-[85%] sm:max-w-md rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                            isMe
                              ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white rounded-br-xs'
                              : 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.body}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer Input */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 sm:p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center gap-2"
              >
                <input
                  type="text"
                  required
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`Reply to ${activeThread.otherParty?.name || 'collaborator'}...`}
                  className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-4 py-2.5 text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !messageText.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-rose-950/20 hover:from-rose-500 hover:to-rose-400 cursor-pointer disabled:opacity-50"
                >
                  {sendingMessage ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-[var(--text-muted)] space-y-2">
              <MessageSquare className="h-10 w-10 text-[var(--text-muted)] opacity-30" />
              <p className="font-semibold text-[var(--text-primary)]">Select a Conversation</p>
              <p className="max-w-xs">
                Choose an ongoing project collaboration thread from the left to view and send messages.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
