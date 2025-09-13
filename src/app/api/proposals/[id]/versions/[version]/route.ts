import { createRoute } from '@/lib/api/route';
import { ok } from '@/lib/api/response';
import { logInfo } from '@/lib/logger';
import { versionHistoryService } from '@/services/versionHistoryService';

// GET /api/proposals/[id]/versions/[version] - get a specific version detail with diff
export const GET = createRoute(
  {
    roles: ['admin', 'sales', 'viewer', 'System Administrator'],
  },
  async ({ req, user, requestId }) => {
    const url = new URL(req.url);
    const parts = url.pathname.split('/').filter(Boolean);
    // /api/proposals/[id]/versions/[version]
    const idx = parts.indexOf('proposals');
    const proposalId = idx >= 0 ? parts[idx + 1] : '';
    const versionStr = idx >= 0 ? parts[idx + 3] : '';
    const version = Number(versionStr);

    logInfo('proposal_version_detail_request', {
      component: 'ProposalVersionDetailAPI',
      operation: 'GET',
      requestId,
      userId: user.id,
      proposalId,
      version,
    });

    const result = await versionHistoryService.getVersionHistoryDetail(proposalId, version);

    if (result.ok) {
      logInfo('proposal_version_detail_success', {
        component: 'ProposalVersionDetailAPI',
        operation: 'GET',
        requestId,
        userId: user.id,
        proposalId,
        version,
      });
      return ok(result.data);
    }

    throw new Error(result.message);
  }
);

