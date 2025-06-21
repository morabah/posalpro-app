import { logger } from '@/utils/logger';/**
 * PosalPro MVP2 - UI Store
 * Zustand store for managing global UI state, modals, notifications, and interface interactions
 * Provides centralized UI state management across the application
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Modal state interface
export interface ModalState {
  id: string;
  isOpen: boolean;
  title?: string;
  content?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  onClose?: () => void;
  data?: any;
}

// Notification interface
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary';
  }>;
  persistent?: boolean;
  timestamp: Date;
}

// Loading state interface
export interface LoadingState {
  id: string;
  message?: string;
  progress?: number;
  cancellable?: boolean;
  onCancel?: () => void;
}

// Sidebar state interface
export interface SidebarState {
  isOpen: boolean;
  isPinned: boolean;
  activeSection?: string;
  collapsedSections: string[];
}

// Breadcrumb item interface
export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
  active?: boolean;
}

// UI state interface
export interface UIState {
  // Layout states
  sidebar: SidebarState;
  breadcrumbs: BreadcrumbItem[];

  // Modal management
  modals: Record<string, ModalState>;
  activeModal: string | null;

  // Notification system
  notifications: Notification[];
  maxNotifications: number;

  // Loading states
  globalLoading: LoadingState | null;
  pageLoading: boolean;
  loadingStates: Record<string, LoadingState>;

  // Navigation state
  currentPage: string;
  previousPage: string | null;
  navigationHistory: string[];

  // Search state
  globalSearchOpen: boolean;
  globalSearchQuery: string;
  globalSearchResults: any[];
  globalSearchLoading: boolean;

  // Theme and display
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  fullscreenMode: boolean;

  // Mobile responsiveness
  isMobile: boolean;
  mobileMenuOpen: boolean;

  // Focus management
  focusedElement: string | null;
  keyboardNavigation: boolean;

  // Form states
  unsavedChanges: Record<string, boolean>;
  formErrors: Record<string, string[]>;

  // Feature flags
  debugMode: boolean;
  maintenanceMode: boolean;

  // Analytics and tracking
  pageViewStartTime: Date | null;
  userInteractions: number;
  lastInteraction: Date | null;
}

// UI actions interface
export interface UIActions {
  // Sidebar management
  setSidebarOpen: (open: boolean) => void;
  setSidebarPinned: (pinned: boolean) => void;
  toggleSidebar: () => void;
  setActiveSection: (section: string | undefined) => void;
  toggleSection: (section: string) => void;

  // Breadcrumb management
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  addBreadcrumb: (breadcrumb: BreadcrumbItem) => void;
  clearBreadcrumbs: () => void;

  // Modal management
  openModal: (modal: Omit<ModalState, 'isOpen'>) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  updateModal: (id: string, updates: Partial<ModalState>) => void;

  // Notification system
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  markNotificationRead: (id: string) => void;

  // Loading states
  setGlobalLoading: (loading: LoadingState | null) => void;
  setPageLoading: (loading: boolean) => void;
  setLoading: (id: string, loading: LoadingState | null) => void;
  clearLoadingState: (id: string) => void;

  // Navigation
  setCurrentPage: (page: string) => void;
  goBack: () => void;
  addToHistory: (page: string) => void;

  // Search
  setGlobalSearchOpen: (open: boolean) => void;
  setGlobalSearchQuery: (query: string) => void;
  setGlobalSearchResults: (results: any[]) => void;
  setGlobalSearchLoading: (loading: boolean) => void;

  // Theme and display
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setFullscreenMode: (fullscreen: boolean) => void;

  // Mobile
  setIsMobile: (mobile: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;

  // Focus management
  setFocusedElement: (element: string | null) => void;
  setKeyboardNavigation: (enabled: boolean) => void;

  // Form management
  setUnsavedChanges: (formId: string, hasChanges: boolean) => void;
  setFormErrors: (formId: string, errors: string[]) => void;
  clearFormErrors: (formId: string) => void;

  // Features
  setDebugMode: (enabled: boolean) => void;
  setMaintenanceMode: (enabled: boolean) => void;

  // Analytics
  trackPageView: (page: string) => void;
  trackInteraction: () => void;
  getSessionDuration: () => number;
}

// Combined store type
export type UIStore = UIState & UIActions;

// Initial state
const initialState: UIState = {
  sidebar: {
    isOpen: true,
    isPinned: false,
    activeSection: undefined,
    collapsedSections: [],
  },
  breadcrumbs: [],
  modals: {},
  activeModal: null,
  notifications: [],
  maxNotifications: 5,
  globalLoading: null,
  pageLoading: false,
  loadingStates: {},
  currentPage: '/',
  previousPage: null,
  navigationHistory: [],
  globalSearchOpen: false,
  globalSearchQuery: '',
  globalSearchResults: [],
  globalSearchLoading: false,
  theme: 'system',
  sidebarCollapsed: false,
  fullscreenMode: false,
  isMobile: false,
  mobileMenuOpen: false,
  focusedElement: null,
  keyboardNavigation: false,
  unsavedChanges: {},
  formErrors: {},
  debugMode: process.env.NODE_ENV === 'development',
  maintenanceMode: false,
  pageViewStartTime: null,
  userInteractions: 0,
  lastInteraction: null,
};

// Generate unique ID for notifications and modals
const generateId = () => Math.random().toString(36).substr(2, 9);

// Create the UI store
export const useUIStore = create<UIStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,

      // Sidebar management
      setSidebarOpen: open => {
        set(state => {
          state.sidebar.isOpen = open;
        });
      },

      setSidebarPinned: pinned => {
        set(state => {
          state.sidebar.isPinned = pinned;
        });
      },

      toggleSidebar: () => {
        set(state => {
          state.sidebar.isOpen = !state.sidebar.isOpen;
        });
      },

      setActiveSection: section => {
        set(state => {
          state.sidebar.activeSection = section;
        });
      },

      toggleSection: section => {
        set(state => {
          const index = state.sidebar.collapsedSections.indexOf(section);
          if (index === -1) {
            state.sidebar.collapsedSections.push(section);
          } else {
            state.sidebar.collapsedSections.splice(index, 1);
          }
        });
      },

      // Breadcrumb management
      setBreadcrumbs: breadcrumbs => {
        set(state => {
          state.breadcrumbs = breadcrumbs;
        });
      },

      addBreadcrumb: breadcrumb => {
        set(state => {
          state.breadcrumbs.push(breadcrumb);
        });
      },

      clearBreadcrumbs: () => {
        set(state => {
          state.breadcrumbs = [];
        });
      },

      // Modal management
      openModal: modal => {
        const id = modal.id || generateId();
        set(state => {
          state.modals[id] = { ...modal, id, isOpen: true };
          state.activeModal = id;
        });
      },

      closeModal: id => {
        set(state => {
          if (state.modals[id]) {
            state.modals[id].isOpen = false;
            if (state.modals[id].onClose) {
              state.modals[id].onClose();
            }
          }
          if (state.activeModal === id) {
            state.activeModal = null;
          }
        });
      },

      closeAllModals: () => {
        set(state => {
          Object.values(state.modals).forEach(modal => {
            modal.isOpen = false;
            if (modal.onClose) {
              modal.onClose();
            }
          });
          state.activeModal = null;
        });
      },

      updateModal: (id, updates) => {
        set(state => {
          if (state.modals[id]) {
            Object.assign(state.modals[id], updates);
          }
        });
      },

      // Notification system
      addNotification: notification => {
        const id = generateId();
        const newNotification: Notification = {
          ...notification,
          id,
          timestamp: new Date(),
        };

        set(state => {
          state.notifications.unshift(newNotification);

          // Remove oldest notifications if exceeding max
          if (state.notifications.length > state.maxNotifications) {
            state.notifications = state.notifications.slice(0, state.maxNotifications);
          }
        });

        // Auto-remove non-persistent notifications
        if (!notification.persistent) {
          const duration = notification.duration || 5000;
          setTimeout(() => {
            get().removeNotification(id);
          }, duration);
        }
      },

      removeNotification: id => {
        set(state => {
          state.notifications = state.notifications.filter(n => n.id !== id);
        });
      },

      clearNotifications: () => {
        set(state => {
          state.notifications = [];
        });
      },

      markNotificationRead: id => {
        // TODO: Implement notification read status if needed
        logger.info('Marking notification as read:', id);
      },

      // Loading states
      setGlobalLoading: loading => {
        set(state => {
          state.globalLoading = loading;
        });
      },

      setPageLoading: loading => {
        set(state => {
          state.pageLoading = loading;
        });
      },

      setLoading: (id, loading) => {
        set(state => {
          if (loading) {
            state.loadingStates[id] = loading;
          } else {
            delete state.loadingStates[id];
          }
        });
      },

      clearLoadingState: id => {
        set(state => {
          delete state.loadingStates[id];
        });
      },

      // Navigation
      setCurrentPage: page => {
        set(state => {
          state.previousPage = state.currentPage;
          state.currentPage = page;
          state.pageViewStartTime = new Date();
        });
      },

      goBack: () => {
        const { previousPage } = get();
        if (previousPage) {
          // TODO: Implement navigation logic
          logger.info('Navigating back to:', previousPage);
        }
      },

      addToHistory: page => {
        set(state => {
          state.navigationHistory.unshift(page);
          // Keep only last 20 pages
          if (state.navigationHistory.length > 20) {
            state.navigationHistory = state.navigationHistory.slice(0, 20);
          }
        });
      },

      // Search
      setGlobalSearchOpen: open => {
        set(state => {
          state.globalSearchOpen = open;
          if (!open) {
            state.globalSearchQuery = '';
            state.globalSearchResults = [];
          }
        });
      },

      setGlobalSearchQuery: query => {
        set(state => {
          state.globalSearchQuery = query;
        });
      },

      setGlobalSearchResults: results => {
        set(state => {
          state.globalSearchResults = results;
        });
      },

      setGlobalSearchLoading: loading => {
        set(state => {
          state.globalSearchLoading = loading;
        });
      },

      // Theme and display
      setTheme: theme => {
        set(state => {
          state.theme = theme;
        });
      },

      setSidebarCollapsed: collapsed => {
        set(state => {
          state.sidebarCollapsed = collapsed;
        });
      },

      setFullscreenMode: fullscreen => {
        set(state => {
          state.fullscreenMode = fullscreen;
        });
      },

      // Mobile
      setIsMobile: mobile => {
        set(state => {
          state.isMobile = mobile;
          // Auto-close mobile menu on desktop
          if (!mobile) {
            state.mobileMenuOpen = false;
          }
        });
      },

      setMobileMenuOpen: open => {
        set(state => {
          state.mobileMenuOpen = open;
        });
      },

      // Focus management
      setFocusedElement: element => {
        set(state => {
          state.focusedElement = element;
        });
      },

      setKeyboardNavigation: enabled => {
        set(state => {
          state.keyboardNavigation = enabled;
        });
      },

      // Form management
      setUnsavedChanges: (formId, hasChanges) => {
        set(state => {
          state.unsavedChanges[formId] = hasChanges;
        });
      },

      setFormErrors: (formId, errors) => {
        set(state => {
          state.formErrors[formId] = errors;
        });
      },

      clearFormErrors: formId => {
        set(state => {
          delete state.formErrors[formId];
        });
      },

      // Features
      setDebugMode: enabled => {
        set(state => {
          state.debugMode = enabled;
        });
      },

      setMaintenanceMode: enabled => {
        set(state => {
          state.maintenanceMode = enabled;
        });
      },

      // Analytics
      trackPageView: page => {
        set(state => {
          state.currentPage = page;
          state.pageViewStartTime = new Date();
        });

        // TODO: Send to analytics service
        logger.info('Page view tracked:', page);
      },

      trackInteraction: () => {
        set(state => {
          state.userInteractions += 1;
          state.lastInteraction = new Date();
        });
      },

      getSessionDuration: () => {
        const { pageViewStartTime } = get();
        if (!pageViewStartTime) return 0;
        return Date.now() - pageViewStartTime.getTime();
      },
    }))
  )
);

// Selector hooks for common use cases
export const useSidebar = () => useUIStore(state => state.sidebar);
export const useBreadcrumbs = () => useUIStore(state => state.breadcrumbs);
export const useModals = () =>
  useUIStore(state => ({
    modals: state.modals,
    activeModal: state.activeModal,
  }));
export const useNotifications = () => useUIStore(state => state.notifications);
export const useGlobalLoading = () => useUIStore(state => state.globalLoading);
export const usePageLoading = () => useUIStore(state => state.pageLoading);
export const useGlobalSearch = () =>
  useUIStore(state => ({
    isOpen: state.globalSearchOpen,
    query: state.globalSearchQuery,
    results: state.globalSearchResults,
    loading: state.globalSearchLoading,
  }));

// Actions hooks
export const useUIActions = () =>
  useUIStore(state => ({
    // Sidebar
    setSidebarOpen: state.setSidebarOpen,
    toggleSidebar: state.toggleSidebar,
    setSidebarPinned: state.setSidebarPinned,

    // Modals
    openModal: state.openModal,
    closeModal: state.closeModal,
    closeAllModals: state.closeAllModals,

    // Notifications
    addNotification: state.addNotification,
    removeNotification: state.removeNotification,
    clearNotifications: state.clearNotifications,

    // Loading
    setGlobalLoading: state.setGlobalLoading,
    setPageLoading: state.setPageLoading,
    setLoading: state.setLoading,

    // Search
    setGlobalSearchOpen: state.setGlobalSearchOpen,
    setGlobalSearchQuery: state.setGlobalSearchQuery,

    // Navigation
    setCurrentPage: state.setCurrentPage,
    setBreadcrumbs: state.setBreadcrumbs,
  }));

// Feature flags hooks
export const useDebugMode = () => useUIStore(state => state.debugMode);
export const useMaintenanceMode = () => useUIStore(state => state.maintenanceMode);

// Form state hooks
export const useFormState = (formId: string) =>
  useUIStore(state => ({
    hasUnsavedChanges: state.unsavedChanges[formId] || false,
    errors: state.formErrors[formId] || [],
  }));

// Analytics integration
export const trackUIEvent = (event: string, data?: any) => {
  const { trackInteraction } = useUIStore.getState();
  trackInteraction();

  // TODO: Integrate with analytics system
  logger.info('UI Event: ' + event, data);
};
