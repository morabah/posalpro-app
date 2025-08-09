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
  PlusIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useEffect, useRef, useState } from 'react';

// Simple toast function to replace react-hot-toast
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  console.log(`Toast (${type}):`, message);
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
}

export function CommunicationCenter({
  proposalId,
  currentUserId,
  onMessageSent,
  onTaskCreated,
  className = '',
  isCompact = false,
}: CommunicationCenterProps) {
  // Initialize services
  const errorHandlingService = ErrorHandlingService.getInstance();
  const { handleAsyncError } = useErrorHandler();
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const { collectMetrics } = usePerformanceOptimization();

  // State management
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [participants, setParticipants] = useState<CommunicationParticipant[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<'message' | 'task'>('message');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>(
    'normal'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showClientInsights, setShowClientInsights] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'mentions' | 'tasks'>('all');

  // Refs for scroll management
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Component Traceability Matrix analytics
  const trackCommunicationMetrics = useCallback(
    (action: string, metadata?: Record<string, any>) => {
      try {
        analytics('communication_center_interaction', {
          component: 'CommunicationCenter',
          action: 'filter_applied',
          filterType: activeFilter,
          proposalId,
          userStory: 'US-2.2',
          acceptanceCriteria: ['AC-2.2.3'],
          hypothesis: 'H4',
          targetReduction: 0.4, // 40% coordination effort reduction
          timestamp: Date.now(),
          ...metadata,
        });
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

  // Load communication data
  const loadCommunicationData = useCallback(async () => {
    setIsLoading(true);
    const startTime = Date.now();

    try {
      const [messagesRes, participantsRes] = await Promise.all([
        apiClient.get<{ success: boolean; data: CommunicationMessage[] }>(
          `/communications?proposalId=${encodeURIComponent(proposalId)}`
        ),
        apiClient.get<{ success: boolean; data: CommunicationParticipant[] }>(
          `/communications/participants?proposalId=${encodeURIComponent(proposalId)}`
        ),
      ]);

      // Normalize date fields from API (strings) → Date objects
      const normalizedMessages: CommunicationMessage[] = (((messagesRes as any)?.data ?? []) as any[]).map(
        (m: any) => ({
          ...m,
          timestamp: m?.timestamp ? new Date(m.timestamp) : new Date(),
          actionItems: Array.isArray(m?.actionItems)
            ? m.actionItems.map((ai: any) => ({
                ...ai,
                dueDate: ai?.dueDate ? new Date(ai.dueDate) : undefined,
              }))
            : m?.actionItems,
        })
      );

      const normalizedParticipants: CommunicationParticipant[] = (((participantsRes as any)?.data ?? []) as any[]).map(
        (p: any) => ({
          ...p,
          lastActive: p?.lastActive ? new Date(p.lastActive) : new Date(),
        })
      );

      setMessages(normalizedMessages);
      setParticipants(normalizedParticipants);

      const loadTime = Date.now() - startTime;
      trackCommunicationMetrics('data_loaded', {
        messageCount: ((messagesRes as any)?.data ?? []).length,
        participantCount: ((participantsRes as any)?.data ?? []).length,
        loadTime,
      });
    } catch (error) {
      const standardError = handleAsyncError(error, 'Failed to load communication data', {
        proposalId,
        component: 'CommunicationCenter',
        operation: 'loadCommunicationData',
      });

      showToast(errorHandlingService.getUserFriendlyMessage(standardError), 'error');

      trackCommunicationMetrics('data_load_error', {
        error: standardError.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [proposalId, trackCommunicationMetrics, handleAsyncError, errorHandlingService]);

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
  const getPriorityColor = (priority: string) => {
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

  // Load data on mount
  useEffect(() => {
    loadCommunicationData();

    // Track component mount
    trackCommunicationMetrics('component_mounted', {
      proposalId,
      isCompact,
    });
  }, [loadCommunicationData, trackCommunicationMetrics, proposalId, isCompact]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Render compact view for coordination hub
  if (isCompact) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-900">Communication Center</h3>
            {messages.filter(m => !m.isRead).length > 0 && (
              <Badge className="bg-red-100 text-red-800">
                {messages.filter(m => !m.isRead).length} unread
              </Badge>
            )}
          </div>
          <div className="flex space-x-1">
            <Button size="sm" onClick={() => setMessageType('message')}>
              <PlusIcon className="h-3 w-3 mr-1" />
              Message
            </Button>
            <Button size="sm" variant="outline" onClick={() => setMessageType('task')}>
              <PlusIcon className="h-3 w-3 mr-1" />
              Task
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <LoadingSpinner size="sm" />
          </div>
        ) : (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {messages.slice(0, 3).map(message => (
              <div
                key={message.id}
                className="p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium text-gray-900">{message.from.name}</span>
                      <Badge size="sm" className={getPriorityColor(message.priority)}>
                        {message.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 truncate">{message.content}</p>
                  </div>
                  <span className="text-xs text-gray-400 ml-2">
                    {formatRelativeTime(message.timestamp)}
                  </span>
                </div>
              </div>
            ))}
            {messages.length > 3 && (
              <Button variant="outline" size="sm" className="w-full text-xs">
                View All Communications ({messages.length})
              </Button>
            )}
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
    );
  }

  // Full view implementation
  return (
    <div className={`space-y-6 ${className}`}>
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Communication Center</h2>
            <p className="text-sm text-gray-500">Centralized coordination and client insights</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`p-4 rounded-lg border ${
                  !message.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <Avatar name={message.from.name} size="sm" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{message.from.name}</span>
                        <Badge size="sm" variant="secondary">
                          {message.from.role}
                        </Badge>
                        <Badge size="sm" className={getPriorityColor(message.priority)}>
                          {message.priority}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="ml-11">
                  <p className="text-gray-700 mb-2">{message.content}</p>

                  {/* Tags */}
                  {message.tags && message.tags.length > 0 && (
                    <div className="flex items-center space-x-2 mb-2">
                      <TagIcon className="h-3 w-3 text-gray-400" />
                      <div className="flex space-x-1">
                        {message.tags.map(tag => (
                          <Badge key={tag} size="sm" variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Client Insights */}
                  {showClientInsights &&
                    message.clientInsights &&
                    message.clientInsights.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-2">
                        <h5 className="text-sm font-medium text-blue-800 mb-2">Client Insights:</h5>
                        <div className="space-y-2">
                          {message.clientInsights.map(insight => (
                            <div key={insight.id}>
                              <div className="flex items-center justify-between mb-1">
                                <Badge size="sm" className="bg-blue-100 text-blue-800">
                                  {insight.type}
                                </Badge>
                                <span className="text-xs text-blue-600">
                                  {Math.round(insight.confidence * 100)}% confidence
                                </span>
                              </div>
                              <p className="text-sm text-blue-700">{insight.content}</p>
                              {insight.suggestedActions.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-blue-800">
                                    Suggested Actions:
                                  </p>
                                  <ul className="text-xs text-blue-700 ml-4 list-disc">
                                    {insight.suggestedActions.map((action, idx) => (
                                      <li key={idx}>{action}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Message Composer */}
        <div className="mt-6 p-4 border rounded-lg bg-gray-50">
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
                onChange={e => setSelectedPriority(e.target.value as any)}
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
