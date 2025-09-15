import { createRoute } from '@/lib/api/route';
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = "nodejs";
import { ok } from '@/lib/api/response';
import { logInfo } from '@/lib/logger';
import { versionHistoryService } from '@/services/versionHistoryService';
import { VersionHistoryQuerySchema } from '@/features/version-history/schemas';

export const dynamic = 'force-dynamic';

// GET /api/proposals/[id]/versions - list versions for specific proposal
export const GET = createRoute(
  {
    roles: ['admin', 'sales', 'viewer', 'System Administrator'],
    query: VersionHistoryQuerySchema,
  },
  async ({ query, user, requestId, req }) => {
    // Extract proposalId from the URL path
    const url = new URL(req.url);
    const proposalId = url.pathname.split('/')[3]; // /api/proposals/[id]/versions

    // Log request with traceability metadata
    logInfo('proposal_version_history_api_request', {
      component: 'ProposalVersionHistoryAPI',
      operation: 'GET',
      requestId,
      userId: user.id,
      proposalId,
      queryParams: query,
      userStory: 'US-5.1',
      hypothesis: 'H8',
    });

    // Use the modernized version history service
    const result = await versionHistoryService.getProposalVersionHistory(proposalId, query);

    // Check if the response is successful
    if (result.ok) {
      // Log successful response
      logInfo('proposal_version_history_api_success', {
        component: 'ProposalVersionHistoryAPI',
        operation: 'GET',
        requestId,
        userId: user.id,
        proposalId,
        resultCount: result.data.items.length,
        hasNextPage: result.data.pagination.hasNextPage,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      // Return data exactly as provided by the service to match Zod schema
      return ok(result.data);
    } else {
      // Log error response
      logInfo('proposal_version_history_api_error', {
        component: 'ProposalVersionHistoryAPI',
        operation: 'GET',
        requestId,
        userId: user.id,
        proposalId,
        errorCode: result.code,
        errorMessage: result.message,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      // Return error response (this will be handled by createRoute's error handling)
      throw new Error(result.message);
    }
  }
);
