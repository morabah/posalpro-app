/**
 * PosalPro MVP2 - Build-Time Guard Utility
 * Provides standardized build-time detection and database connection prevention
 */

/**
 * Comprehensive build-time detection
 * Returns true if the application is running during build time
 */
export function isBuildTime(): boolean {
  return (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NETLIFY_BUILD_TIME === 'true' ||
    process.env.BUILD_MODE === 'static' ||
    !process.env.DATABASE_URL
  );
}

/**
 * Build-time safe database check
 * Returns true if database operations should be skipped
 */
export function shouldSkipDatabase(): boolean {
  return !process.env.DATABASE_URL;
}

/**
 * Get build-time safe response for API routes
 */
export function getBuildTimeResponse(message: string = 'Data not available during build process') {
  return {
    success: true,
    data: [],
    message,
    timestamp: new Date().toISOString(),
  };
}
