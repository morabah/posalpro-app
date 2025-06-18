/**
 * PosalPro MVP2 - Dashboard Layout Hook
 * Comprehensive dashboard layout management with responsive grid, widget positioning, and user customization
 * Based on DASHBOARD_SCREEN.md wireframe specifications
 */

import type {
  DashboardLayout,
  DashboardSettings,
  DashboardWidget,
  GridPosition,
} from '@/lib/dashboard/types';
import { UserType } from '@/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDashboardAnalytics } from './useDashboardAnalytics';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-4.3', 'US-2.3'],
  acceptanceCriteria: [
    'AC-4.1.1', // Timeline visualization layout
    'AC-4.3.1', // Priority visualization layout
    'AC-2.3.1', // Role-based layout customization
  ],
  methods: [
    'manageGridLayout()',
    'handleResponsiveBreakpoints()',
    'persistLayoutChanges()',
    'optimizeWidgetPositioning()',
    'trackLayoutInteractions()',
  ],
  hypotheses: ['H7', 'H4', 'H8'],
  testCases: ['TC-H7-001', 'TC-H4-001', 'TC-LAYOUT-001'],
};

// Layout configuration and breakpoints
const LAYOUT_CONFIG = {
  breakpoints: {
    lg: 1200,
    md: 996,
    sm: 768,
    xs: 480,
    xxs: 0,
  },
  cols: {
    lg: 12,
    md: 10,
    sm: 6,
    xs: 4,
    xxs: 2,
  },
  rowHeight: 100,
  margin: [16, 16] as [number, number],
  containerPadding: [20, 20] as [number, number],
  compactType: 'vertical' as const,
};

// Widget size presets
const WIDGET_SIZE_PRESETS = {
  small: { w: 3, h: 2 },
  medium: { w: 6, h: 3 },
  large: { w: 9, h: 4 },
  full: { w: 12, h: 4 },
  compact: { w: 2, h: 1 },
  tall: { w: 4, h: 6 },
};

// Hook options interface
interface UseDashboardLayoutOptions {
  userId?: string;
  userRole?: UserType;
  enablePersistence?: boolean;
  enableResponsive?: boolean;
  enableDragDrop?: boolean;
  enableResize?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
  onLayoutChange?: (layout: DashboardLayout) => void;
  onWidgetResize?: (widgetId: string, size: { w: number; h: number }) => void;
  onWidgetMove?: (widgetId: string, position: { x: number; y: number }) => void;
}

// Layout state interface
interface LayoutState {
  layout: DashboardLayout;
  activeBreakpoint: keyof typeof LAYOUT_CONFIG.breakpoints;
  layouts: Record<string, GridPosition[]>; // layouts for different breakpoints
  isResizing: boolean;
  isDragging: boolean;
  draggedWidget: string | null;
  resizedWidget: string | null;
  unsavedChanges: boolean;
  settings: DashboardSettings;
}

// Layout actions
interface LayoutActions {
  updateLayout: (newLayout: Partial<DashboardLayout>) => void;
  updateGridPositions: (positions: GridPosition[]) => void;
  addWidget: (widget: DashboardWidget, position?: Partial<GridPosition>) => void;
  removeWidget: (widgetId: string) => void;
  resizeWidget: (widgetId: string, size: { w: number; h: number }) => void;
  moveWidget: (widgetId: string, position: { x: number; y: number }) => void;
  toggleWidget: (widgetId: string, visible?: boolean) => void;
  resetLayout: () => void;
  saveLayout: () => Promise<boolean>;
  loadLayout: () => Promise<boolean>;
  exportLayout: () => string;
  importLayout: (layoutData: string) => boolean;
}

// Hook return interface
export interface UseDashboardLayoutReturn extends LayoutActions {
  // Layout state
  layout: DashboardLayout;
  layouts: Record<string, GridPosition[]>;
  activeBreakpoint: string;
  isModified: boolean;

