/**
 * PosalPro MVP2 - Communication Center Component
 * Real-time team communication and collaboration hub
 * Based on COORDINATION_HUB_SCREEN.md wireframe specifications
 *
 * User Stories: US-2.2, US-4.1, US-4.3
 * Hypotheses: H4 (40% coordination reduction), H7 (40% on-time improvement)
 * Component Traceability: CommunicationCenter, TeamChat, NotificationHub
 */

'use client';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner';
import { Button } from '@/components/ui/forms/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useApiClient } from '@/hooks/useApiClient';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';
import { ErrorHandlingService } from '@/lib/errors';
import {
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Simple toast function to replace react-hot-toast
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  // Use app-level toast; avoid console noise in production
  // In a real implementation, this would show a toast notification
};

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-2.2', 'US-2.3'],
  acceptanceCriteria: ['AC-2.2.3', 'AC-2.3.2'],
  methods: [
    'facilitateComm()',
    'clientInsights()',
    'trackCommunications()',
    'measureCoordEffort()',
  ],
  hypotheses: ['H4'],
  testCases: ['TC-H4-001', 'TC-H4-002'],
};

// Types based on wireframe specifications
export interface CommunicationMessage {
  id: string;
  proposalId: string;
  from: {
    id: string;
    name: string;
    role: string;
    department: string;
    avatar?: string;
  };
  content: string;
  type: 'message' | 'task' | 'status_update' | 'system_notification';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  timestamp: Date;
  isRead: boolean;
  mentions?: string[];
  tags?: string[];
  actionItems?: ActionItem[];
  clientInsights?: ClientInsight[];
}

