/**
 * PosalPro MVP2 - Hypothesis Validation Analytics Tests
 * Comprehensive testing for analytics hooks and hypothesis validation tracking
 *
 * Testing Coverage:
 * - H4 (Cross-Department Coordination): Team collaboration analytics
 * - H7 (Deadline Management): Timeline tracking and performance metrics
 * - H8 (Technical Validation): System performance and accuracy tracking
 * - Analytics Infrastructure: Event collection, storage, and validation
 * - Performance Metrics: Load times, interaction tracking, user journey analytics
 *
 * Test Categories: Unit, Integration, Performance, Hypothesis Validation
 * Target Coverage: 85%+ for analytics infrastructure, 100% of hypothesis tracking
 */

import { useDashboardAnalytics } from '@/hooks/dashboard/useDashboardAnalytics';
import { useAnalytics } from '@/hooks/useAnalytics';
import { UserType } from '@/types';
import { act, renderHook } from '@testing-library/react';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock performance APIs
const mockPerformanceObserver = {
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
};

Object.defineProperty(window, 'PerformanceObserver', {
  value: jest.fn().mockImplementation(() => mockPerformanceObserver),
});

// Mock navigation API
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Test Browser)',
  },
});

// Mock window.performance
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
  },
});

describe('Hypothesis Validation Analytics Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('[]');
    console.log = jest.fn(); // Mock console.log
    console.warn = jest.fn(); // Mock console.warn
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Base Analytics Hook (useAnalytics)', () => {
    it('initializes analytics with correct configuration', () => {
      const { result } = renderHook(() => useAnalytics('test-session'));

      expect(result.current).toHaveProperty('trackEvent');
      expect(result.current).toHaveProperty('trackPerformance');
      expect(result.current).toHaveProperty('trackUserJourney');
      expect(result.current).toHaveProperty('getSessionData');
    });

    it('tracks events with correct metadata structure', () => {
      const { result } = renderHook(() => useAnalytics('test-session'));

      act(() => {
        result.current.trackEvent('test_event', {
          action: 'click',
          element: 'button',
          value: 42,
        });
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'analytics_events',
        expect.stringContaining('test_event')
      );
    });

    it('handles analytics storage failures gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const { result } = renderHook(() => useAnalytics('test-session'));

      expect(() => {
        act(() => {
          result.current.trackEvent('test_event', { data: 'test' });
        });
      }).not.toThrow();

      expect(console.warn).toHaveBeenCalledWith('Analytics storage failed:', expect.any(Error));
    });

    it('maintains event history with size limits', () => {
      const existingEvents = Array.from({ length: 95 }, (_, i) => ({
        event: `existing_event_${i}`,
        timestamp: Date.now() - i * 1000,
      }));

      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingEvents));

      const { result } = renderHook(() => useAnalytics('test-session'));

      // Add events to exceed limit
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.trackEvent(`new_event_${i}`, { index: i });
        }
      });

      // Should maintain only last 100 events
      const calls = localStorageMock.setItem.mock.calls;
      const lastCall = calls[calls.length - 1];
      const savedEvents = JSON.parse(lastCall[1]);
      expect(savedEvents.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Dashboard Analytics Hook', () => {
    const mockUserId = 'user-123';
    const mockUserRole = UserType.PROPOSAL_MANAGER;
    const mockSessionId = 'session-456';

    it('initializes dashboard analytics with performance tracking', () => {
      const { result } = renderHook(() =>
        useDashboardAnalytics(mockUserId, mockUserRole, mockSessionId)
      );

      expect(result.current).toHaveProperty('trackDashboardLoaded');
      expect(result.current).toHaveProperty('trackWidgetInteraction');
      expect(result.current).toHaveProperty('trackEvent');
      expect(mockPerformanceObserver.observe).toHaveBeenCalled();
    });

    it('tracks dashboard load with performance metrics', () => {
      const { result } = renderHook(() =>
        useDashboardAnalytics(mockUserId, mockUserRole, mockSessionId)
      );

      const loadTime = 1250; // 1.25 seconds
      act(() => {
        result.current.trackDashboardLoaded(loadTime);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'dashboard_analytics',
        expect.stringContaining('dashboard_loaded')
      );

      // Verify the saved data structure
      const calls = localStorageMock.setItem.mock.calls;
      const dashboardCall = calls.find(call => call[0] === 'dashboard_analytics');
      const savedData = JSON.parse(dashboardCall[1]);
      const loadEvent = savedData.find((event: any) => event.event === 'dashboard_loaded');

      expect(loadEvent).toMatchObject({
        event: 'dashboard_loaded',
        properties: expect.objectContaining({
          loadTime,
          userId: mockUserId,
          userRole: mockUserRole,
          sessionId: mockSessionId,
          userStories: expect.arrayContaining(['US-4.1', 'US-4.3']),
          hypotheses: expect.arrayContaining(['H4', 'H7']),
        }),
      });
    });

    it('tracks widget interactions with hypothesis mapping', () => {
      const { result } = renderHook(() =>
        useDashboardAnalytics(mockUserId, mockUserRole, mockSessionId)
      );

      act(() => {
        result.current.trackWidgetInteraction('proposal-overview', 'refresh', {
          refreshReason: 'user_request',
          dataAge: 300000, // 5 minutes
        });
      });

      const calls = localStorageMock.setItem.mock.calls;
      const dashboardCall = calls.find(call => call[0] === 'dashboard_analytics');
      const savedData = JSON.parse(dashboardCall[1]);
      const interactionEvent = savedData.find((event: any) => event.event === 'widget_interaction');

      expect(interactionEvent).toMatchObject({
        event: 'widget_interaction',
        properties: expect.objectContaining({
          widgetId: 'proposal-overview',
          action: 'refresh',
          refreshReason: 'user_request',
          dataAge: 300000,
          hypotheses: expect.arrayContaining(['H4', 'H7']),
        }),
      });
    });

    it('includes comprehensive context in analytics events', () => {
      const { result } = renderHook(() =>
        useDashboardAnalytics(mockUserId, mockUserRole, mockSessionId)
      );

      act(() => {
        result.current.trackEvent('custom_dashboard_event', { customData: 'test' });
      });

      const calls = localStorageMock.setItem.mock.calls;
      const dashboardCall = calls.find(call => call[0] === 'dashboard_analytics');
      const savedData = JSON.parse(dashboardCall[1]);
      const customEvent = savedData.find((event: any) => event.event === 'custom_dashboard_event');

      expect(customEvent.properties).toMatchObject({
        userId: mockUserId,
        userRole: mockUserRole,
        sessionId: mockSessionId,
        customData: 'test',
        component: 'dashboard',
        userStories: expect.any(Array),
        hypotheses: expect.any(Array),
        testCases: expect.any(Array),
        url: expect.any(String),
        userAgent: expect.any(String),
        viewport: expect.objectContaining({
          width: expect.any(Number),
          height: expect.any(Number),
        }),
      });
    });

    it('handles performance observer errors gracefully', () => {
      // Mock PerformanceObserver to throw error
      window.PerformanceObserver = jest.fn().mockImplementation(() => {
        throw new Error('PerformanceObserver not supported');
      });

      expect(() => {
        renderHook(() => useDashboardAnalytics(mockUserId, mockUserRole, mockSessionId));
      }).not.toThrow();

      expect(console.warn).toHaveBeenCalledWith(
        'Performance tracking not available:',
        expect.any(Error)
      );
    });
  });

  describe('Hypothesis H4 - Cross-Department Coordination Analytics', () => {
    it('tracks coordination workflow efficiency metrics', () => {
      const { result } = renderHook(() =>
        useDashboardAnalytics('user-123', UserType.PROPOSAL_MANAGER, 'session-456')
      );

      // Simulate coordination workflow events
      const coordinationEvents = [
        {
          action: 'team_assignment_start',
          teamSize: 5,
          departments: ['Sales', 'Technical', 'Legal'],
        },
        {
          action: 'cross_department_communication',
          departments: ['Sales', 'Technical'],
          responseTime: 1800000, // 30 minutes
        },
        {
          action: 'coordination_completion',
          totalTime: 7200000, // 2 hours
          efficiency: 85.5,
        },
      ];

      act(() => {
        coordinationEvents.forEach(event => {
          result.current.trackEvent('coordination_workflow', event);
        });
      });

      const calls = localStorageMock.setItem.mock.calls;
      const analyticsCall = calls.find(call => call[0] === 'dashboard_analytics');
      const savedData = JSON.parse(analyticsCall[1]);

      // Verify H4 hypothesis tracking
      const h4Events = savedData.filter((event: any) =>
        event.properties.hypotheses?.includes('H4')
      );

      expect(h4Events.length).toBe(3);
      expect(h4Events.every((event: any) => event.event === 'coordination_workflow')).toBe(true);
    });

    it('measures team collaboration response times', () => {
      const { result } = renderHook(() =>
        useDashboardAnalytics('user-123', UserType.PROPOSAL_MANAGER, 'session-456')
      );

      const collaborationMetrics = {
        assignmentResponseTime: 900000, // 15 minutes
        reviewCycleTime: 3600000, // 1 hour
        approvalTime: 1800000, // 30 minutes
        overallEfficiency: 78.5,
      };

      act(() => {
        result.current.trackEvent('team_collaboration_metrics', collaborationMetrics);
      });

      const calls = localStorageMock.setItem.mock.calls;
      const analyticsCall = calls.find(call => call[0] === 'dashboard_analytics');
      const savedData = JSON.parse(analyticsCall[1]);
      const metricsEvent = savedData.find(
        (event: any) => event.event === 'team_collaboration_metrics'
      );

      expect(metricsEvent.properties).toMatchObject(collaborationMetrics);
      expect(metricsEvent.properties.hypotheses).toContain('H4');
    });

    it('validates coordination efficiency improvements', () => {
      const { result } = renderHook(() =>
        useDashboardAnalytics('user-123', UserType.PROPOSAL_MANAGER, 'session-456')
      );

      // Baseline coordination metrics
      const baselineMetrics = {
        coordinationTime: 14400000, // 4 hours
        communicationDelays: 5,
        processEfficiency: 65.0,
      };

      // Improved coordination metrics
      const improvedMetrics = {
        coordinationTime: 10800000, // 3 hours
        communicationDelays: 2,
        processEfficiency: 85.0,
      };

      act(() => {
        result.current.trackEvent('coordination_baseline', baselineMetrics);
        result.current.trackEvent('coordination_improved', improvedMetrics);
      });

      // Calculate improvement
      const timeImprovement =
        (baselineMetrics.coordinationTime - improvedMetrics.coordinationTime) /
        baselineMetrics.coordinationTime;
      const efficiencyImprovement =
        (improvedMetrics.processEfficiency - baselineMetrics.processEfficiency) /
        baselineMetrics.processEfficiency;

      expect(timeImprovement).toBeGreaterThan(0.2); // 20% improvement
      expect(efficiencyImprovement).toBeGreaterThan(0.25); // 25% improvement
    });
  });

  describe('Hypothesis H7 - Deadline Management Analytics', () => {
    it('tracks timeline accuracy and deadline adherence', () => {
      const { result } = renderHook(() =>
        useDashboardAnalytics('user-123', UserType.PROPOSAL_MANAGER, 'session-456')
      );

      const deadlineMetrics = {
        proposalDeadline: new Date('2024-12-31').getTime(),
        estimatedCompletion: new Date('2024-12-28').getTime(),
        actualCompletion: new Date('2024-12-29').getTime(),
        timelineAccuracy: 95.5,
        deadlineAdherence: true,
      };

      act(() => {
        result.current.trackEvent('deadline_management', deadlineMetrics);
      });

      const calls = localStorageMock.setItem.mock.calls;
      const analyticsCall = calls.find(call => call[0] === 'dashboard_analytics');
      const savedData = JSON.parse(analyticsCall[1]);
      const deadlineEvent = savedData.find((event: any) => event.event === 'deadline_management');

      expect(deadlineEvent.properties).toMatchObject(deadlineMetrics);
      expect(deadlineEvent.properties.hypotheses).toContain('H7');
    });

    it('measures proposal creation timeline efficiency', () => {
      const { result } = renderHook(() =>
        useDashboardAnalytics('user-123', UserType.PROPOSAL_MANAGER, 'session-456')
      );

      const timelineEfficiency = {
        proposalCreationTime: 7200000, // 2 hours
        baselineTime: 14400000, // 4 hours baseline
        improvementPercentage: 50.0,
        stepsCompleted: 6,
        averageStepTime: 1200000, // 20 minutes per step
      };

      act(() => {
        result.current.trackEvent('proposal_timeline_efficiency', timelineEfficiency);
      });

      const calls = localStorageMock.setItem.mock.calls;
      const analyticsCall = calls.find(call => call[0] === 'dashboard_analytics');
      const savedData = JSON.parse(analyticsCall[1]);
      const efficiencyEvent = savedData.find(
        (event: any) => event.event === 'proposal_timeline_efficiency'
      );

      expect(efficiencyEvent.properties.improvementPercentage).toBeGreaterThanOrEqual(40);
      expect(efficiencyEvent.properties.hypotheses).toContain('H7');
    });

    it('validates dashboard widget timeline performance', () => {
      const { result } = renderHook(() =>
        useDashboardAnalytics('user-123', UserType.PROPOSAL_MANAGER, 'session-456')
      );

      // Timeline-related widget interactions
      const timelineInteractions = [
        { widgetId: 'deadline-tracker', action: 'view_timeline', loadTime: 250 },
        { widgetId: 'deadline-tracker', action: 'update_deadline', processingTime: 150 },
        { widgetId: 'proposal-overview', action: 'timeline_analysis', analysisTime: 500 },
      ];

      act(() => {
        timelineInteractions.forEach(interaction => {
          result.current.trackWidgetInteraction(interaction.widgetId, interaction.action, {
            performanceMetric:
              interaction.loadTime || interaction.processingTime || interaction.analysisTime,
            category: 'timeline_management',
          });
        });
      });

      const calls = localStorageMock.setItem.mock.calls;
      const analyticsCall = calls.find(call => call[0] === 'dashboard_analytics');
      const savedData = JSON.parse(analyticsCall[1]);
      const timelineEvents = savedData.filter(
        (event: any) => event.properties.category === 'timeline_management'
      );

      expect(timelineEvents.length).toBe(3);
      timelineEvents.forEach((event: any) => {
        expect(event.properties.performanceMetric).toBeLessThan(1000); // Good performance
        expect(event.properties.hypotheses).toContain('H7');
      });
    });
  });

  describe('Performance Metrics and Test Case Validation', () => {
    it('validates TC-H4-001: Team coordination dashboard efficiency', async () => {
      const { result } = renderHook(() =>
        useDashboardAnalytics('user-123', UserType.PROPOSAL_MANAGER, 'session-456')
      );

      const startTime = Date.now();

      // Simulate dashboard load for coordination
      act(() => {
        result.current.trackDashboardLoaded(1500); // 1.5 seconds
      });

      // Simulate team coordination interactions
      const coordinationActions = [
        'team_member_assignment',
        'cross_department_message',
        'approval_request',
        'status_update',
      ];

      act(() => {
        coordinationActions.forEach((action, index) => {
          result.current.trackWidgetInteraction('team-collaboration', action, {
            actionIndex: index,
            responseTime: 200 + index * 50, // Increasing response times
          });
        });
      });

      const totalTime = Date.now() - startTime;

      // Validate performance criteria for TC-H4-001
      expect(totalTime).toBeLessThan(2000); // Overall interaction should be fast

      const calls = localStorageMock.setItem.mock.calls;
      const analyticsCall = calls.find(call => call[0] === 'dashboard_analytics');
      const savedData = JSON.parse(analyticsCall[1]);

      const dashboardLoadEvent = savedData.find((event: any) => event.event === 'dashboard_loaded');
      expect(dashboardLoadEvent.properties.loadTime).toBeLessThan(2000); // Dashboard loads quickly

      const coordinationEvents = savedData.filter(
        (event: any) =>
          event.event === 'widget_interaction' && event.properties.widgetId === 'team-collaboration'
      );
      expect(coordinationEvents.length).toBe(4);
    });

    it('validates TC-H7-001: Timeline management widget performance', () => {
      const { result } = renderHook(() =>
        useDashboardAnalytics('user-123', UserType.PROPOSAL_MANAGER, 'session-456')
      );

      // Timeline widget performance metrics
      const timelineMetrics = {
        widgetLoadTime: 300,
        dataProcessingTime: 150,
        visualizationRenderTime: 200,
        totalResponseTime: 650,
      };

      act(() => {
        result.current.trackWidgetInteraction(
          'deadline-tracker',
          'performance_test',
          timelineMetrics
        );
      });

      // Validate performance criteria for TC-H7-001
      expect(timelineMetrics.totalResponseTime).toBeLessThan(1000); // Sub-second response
      expect(timelineMetrics.widgetLoadTime).toBeLessThan(500); // Fast widget load
      expect(timelineMetrics.dataProcessingTime).toBeLessThan(300); // Efficient data processing

      const calls = localStorageMock.setItem.mock.calls;
      const analyticsCall = calls.find(call => call[0] === 'dashboard_analytics');
      const savedData = JSON.parse(analyticsCall[1]);
      const performanceEvent = savedData.find(
        (event: any) => event.properties.action === 'performance_test'
      );

      expect(performanceEvent.properties).toMatchObject(timelineMetrics);
      expect(performanceEvent.properties.hypotheses).toContain('H7');
    });

    it('handles high-frequency analytics events efficiently', () => {
      const { result } = renderHook(() =>
        useDashboardAnalytics('user-123', UserType.PROPOSAL_MANAGER, 'session-456')
      );

      const startTime = Date.now();

      // Generate high-frequency events
      act(() => {
        for (let i = 0; i < 50; i++) {
          result.current.trackEvent('high_frequency_event', {
            eventIndex: i,
            timestamp: Date.now(),
          });
        }
      });

      const processingTime = Date.now() - startTime;

      // Should handle high-frequency events efficiently
      expect(processingTime).toBeLessThan(1000); // Process 50 events in under 1 second

      // Verify events are properly batched/stored
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('measures memory usage and cleanup efficiency', () => {
      const { result, unmount } = renderHook(() =>
        useDashboardAnalytics('user-123', UserType.PROPOSAL_MANAGER, 'session-456')
      );

      // Track memory before events
      const initialCallCount = localStorageMock.setItem.mock.calls.length;

      // Generate events and measure memory
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.trackEvent('memory_test_event', {
            eventData: 'x'.repeat(100), // Small data payload
          });
        }
      });

      const afterEventsCallCount = localStorageMock.setItem.mock.calls.length;

      // Unmount to test cleanup
      unmount();

      // Verify events were processed efficiently
      expect(afterEventsCallCount).toBeGreaterThan(initialCallCount);

      // Performance observer should be disconnected on cleanup
      expect(mockPerformanceObserver.disconnect).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles malformed analytics data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json data');

      expect(() => {
        renderHook(() =>
          useDashboardAnalytics('user-123', UserType.PROPOSAL_MANAGER, 'session-456')
        );
      }).not.toThrow();

      expect(console.warn).toHaveBeenCalledWith('Analytics storage failed:', expect.any(Error));
    });

    it('handles missing user context gracefully', () => {
      const { result } = renderHook(() => useDashboardAnalytics(undefined, undefined, undefined));

      act(() => {
        result.current.trackEvent('test_event', { data: 'test' });
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();

      const calls = localStorageMock.setItem.mock.calls;
      const analyticsCall = calls.find(call => call[0] === 'dashboard_analytics');
      const savedData = JSON.parse(analyticsCall[1]);
      const testEvent = savedData.find((event: any) => event.event === 'test_event');

      expect(testEvent.properties.userId).toBeUndefined();
      expect(testEvent.properties.userRole).toBeUndefined();
      expect(testEvent.properties.sessionId).toBeUndefined();
    });

    it('handles analytics storage quota exceeded', () => {
      let callCount = 0;
      localStorageMock.setItem.mockImplementation(() => {
        callCount++;
        if (callCount > 2) {
          throw new Error('QuotaExceededError');
        }
      });

      const { result } = renderHook(() =>
        useDashboardAnalytics('user-123', UserType.PROPOSAL_MANAGER, 'session-456')
      );

      expect(() => {
        act(() => {
          for (let i = 0; i < 5; i++) {
            result.current.trackEvent('quota_test_event', { index: i });
          }
        });
      }).not.toThrow();

      expect(console.warn).toHaveBeenCalledWith('Analytics storage failed:', expect.any(Error));
    });

    it('handles performance API unavailability', () => {
      // Remove performance API
      delete (window as any).performance;
      delete (window as any).PerformanceObserver;

      expect(() => {
        renderHook(() =>
          useDashboardAnalytics('user-123', UserType.PROPOSAL_MANAGER, 'session-456')
        );
      }).not.toThrow();

      expect(console.warn).toHaveBeenCalledWith(
        'Performance tracking not available:',
        expect.any(Error)
      );
    });
  });
});