  // Widget management
  availableWidgets: DashboardWidget[];
  visibleWidgets: DashboardWidget[];
  hiddenWidgets: DashboardWidget[];

  // Layout settings
  settings: DashboardSettings;
  updateSettings: (newSettings: Partial<DashboardSettings>) => void;

  // Responsive handling
  containerWidth: number;
  updateContainerWidth: (width: number) => void;

  // State indicators
  isResizing: boolean;
  isDragging: boolean;
  hasUnsavedChanges: boolean;
}

/**
 * Comprehensive dashboard layout management hook
 */
export function useDashboardLayout(
  widgets: DashboardWidget[] = [],
  initialOptions: UseDashboardLayoutOptions = {}
): UseDashboardLayoutReturn {
  const options = {
    enablePersistence: true,
    enableResponsive: true,
    enableDragDrop: true,
    enableResize: true,
    autoSave: true,
    autoSaveDelay: 2000,
    ...initialOptions,
  };

  // State management
  const [state, setState] = useState<LayoutState>({
    layout: {
      grid: [],
      sidebarOpen: true,
      theme: 'light',
      density: 'comfortable',
    },
    activeBreakpoint: 'lg',
    layouts: {},
    isResizing: false,
    isDragging: false,
    draggedWidget: null,
    resizedWidget: null,
    unsavedChanges: false,
    settings: {
      autoRefresh: true,
      refreshInterval: 300000,
      notifications: {
        desktop: true,
        email: false,
        types: ['high', 'critical'],
      },
      accessibility: {
        highContrast: false,
        largeText: false,
        reducedMotion: false,
        screenReader: false,
      },
      privacy: {
        analytics: true,
        activityTracking: true,
      },
    },
  });

  const [containerWidth, setContainerWidth] = useState(1200);

  // Analytics integration
  const { trackEvent, trackInteraction } = useDashboardAnalytics(
    options.userId || 'unknown',
    options.userRole || 'unknown',
    `layout-${Date.now()}`
  );

  // Refs for auto-save and performance
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const layoutCacheRef = useRef<string>('');
  const mountedRef = useRef(true);

  // Generate layout storage key
  const getLayoutStorageKey = useCallback(() => {
    return `dashboard_layout_${options.userId || 'default'}_${options.userRole || 'user'}`;
  }, [options.userId, options.userRole]);

  // Generate default layout for role
  const generateDefaultLayout = useCallback((): GridPosition[] => {
    const roleBasedDefaults: Partial<Record<UserType, GridPosition[]>> = {
      [UserType.PROPOSAL_MANAGER]: [
        { id: 'proposals-overview', x: 0, y: 0, w: 6, h: 3 },
        { id: 'deadlines', x: 6, y: 0, w: 6, h: 3 },
        { id: 'team-status', x: 0, y: 3, w: 4, h: 3 },
        { id: 'recent-activity', x: 4, y: 3, w: 8, h: 3 },
        { id: 'performance-metrics', x: 0, y: 6, w: 12, h: 2 },
      ],
      [UserType.SME]: [
        { id: 'assignments', x: 0, y: 0, w: 8, h: 4 },
        { id: 'content-library', x: 8, y: 0, w: 4, h: 4 },
        { id: 'recent-contributions', x: 0, y: 4, w: 12, h: 2 },
      ],
      [UserType.EXECUTIVE]: [
        { id: 'portfolio-overview', x: 0, y: 0, w: 12, h: 3 },
        { id: 'revenue-metrics', x: 0, y: 3, w: 6, h: 3 },
        { id: 'team-performance', x: 6, y: 3, w: 6, h: 3 },
        { id: 'strategic-initiatives', x: 0, y: 6, w: 12, h: 2 },
      ],
      [UserType.SYSTEM_ADMINISTRATOR]: [
        { id: 'system-health', x: 0, y: 0, w: 4, h: 3 },
        { id: 'user-activity', x: 4, y: 0, w: 4, h: 3 },
        { id: 'security-alerts', x: 8, y: 0, w: 4, h: 3 },
        { id: 'performance-monitoring', x: 0, y: 3, w: 12, h: 2 },
      ],
      [UserType.CONTENT_MANAGER]: [
        { id: 'content-overview', x: 0, y: 0, w: 8, h: 3 },
        { id: 'recent-updates', x: 8, y: 0, w: 4, h: 3 },
        { id: 'content-metrics', x: 0, y: 3, w: 12, h: 2 },
      ],
    };

    return roleBasedDefaults[options.userRole || UserType.PROPOSAL_MANAGER] || [];
  }, [options.userRole]);

  // Calculate current breakpoint
  const getCurrentBreakpoint = useCallback(
    (width: number): keyof typeof LAYOUT_CONFIG.breakpoints => {
      const breakpoints = LAYOUT_CONFIG.breakpoints;
      if (width >= breakpoints.lg) return 'lg';
      if (width >= breakpoints.md) return 'md';
      if (width >= breakpoints.sm) return 'sm';
      if (width >= breakpoints.xs) return 'xs';
      return 'xxs';
    },
    []
  );

  // Update container width and breakpoint
  const updateContainerWidth = useCallback(
    (width: number) => {
      const newBreakpoint = getCurrentBreakpoint(width);
      const oldBreakpoint = state.activeBreakpoint;

      setContainerWidth(width);

      if (newBreakpoint !== oldBreakpoint) {
        setState(prev => ({
          ...prev,
          activeBreakpoint: newBreakpoint,
        }));

        // Track responsive breakpoint change
        trackEvent('layout_breakpoint_change', {
          from: oldBreakpoint,
          to: newBreakpoint,
          width,
          userRole: options.userRole,
        });
      }
    },
    [state.activeBreakpoint, getCurrentBreakpoint, trackEvent, options.userRole]
  );

  // Update layout
  const updateLayout = useCallback(
    (newLayout: Partial<DashboardLayout>) => {
      setState(prev => ({
        ...prev,
        layout: { ...prev.layout, ...newLayout },
        unsavedChanges: true,
      }));

      // Track layout customization
      trackInteraction('layout', 'customize', { success: true });

      // Trigger auto-save
      if (options.autoSave && options.autoSaveDelay) {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
        autoSaveTimeoutRef.current = setTimeout(() => {
          // saveLayout will be called here - no direct dependency needed
        }, options.autoSaveDelay);
      }

      // Notify callback
      options.onLayoutChange?.(state.layout);
    },
    [state.layout, options, trackInteraction]
  );

  // Update grid positions
  const updateGridPositions = useCallback(
    (positions: GridPosition[]) => {
      setState(prev => ({
        ...prev,
        layout: {
          ...prev.layout,
          grid: positions,
        },
        layouts: {
          ...prev.layouts,
          [prev.activeBreakpoint]: positions,
        },
        unsavedChanges: true,
      }));

      trackEvent('layout_grid_update', {
        positionCount: positions.length,
        breakpoint: state.activeBreakpoint,
        userRole: options.userRole,
      });
    },
    [state.activeBreakpoint, trackEvent, options.userRole]
  );

  // Add widget to layout
  const addWidget = useCallback(
    (widget: DashboardWidget, position?: Partial<GridPosition>) => {
      const newPosition: GridPosition = {
        id: widget.id,
        x: position?.x ?? 0,
        y: position?.y ?? 0,
        w: position?.w ?? WIDGET_SIZE_PRESETS[widget.size]?.w ?? 6,
        h: position?.h ?? WIDGET_SIZE_PRESETS[widget.size]?.h ?? 3,
      };

      setState(prev => ({
        ...prev,
        layout: {
          ...prev.layout,
          grid: [...prev.layout.grid, newPosition],
        },
        unsavedChanges: true,
      }));

      trackEvent('widget_added', {
        widgetId: widget.id,
        widgetType: widget.component.name,
        position: newPosition,
        userRole: options.userRole,
      });
    },
    [trackEvent, options.userRole]
  );

  // Remove widget from layout
  const removeWidget = useCallback(
    (widgetId: string) => {
      setState(prev => ({
        ...prev,
        layout: {
          ...prev.layout,
          grid: prev.layout.grid.filter(pos => pos.id !== widgetId),
        },
        unsavedChanges: true,
      }));

      trackEvent('widget_removed', {
        widgetId,
        userRole: options.userRole,
      });
    },
    [trackEvent, options.userRole]
  );

  // Resize widget
  const resizeWidget = useCallback(
    (widgetId: string, size: { w: number; h: number }) => {
      setState(prev => ({
        ...prev,
        layout: {
          ...prev.layout,
          grid: prev.layout.grid.map(pos => (pos.id === widgetId ? { ...pos, ...size } : pos)),
        },
        unsavedChanges: true,
      }));

      options.onWidgetResize?.(widgetId, size);
      trackEvent('widget_resized', {
        widgetId,
        size,
        userRole: options.userRole,
      });
    },
    [options, trackEvent]
  );

  // Move widget
  const moveWidget = useCallback(
    (widgetId: string, position: { x: number; y: number }) => {
      setState(prev => ({
        ...prev,
        layout: {
          ...prev.layout,
          grid: prev.layout.grid.map(pos => (pos.id === widgetId ? { ...pos, ...position } : pos)),
        },
        unsavedChanges: true,
      }));

      options.onWidgetMove?.(widgetId, position);
      trackEvent('widget_moved', {
        widgetId,
        position,
        userRole: options.userRole,
      });
    },
    [options, trackEvent]
  );

  // Toggle widget visibility
  const toggleWidget = useCallback(
    (widgetId: string, visible?: boolean) => {
      const widget = widgets.find(w => w.id === widgetId);
      if (!widget) return;

      const isCurrentlyVisible = state.layout.grid.some(pos => pos.id === widgetId);
      const shouldBeVisible = visible !== undefined ? visible : !isCurrentlyVisible;

      if (shouldBeVisible && !isCurrentlyVisible) {
        addWidget(widget);
      } else if (!shouldBeVisible && isCurrentlyVisible) {
        removeWidget(widgetId);
      }
    },
    [widgets, state.layout.grid, addWidget, removeWidget]
  );

  // Reset layout to default
  const resetLayout = useCallback(() => {
    const defaultGrid = generateDefaultLayout();

    setState(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        grid: defaultGrid,
      },
      layouts: {
        ...prev.layouts,
        [prev.activeBreakpoint]: defaultGrid,
      },
      unsavedChanges: true,
    }));

    trackEvent('layout_reset', {
      previousWidgetCount: state.layout.grid.length,
      newWidgetCount: defaultGrid.length,
      userRole: options.userRole,
    });
  }, [generateDefaultLayout, state.layout.grid.length, trackEvent, options.userRole]);

  // Save layout to storage
  const saveLayout = useCallback(async (): Promise<boolean> => {
    try {
      const layoutData = {
        layout: state.layout,
        layouts: state.layouts,
        settings: state.settings,
        timestamp: Date.now(),
        version: '1.0',
      };

      const serialized = JSON.stringify(layoutData);
      localStorage.setItem(getLayoutStorageKey(), serialized);
      layoutCacheRef.current = serialized;

      setState(prev => ({ ...prev, unsavedChanges: false }));

      trackEvent('layout_saved', {
        widgetCount: state.layout.grid.length,
        userRole: options.userRole,
      });

      return true;
    } catch (error) {
      console.error('Failed to save layout:', error);
      return false;
    }
  }, [
    state.layout,
    state.layouts,
    state.settings,
    getLayoutStorageKey,
    trackEvent,
    options.userRole,
  ]);

  // Load layout from storage
  const loadLayout = useCallback(async (): Promise<boolean> => {
    try {
      const stored = localStorage.getItem(getLayoutStorageKey());
      if (!stored) return false;

      const layoutData = JSON.parse(stored);

      setState(prev => ({
        ...prev,
        layout: layoutData.layout || prev.layout,
        layouts: layoutData.layouts || prev.layouts,
        settings: { ...prev.settings, ...layoutData.settings },
        unsavedChanges: false,
      }));

      layoutCacheRef.current = stored;

      trackEvent('layout_loaded', {
        widgetCount: layoutData.layout?.grid?.length || 0,
        userRole: options.userRole,
      });

      return true;
    } catch (error) {
      console.error('Failed to load layout:', error);
      return false;
    }
  }, [getLayoutStorageKey, trackEvent, options.userRole]);

  // Export layout as JSON
  const exportLayout = useCallback((): string => {
    const exportData = {
      layout: state.layout,
      layouts: state.layouts,
      settings: state.settings,
      metadata: {
        exportedAt: new Date().toISOString(),
        userRole: options.userRole,
        version: '1.0',
      },
    };

    trackEvent('layout_exported', {
      widgetCount: state.layout.grid.length,
      userRole: options.userRole,
    });

    return JSON.stringify(exportData, null, 2);
  }, [state.layout, state.layouts, state.settings, options.userRole, trackEvent]);

  // Import layout from JSON
  const importLayout = useCallback(
    (layoutData: string): boolean => {
      try {
        const imported = JSON.parse(layoutData);

        setState(prev => ({
          ...prev,
          layout: imported.layout || prev.layout,
          layouts: imported.layouts || prev.layouts,
          settings: { ...prev.settings, ...imported.settings },
          unsavedChanges: true,
        }));

        trackEvent('layout_imported', {
          widgetCount: imported.layout?.grid?.length || 0,
          userRole: options.userRole,
        });

        return true;
      } catch (error) {
        console.error('Failed to import layout:', error);
        return false;
      }
    },
    [trackEvent, options.userRole]
  );

  // Update settings
  const updateSettings = useCallback(
    (newSettings: Partial<DashboardSettings>) => {
      setState(prev => ({
        ...prev,
        settings: { ...prev.settings, ...newSettings },
        unsavedChanges: true,
      }));

      trackEvent('settings_updated', {
        settingsChanged: Object.keys(newSettings),
        userRole: options.userRole,
      });
    },
    [trackEvent, options.userRole]
  );

  // Initialize layout on mount
  useEffect(() => {
    const initializeLayout = async () => {
      const loaded = await loadLayout();
      if (!loaded) {
        // Generate default layout if none exists
        const defaultGrid = generateDefaultLayout();
        setState(prev => ({
          ...prev,
          layout: {
            ...prev.layout,
            grid: defaultGrid,
          },
        }));
      }
    };

    initializeLayout();
  }, [loadLayout, generateDefaultLayout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Computed values
  const availableWidgets = widgets;
  const visibleWidgets = widgets.filter(widget =>
    state.layout.grid.some(pos => pos.id === widget.id)
  );
  const hiddenWidgets = widgets.filter(
    widget => !state.layout.grid.some(pos => pos.id === widget.id)
  );

  return {
    // Layout state
    layout: state.layout,
    layouts: state.layouts,
    activeBreakpoint: state.activeBreakpoint,
    isModified: state.unsavedChanges,

    // Widget management
    availableWidgets,
    visibleWidgets,
    hiddenWidgets,

    // Layout settings
    settings: state.settings,
    updateSettings,

    // Responsive handling
    containerWidth,
    updateContainerWidth,

    // State indicators
    isResizing: state.isResizing,
    isDragging: state.isDragging,
    hasUnsavedChanges: state.unsavedChanges,

    // Actions
    updateLayout,
    updateGridPositions,
    addWidget,
    removeWidget,
    resizeWidget,
    moveWidget,
    toggleWidget,
    resetLayout,
    saveLayout,
    loadLayout,
    exportLayout,
    importLayout,
  };
}

// Export additional types
export type { LayoutActions, LayoutState, UseDashboardLayoutOptions };