export interface ActionItem {
  id: string;
  description: string;
  assignedTo: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

export interface ClientInsight {
  id: string;
  type: 'preference' | 'concern' | 'requirement' | 'feedback';
  content: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  suggestedActions: string[];
}

export interface CommunicationParticipant {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  isOnline: boolean;
  lastActive: Date;
  avatar?: string;
  permissions: string[];
}

export interface CommunicationCenterProps {
  proposalId: string;
  currentUserId: string;
  onMessageSent?: (message: CommunicationMessage) => void;
  onTaskCreated?: (task: ActionItem) => void;
  className?: string;
  isCompact?: boolean;
  hideHeader?: boolean;
  initialTab?: 'messages' | 'tasks' | 'files';
  autofocusComposer?: boolean;
  enableRealTimePresence?: boolean;
  enableKeyboardShortcuts?: boolean;
  onlineUsers?: string[];
}

// Strict priority union
type Priority = 'low' | 'normal' | 'high' | 'urgent';

export function CommunicationCenter({
  proposalId,
  currentUserId,
  onMessageSent,
  onTaskCreated,
  className = '',
  isCompact = false,
  hideHeader = false,
  initialTab = 'messages',
  autofocusComposer = false,
  enableRealTimePresence = true,
  enableKeyboardShortcuts = true,
  onlineUsers = [],
}: CommunicationCenterProps) {
  // Initialize services
  const errorHandlingService = ErrorHandlingService.getInstance();
  const { handleAsyncError } = useErrorHandler();
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const { collectMetrics } = usePerformanceOptimization();

  // State management
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMessages, setFilteredMessages] = useState<CommunicationMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [keyboardShortcutsEnabled, setKeyboardShortcutsEnabled] = useState(enableKeyboardShortcuts);
  const [realTimePresence, setRealTimePresence] = useState<Record<string, boolean>>({});
  const [unreadCounts, setUnreadCounts] = useState({ messages: 0, tasks: 0, files: 0 });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [participants, setParticipants] = useState<CommunicationParticipant[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<'message' | 'task'>('message');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<Priority>('normal');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showClientInsights, setShowClientInsights] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'mentions' | 'tasks'>('all');
  const [activeTab, setActiveTab] = useState<'messages' | 'tasks' | 'files'>(initialTab);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Auto-compact based on container width (useful when embedded in right sidebar)
  const [autoCompact, setAutoCompact] = useState(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width ?? el.clientWidth;
      // Force compact below 420px container width
      setAutoCompact(w < 420);
    });
    ro.observe(el);
    // Initial check
    setAutoCompact(el.clientWidth < 420);
    return () => ro.disconnect();
  }, []);

  // Component Traceability Matrix analytics
  const trackCommunicationMetrics = useCallback(
    (
      action: string,
      metadata?: Record<string, any>,
      priority: 'low' | 'medium' | 'high' = 'medium'
    ) => {
      try {
        analytics(
          'communication_center_interaction',
          {
            component: 'CommunicationCenter',
            action,
            proposalId,
            userStory: 'US-2.2',
            acceptanceCriteria: ['AC-2.2.3'],
            hypothesis: 'H4',
            targetReduction: 0.4, // 40% coordination effort reduction
            ...metadata,
          },
          priority
        );
      } catch (error) {
        handleAsyncError(error, 'Failed to track communication metrics', {
          action,
          metadata,
          component: 'CommunicationCenter',
        });
      }
    },
    [analytics, proposalId, currentUserId, handleAsyncError]
  );

  const apiClient = useApiClient();

  // Real-time presence simulation
  useEffect(() => {
    if (enableRealTimePresence) {
      const updatePresence = () => {
        const presence: Record<string, boolean> = {};
        participants.forEach(p => {
          presence[p.id] = onlineUsers.includes(p.id) || Math.random() > 0.3;
        });
        setRealTimePresence(presence);
      };

      updatePresence();
      const interval = setInterval(updatePresence, 30000); // Update every 30s
      return () => clearInterval(interval);
    }
  }, [enableRealTimePresence, participants, onlineUsers]);

  // Enhanced search function
  const performAdvancedSearch = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setFilteredMessages(messages);
        return;
      }

      const searchTerms = query.toLowerCase().split(' ');
      const filtered = messages.filter(msg => {
        const searchableText = [
          msg.content,
          msg.from.name,
          msg.from.role,
          ...(msg.tags || []),
          ...(msg.mentions || []),
          ...(msg.actionItems?.map(item => item.description) || []),
        ]
          .join(' ')
          .toLowerCase();

        return searchTerms.every(term => searchableText.includes(term));
      });

      setFilteredMessages(filtered);
    },
    [messages]
  );

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      performAdvancedSearch(searchQuery);
      setIsSearching(false);
    } else {
      setFilteredMessages(messages);
    }
  }, [searchQuery, messages]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!keyboardShortcutsEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Cmd/Ctrl + 1,2,3 to switch tabs
      if ((e.metaKey || e.ctrlKey) && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        const tabs = ['messages', 'tasks', 'files'] as const;
        setActiveTab(tabs[parseInt(e.key) - 1]);
      }
      // Cmd/Ctrl + Enter to send message (when textarea is focused)
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key === 'Enter' &&
        document.activeElement === textareaRef.current
      ) {
        e.preventDefault();
        sendMessage();
      }
      // Escape to clear search
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
      // ? to show shortcuts help
      if (
        e.key === '?' &&
        !e.ctrlKey &&
        !e.metaKey &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        setShowShortcutsHelp(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keyboardShortcutsEnabled, searchQuery]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages]);

  // Safely normalize API responses that may be an array or wrapped in an object
  const normalizeApiList = <T,>(
    res: unknown,
    keys: string[] = ['data', 'messages', 'participants', 'items']
  ): T[] => {
    if (Array.isArray(res)) return res as T[];
    if (res && typeof res === 'object') {
      const obj = res as Record<string, unknown>;
      for (const k of keys) {
        const v = obj[k];
        if (Array.isArray(v)) return v as T[];
      }
    }
    return [] as T[];
  };

  // Coercion helpers to satisfy strict typing without using any
  type IncomingActionItem = Partial<ActionItem> & { dueDate?: string | Date };
  type IncomingMessage = Partial<CommunicationMessage> & {
    timestamp?: string | Date;
    actionItems?: IncomingActionItem[];
  };
  type IncomingParticipant = Partial<CommunicationParticipant> & { lastActive?: string | Date };

  const toDate = (v?: string | Date): Date => (v ? new Date(v) : new Date());

  const coerceMessage = (m: IncomingMessage): CommunicationMessage => ({
    id: String(m.id ?? Date.now()),
    proposalId: String(m.proposalId ?? proposalId),
    from: m.from ?? ({ id: 'system', name: 'System', role: 'System', department: 'System' } as any),
    content: m.content ?? '',
    type: (m.type as any) ?? 'message',
    priority: (m.priority as any) ?? 'normal',
    timestamp: toDate(m.timestamp),
    isRead: m.isRead ?? true,
    mentions: m.mentions ?? [],
    tags: m.tags ?? [],
    actionItems: m.actionItems?.map((ai, idx) => ({
      id: String(ai.id ?? `${Date.now()}-${idx}`),
      description: ai.description ?? '',
      assignedTo: ai.assignedTo ?? currentUserId,
      status: (ai.status as any) ?? 'pending',
      priority: (ai.priority as any) ?? 'medium',
      dueDate: toDate(ai.dueDate),
    })),
    clientInsights: (m as any).clientInsights ?? [],
  });

  const coerceParticipant = (p: IncomingParticipant): CommunicationParticipant => ({
    id: String(p.id ?? ''),
    name: p.name ?? 'User',
    role: p.role ?? 'Member',
    department: p.department ?? 'General',
    email: p.email ?? '',
    isOnline: Boolean(p.isOnline),
    lastActive: toDate(p.lastActive),
    avatar: p.avatar,
    permissions: p.permissions ?? ['read'],
  });

  const extractLinks = (content: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s)]+)|\b\w+\.(?:pdf|docx?|xlsx?|pptx?)\b/gi;
    const found: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = urlRegex.exec(content)) !== null) {
      if (match[0]) found.push(match[0]);
    }
    return found;
  };

  // Load communication data
  const loadCommunicationData = useCallback(async () => {
    setIsLoading(true);
    const startTime = Date.now();

    // Guard: skip API calls if proposalId is missing/empty
    if (!proposalId) {
      setMessages([]);
      setParticipants([]);
      trackCommunicationMetrics('data_load_skipped', { reason: 'missing_proposalId' });
      setIsLoading(false);
      return;
    }

    try {
      const [messagesRes, participantsRes] = await Promise.all([
        apiClient.get<unknown>(`/communications?proposalId=${encodeURIComponent(proposalId)}`),
        apiClient.get<unknown>(
          `/communications/participants?proposalId=${encodeURIComponent(proposalId)}`
        ),
      ]);

      // Extract arrays regardless of whether API returns an array or a wrapped object
      const rawMessages = normalizeApiList<IncomingMessage>(messagesRes, ['data', 'messages']);
      const rawParticipants = normalizeApiList<IncomingParticipant>(participantsRes, [
        'data',
        'participants',
      ]);

      // Normalize dates and shapes
      const normalizedMessages: CommunicationMessage[] = rawMessages.map(coerceMessage);
      const normalizedParticipants: CommunicationParticipant[] =
        rawParticipants.map(coerceParticipant);

      setMessages(normalizedMessages);
      setParticipants(normalizedParticipants);

      const loadTime = Date.now() - startTime;
      trackCommunicationMetrics('data_loaded', {
        messageCount: normalizedMessages.length,
        participantCount: normalizedParticipants.length,
        loadTime,
      });
    } catch (error) {
      const standardError = handleAsyncError(error, 'Failed to load communication data', {
        proposalId,
        component: 'CommunicationCenter',
        operation: 'loadCommunicationData',
      });

      showToast(errorHandlingService.getUserFriendlyMessage(standardError), 'error');

      trackCommunicationMetrics('data_load_error', { error: standardError.message });
      showToast('Failed to load communications. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [proposalId, apiClient, analytics, handleAsyncError]);

  // Filtered and searched messages
  const computedFilteredMessages = useMemo(() => {
    let list = messages;
    // Apply filter
    switch (activeFilter) {
      case 'unread':
        list = list.filter(m => !m.isRead);
        break;
      case 'mentions':
        // Heuristic: any @mention in content
        list = list.filter(m => /@[A-Za-z0-9_\-.]+/.test(m.content));
        break;
      case 'tasks':
        // If message type exists, prefer it; otherwise fallback to tag
        list = list.filter(m => (m as any).type === 'task' || (m.tags || []).includes('task'));
        break;
      default:
        break;
    }
    // Apply tab-level filtering
    if (activeTab === 'tasks') {
      list = list.filter(m => (m as any).type === 'task' || (m.tags || []).includes('task'));
    }
    // Apply search
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      list = list.filter(m => {
        const inContent = m.content.toLowerCase().includes(q);
        const inAuthor = m.from?.name?.toLowerCase?.().includes(q);
        const inTags = (m.tags || []).some(t => t.toLowerCase().includes(q));
        return inContent || inAuthor || inTags;
      });
    }
    return list;
  }, [messages, activeFilter, activeTab, searchTerm]);

  const filesFromMessages = useMemo(() => {
    const items: Array<{
      id: string;
      link: string;
      from: CommunicationMessage['from'];
      timestamp: Date;
    }> = [];
    for (const m of messages) {
      const links = extractLinks(m.content);
      links.forEach((link, idx) =>
        items.push({ id: `${m.id}-${idx}`, link, from: m.from, timestamp: m.timestamp })
      );
    }
    const q = searchTerm.trim().toLowerCase();
    const filtered = q
      ? items.filter(i => i.link.toLowerCase().includes(q) || i.from.name.toLowerCase().includes(q))
      : items;
    return filtered;
  }, [messages, searchTerm]);

  const unreadCount = useMemo(() => messages.filter(m => !m.isRead).length, [messages]);
  const tasksCount = useMemo(
    () =>
      messages.filter(m => (m as any).type === 'task' || (m.tags || []).includes('task')).length,
    [messages]
  );
  const filesCount = useMemo(() => filesFromMessages.length, [filesFromMessages]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim()) return;

    setIsSubmitting(true);
    const startTime = Date.now();

    try {
      const message: CommunicationMessage = {
        id: Date.now().toString(),
        proposalId,
        from: {
          id: currentUserId,
          name: 'Current User', // Replace with actual user data
          role: 'User',
          department: 'Department',
        },
        content: newMessage,
        type: messageType,
        priority: selectedPriority,
        timestamp: new Date(),
        isRead: true,
        mentions: extractMentions(newMessage),
        tags: extractTags(newMessage),
      };

      // Add to messages
      setMessages(prev => [...prev, message]);
      setNewMessage('');

      // Callback
      onMessageSent?.(message);

      const sendTime = Date.now() - startTime;
      trackCommunicationMetrics('message_sent', {
        messageType,
        priority: selectedPriority,
        contentLength: newMessage.length,
        mentionCount: message.mentions?.length || 0,
        sendTime,
      });

      showToast('Message sent successfully');

      // Focus back on textarea
      textareaRef.current?.focus();
    } catch (error) {
      const standardError = handleAsyncError(error, 'Failed to send message', {
        proposalId,
        messageType,
        component: 'CommunicationCenter',
        operation: 'sendMessage',
      });

      showToast(errorHandlingService.getUserFriendlyMessage(standardError), 'error');

      trackCommunicationMetrics('message_send_error', {
        error: standardError.message,
        messageType,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    newMessage,
    proposalId,
    currentUserId,
    messageType,
    selectedPriority,
    onMessageSent,
    trackCommunicationMetrics,
    handleAsyncError,
    errorHandlingService,
  ]);

  // Helper functions
  const extractMentions = (content: string): string[] => {
    const mentionRegex = /@([A-Za-z\s\.]+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  };

  const extractTags = (content: string): string[] => {
    const tagRegex = /#([A-Za-z0-9\-_]+)/g;
    const tags = [];
    let match;
    while ((match = tagRegex.exec(content)) !== null) {
      tags.push(match[1]);
    }
    return tags;
  };

  // Format relative time
  const formatRelativeTime = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Get priority color
  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Helpers for grouping and date separators
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const formatDateLabel = (d: Date) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (isSameDay(d, today)) return 'Today';
    if (isSameDay(d, yesterday)) return 'Yesterday';
    return d.toLocaleDateString();
  };

  const shouldGroup = (prev: CommunicationMessage | null, curr: CommunicationMessage) => {
    if (!prev) return false;
    if (prev.from.id !== curr.from.id) return false;
    const diff = Math.abs(curr.timestamp.getTime() - prev.timestamp.getTime());
    // group if within 5 minutes
    return isSameDay(prev.timestamp, curr.timestamp) && diff <= 5 * 60 * 1000;
  };

  const renderContentWithAccents = (content: string) => {
    // Accents for @mentions and #tags
    const parts = content.split(/([@#][A-Za-z0-9_\-.]+)/g);
    return (
      <span>
        {parts.map((p, i) => {
          if (p.startsWith('@'))
            return (
              <span key={i} className="text-blue-700 font-medium">
                {p}
              </span>
            );
          if (p.startsWith('#'))
            return (
              <span key={i} className="text-green-700 font-medium">
                {p}
              </span>
            );
          return <span key={i}>{p}</span>;
        })}
      </span>
    );
  };

  // Load data on mount
  useEffect(() => {
    loadCommunicationData();

    // Track component mount
    trackCommunicationMetrics('component_mounted', {
      proposalId,
      isCompact,
    });
  }, [loadCommunicationData, trackCommunicationMetrics, proposalId, isCompact]);

  // Optional autofocus for composer
  useEffect(() => {
    if (autofocusComposer) {
      textareaRef.current?.focus();
    }
  }, [autofocusComposer]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Render compact view for coordination hub
  const compact = isCompact || autoCompact;
  if (compact) {
    return (
      <div ref={containerRef}>
        <Card className={`p-4 ${className}`}>
          {!hideHeader && (
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-medium text-gray-900">Team Communication</h3>
                {unreadCount > 0 && (
                  <Badge className="bg-red-100 text-red-800">{unreadCount} unread</Badge>
                )}
              </div>
            </div>
          )}

          {/* Tabs + Quick Search */}
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                className={`text-xs px-2 py-1 rounded ${activeTab === 'messages' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setActiveTab('messages')}
              >
                Messages
              </button>
              <button
                className={`text-xs px-2 py-1 rounded ${activeTab === 'tasks' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setActiveTab('tasks')}
              >
                Tasks ({tasksCount})
              </button>
              <button
                className={`text-xs px-2 py-1 rounded ${activeTab === 'files' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setActiveTab('files')}
              >
                Files ({filesCount})
              </button>
            </div>
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search"
              className="border rounded px-2 py-1 text-xs w-28"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <LoadingSpinner size="sm" />
            </div>
          ) : activeTab === 'files' ? (
            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
              {filesFromMessages.slice(0, 6).map(item => (
                <a
                  key={item.id}
                  href={item.link.startsWith('http') ? item.link : undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center px-2 py-1 border rounded-md hover:bg-gray-50 text-[11px] text-gray-700"
                >
                  <PaperClipIcon className="h-3 w-3 mr-2 text-gray-500" />
                  <span className="truncate">{item.link}</span>
                  <span className="ml-auto text-[10px] text-gray-400 whitespace-nowrap">
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </a>
              ))}
              {filesFromMessages.length === 0 && (
                <div className="text-[11px] text-gray-500 px-2 py-1">No files found</div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
              {/* Left: Recent messages */}
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                {(activeTab === 'messages'
                  ? computedFilteredMessages
                  : computedFilteredMessages.filter(
                      m => (m as any).type === 'task' || (m.tags || []).includes('task')
                    )
                )
                  .slice(0, 3)
                  .map(message => (
                    <div key={message.id} className="px-2 py-1 border rounded-md hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-[11px] font-medium text-gray-900 truncate max-w-[9rem]">
                              {message.from.name}
                            </span>
                            <span className="text-[10px] capitalize text-gray-500">
                              {message.priority}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600 truncate">{message.content}</p>
                        </div>
                        <span className="text-[10px] text-gray-400 ml-2 whitespace-nowrap">
                          {formatRelativeTime(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                {computedFilteredMessages.length === 0 && (
                  <div className="text-[11px] text-gray-500 px-2 py-1">No messages</div>
                )}
              </div>

              {/* Right: Compact composer */}
              <div className="space-y-1">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1">
                  <div className="grid grid-cols-2 gap-1 w-full sm:w-auto sm:flex sm:space-x-1 sm:grid-cols-1">
                    <Button
                      size="sm"
                      variant={messageType === 'message' ? 'primary' : 'outline'}
                      onClick={() => setMessageType('message')}
                      className="w-full sm:w-auto px-2"
                    >
                      <ChatBubbleLeftRightIcon className="h-3 w-3 mr-1" />
                      Msg
                    </Button>
                    <Button
                      size="sm"
                      variant={messageType === 'task' ? 'primary' : 'outline'}
                      onClick={() => setMessageType('task')}
                      className="w-full sm:w-auto px-2"
                    >
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      Task
                    </Button>
                  </div>
                  <select
                    value={selectedPriority}
                    onChange={e => setSelectedPriority(e.target.value as Priority)}
                    className="hidden sm:block w-auto shrink-0 border border-gray-300 rounded-md px-2 py-1 text-xs focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <Textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNewMessage(e.target.value)
                  }
                  placeholder={`Type ${messageType}… (@, #)`}
                  rows={1}
                  className="w-full resize-none text-sm leading-tight min-h-[36px] max-h-20 overflow-auto"
                  onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="hidden sm:block text-xs text-gray-500">
                    Ctrl+Enter to send • @name • #tag
                  </div>
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isSubmitting}
                    size="sm"
                    className="px-2"
                  >
                    {isSubmitting ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <PaperAirplaneIcon className="h-3 w-3 mr-1" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Component Traceability Matrix */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-blue-800 bg-blue-50 p-2 rounded">
              <div className="font-semibold mb-1">H4 Tracking:</div>
              <div>
                Messages: {messages.length} | Participants: {participants.length}
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Full view implementation
  return (
    <div ref={containerRef} className={`space-y-6 ${className}`}>
      <Card className="p-6">
        {!hideHeader && (
          <div className="flex items-center space-x-3 mb-4">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Communication Center</h2>
              <p className="text-sm text-gray-500">Centralized coordination and client insights</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Main Chat Area */}
            <div className="md:col-span-2 min-w-0">
              <div
                className={`relative ${isCompact ? 'h-[50vh]' : 'h-[60vh]'} border rounded-lg overflow-hidden bg-white`}
              >
                {/* Unified container: only messages scroll */}
                <div className="h-full flex flex-col bg-white">
                  {/* Messages */}
                  <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-4">
                    {(() => {
                      const sorted = [...computedFilteredMessages].sort(
                        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
                      );
                      let lastDate: Date | null = null;
                      let prev: CommunicationMessage | null = null;
                      return (
                        <>
                          {sorted.map((m, idx) => {
                            const showDate = !lastDate || !isSameDay(lastDate, m.timestamp);
                            if (showDate) lastDate = m.timestamp;
                            const grouped = shouldGroup(prev, m);
                            const isMine = m.from.id === currentUserId;
                            const bubbleBase = `max-w-[80%] inline-block px-3 py-2 rounded-lg text-sm ${
                              isMine ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                            }`;
                            const container = `flex ${isMine ? 'justify-end' : 'justify-start'}`;
                            const radius = grouped
                              ? isMine
                                ? 'rounded-tr-sm'
                                : 'rounded-tl-sm'
                              : '';
                            const headerNeeded = !grouped;
                            const content = (
                              <div className={container}>
                                <div
                                  className={`space-y-1 ${isMine ? 'items-end' : 'items-start'} flex flex-col`}
                                >
                                  {headerNeeded && (
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      {!isMine && <Avatar name={m.from.name} size="xs" />}
                                      <span className="font-medium text-gray-700">
                                        {m.from.name}
                                      </span>
                                      <span>• {formatRelativeTime(m.timestamp)}</span>
                                      <Badge size="sm" className={getPriorityColor(m.priority)}>
                                        {m.priority}
                                      </Badge>
                                    </div>
                                  )}
                                  <div className={`${bubbleBase} ${radius}`}>
                                    <p className="whitespace-pre-wrap break-words">
                                      {renderContentWithAccents(m.content)}
                                    </p>
                                    {m.tags && m.tags.length > 0 && (
                                      <div className="mt-1 flex flex-wrap gap-1">
                                        {m.tags.map((tag: string) => (
                                          <Badge key={tag} size="sm" variant="outline">
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                    {showClientInsights &&
                                      m.clientInsights &&
                                      m.clientInsights.length > 0 && (
                                        <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-2">
                                          <h5 className="text-xs font-medium text-blue-800 mb-1">
                                            Client Insights
                                          </h5>
                                          <ul className="space-y-1">
                                            {m.clientInsights.map(
                                              (ci: {
                                                id: string;
                                                type: string;
                                                content: string;
                                              }) => (
                                                <li key={ci.id} className="text-xs text-blue-800">
                                                  <span className="font-medium">{ci.type}:</span>{' '}
                                                  {ci.content}
                                                </li>
                                              )
                                            )}
                                          </ul>
                                        </div>
                                      )}
                                    {m.actionItems && m.actionItems.length > 0 && (
                                      <div className="mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                                        <div className="flex items-center text-xs font-medium text-yellow-800 mb-1">
                                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                                          Action Items
                                        </div>
                                        <div className="space-y-1">
                                          {m.actionItems.map(item => (
                                            <div
                                              key={item.id}
                                              className="text-[11px] text-yellow-900 flex items-center justify-between"
                                            >
                                              <span className="truncate mr-2">
                                                {item.description}
                                              </span>
                                              <span className="ml-auto whitespace-nowrap">
                                                {item.status} •{' '}
                                                {new Date(item.dueDate).toLocaleDateString()}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                            const node = (
                              <div key={m.id} className="space-y-2">
                                {showDate && (
                                  <div className="flex items-center justify-center">
                                    <div className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                      {formatDateLabel(m.timestamp)}
                                    </div>
                                  </div>
                                )}
                                {content}
                              </div>
                            );
                            prev = m;
                            return node;
                          })}
                          <div ref={messagesEndRef} />
                        </>
                      );
                    })()}
                  </div>

                  {/* Composer pinned to bottom of card */}
                  <div className="z-10">
                    <div className="p-3 border-t bg-gray-50/95 backdrop-blur supports-[backdrop-filter]:bg-gray-50/80 shadow-sm">
                      <div className="space-y-3">
                        {/* Type and Priority Selection */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:space-x-2 sm:grid-cols-1">
                            <Button
                              size="sm"
                              variant={messageType === 'message' ? 'primary' : 'outline'}
                              onClick={() => setMessageType('message')}
                              className="w-full sm:w-auto"
                            >
                              <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                              Message
                            </Button>
                            <Button
                              size="sm"
                              variant={messageType === 'task' ? 'primary' : 'outline'}
                              onClick={() => setMessageType('task')}
                              className="w-full sm:w-auto"
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Task
                            </Button>
                          </div>

                          <select
                            value={selectedPriority}
                            onChange={e => setSelectedPriority(e.target.value as Priority)}
                            className="w-full sm:w-auto shrink-0 border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="low">Low Priority</option>
                            <option value="normal">Normal Priority</option>
                            <option value="high">High Priority</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>

                        {/* Message Input */}
                        <div className="space-y-2">
                          <Textarea
                            ref={textareaRef}
                            value={newMessage}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                              setNewMessage(e.target.value)
                            }
                            placeholder={`Type your ${messageType}... Use @mentions and #tags`}
                            rows={2}
                            className="w-full resize-none"
                            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                e.preventDefault();
                                sendMessage();
                              }
                            }}
                          />

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                            <div className="text-xs text-gray-500 sm:flex-1">
                              Ctrl+Enter to send • Use @name for mentions • Use #tag for tags
                            </div>
                            <Button
                              onClick={sendMessage}
                              disabled={!newMessage.trim() || isSubmitting}
                              size="sm"
                              className="self-end sm:self-auto"
                            >
                              {isSubmitting ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <>
                                  <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                                  Send {messageType}
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="hidden lg:block">
              <div className="space-y-4">
                {/* Filters */}
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">Filters</div>
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'unread', 'mentions', 'tasks'] as const).map(f => (
                      <Button
                        key={f}
                        variant={activeFilter === f ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setActiveFilter(f)}
                      >
                        {f}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Search */}
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">Search</div>
                  <input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search messages"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Participants */}
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">
                    Participants ({participants.length})
                  </div>
                  <div className="space-y-2">
                    {participants.map(p => (
                      <div key={p.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar name={p.name} size="xs" />
                          <div>
                            <div className="text-sm font-medium">{p.name}</div>
                            <div className="text-[11px] text-gray-500">{p.role}</div>
                          </div>
                        </div>
                        <span
                          className={`h-2 w-2 rounded-full ${p.isOnline ? 'bg-green-500' : 'bg-gray-300'}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message Composer (kept for accessibility on small screens, hidden since sticky in main) */}
        <div className="mt-6 p-4 border rounded-lg bg-gray-50 md:hidden">
          <div className="space-y-3">
            {/* Type and Priority Selection */}
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant={messageType === 'message' ? 'primary' : 'outline'}
                  onClick={() => setMessageType('message')}
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                  Message
                </Button>
                <Button
                  size="sm"
                  variant={messageType === 'task' ? 'primary' : 'outline'}
                  onClick={() => setMessageType('task')}
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Task
                </Button>
              </div>

              <select
                value={selectedPriority}
                onChange={e => setSelectedPriority(e.target.value as Priority)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low Priority</option>
                <option value="normal">Normal Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Message Input */}
            <div className="space-y-2">
              <Textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setNewMessage(e.target.value)
                }
                placeholder={`Type your ${messageType}... Use @mentions and #tags`}
                rows={3}
                className="w-full"
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Ctrl+Enter to send • Use @name for mentions • Use #tag for tags
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || isSubmitting}
                  size="sm"
                >
                  {isSubmitting ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                      Send {messageType}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Component Traceability Matrix */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-xs text-blue-800 bg-blue-50 p-3 rounded">
            <div className="font-semibold mb-1">Component Traceability Matrix:</div>
            <div className="space-y-1">
              <div>
                <strong>User Stories:</strong> {COMPONENT_MAPPING.userStories.join(', ')}
              </div>
              <div>
                <strong>Hypotheses:</strong> {COMPONENT_MAPPING.hypotheses.join(', ')}
              </div>
              <div>
                <strong>Test Cases:</strong> {COMPONENT_MAPPING.testCases.join(', ')}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
