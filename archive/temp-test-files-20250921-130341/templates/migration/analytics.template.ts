// Analytics Template for Migration from Bridge Pattern

export const analytics = {
  trackOptimized: (event: string, props?: Record<string, unknown>) => {
    // route to your analytics (PostHog, Amplitude, etc.)
    console.log('Analytics:', event, props);
  },
};
