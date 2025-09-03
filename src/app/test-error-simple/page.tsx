/**
 * Simple error boundary test page
 * This will immediately trigger an error to test the error boundary
 */

'use client';

export default function SimpleErrorTest() {
  // Immediately throw an error to test error boundary
  throw new Error('Test error from SimpleErrorTest page - this should be caught by the error boundary');
}
