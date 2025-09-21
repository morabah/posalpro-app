// HTTP Client (Migration Template)
// Prefer the centralized HTTP client which unwraps envelopes, tracks x-request-id,
// supports retries/timeouts, and throws HttpClientError on failures.
export { http, HttpClientError } from '@/lib/http';
