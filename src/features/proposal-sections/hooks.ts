import { useToast } from '@/components/feedback/Toast/ToastProvider';
import { http } from '@/lib/http';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '@/lib/http';
import { sectionKeys } from './keys';
import { BulkAssignments, BulkAssignmentsSchema, CreateBomSection, CreateBomSectionSchema } from './schemas';

export function useProposalSections(proposalId?: string) {
  return useQuery({
    queryKey: proposalId ? sectionKeys.byProposal(proposalId) : sectionKeys.all,
    enabled: !!proposalId,
    queryFn: async () => {
      // The HTTP client unwraps API envelopes and returns `data` directly
      return await http.get<Array<{ id: string; title: string; content: string; order: number }>>(
        `/api/proposals/${proposalId}/sections`
      );
    },
  });
}

export function useCreateSectionMutation(proposalId: string) {
  const client = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async (input: CreateBomSection) => {
      const parsed = CreateBomSectionSchema.parse(input);
      // The HTTP client unwraps API envelopes and returns `data` directly
      return await http.post<{ id: string; title: string; content: string; order: number }>(
        `/api/proposals/${proposalId}/sections`,
        parsed
      );
    },
    onMutate: async newSection => {
      await client.cancelQueries({ queryKey: sectionKeys.byProposal(proposalId) });
      const prev = client.getQueryData(sectionKeys.byProposal(proposalId));

      // Optimistically add
      client.setQueryData(sectionKeys.byProposal(proposalId), (old: any) => {
        const list = Array.isArray(old) ? old.slice() : [];
        const temp = {
          id: `temp-${Date.now()}`,
          title: newSection.title,
          content: newSection.description || '',
          order: (list[list.length - 1]?.order || 0) + 1,
        };
        return [...list, temp];
      });

      return { prev };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.prev) client.setQueryData(sectionKeys.byProposal(proposalId), ctx.prev);
      toast.error(error instanceof Error ? error.message : 'Failed to create section');
    },
    onSuccess: data => {
      // Merge the created/returned section into cache for instant UI
      const key = sectionKeys.byProposal(proposalId);
      client.setQueryData(key, (old: any) => {
        const list: Array<any> = Array.isArray(old) ? old.slice() : [];
        const idx = list.findIndex(s => String(s.id).startsWith('temp-') || s.title?.toLowerCase() === data.title.toLowerCase());
        if (idx >= 0) list[idx] = data;
        else if (!list.find(s => s.id === data.id)) list.push(data);
        return list.sort((a, b) => (a.order || 0) - (b.order || 0));
      });
      // Ensure server state is fresh
      client.invalidateQueries({ queryKey: key });
      client.refetchQueries({ queryKey: key });
    },
  });
}

export function useDeleteSectionMutation(proposalId: string) {
  const client = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async (sectionId: string) => {
      // The HTTP client unwraps API envelopes and returns `data` directly
      return await http.delete(`/api/proposals/${proposalId}/sections/${sectionId}`);
    },
    onMutate: async sectionId => {
      await client.cancelQueries({ queryKey: sectionKeys.byProposal(proposalId) });
      const prev = client.getQueryData(sectionKeys.byProposal(proposalId));

      // Optimistically remove
      client.setQueryData(sectionKeys.byProposal(proposalId), (old: any) => {
        const list = Array.isArray(old) ? old.slice() : [];
        return list.filter((s: any) => s.id !== sectionId);
      });

      return { prev };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.prev) client.setQueryData(sectionKeys.byProposal(proposalId), ctx.prev);
      toast.error(error instanceof Error ? error.message : 'Failed to delete section');
    },
    onSuccess: () => {
      // Ensure server state is fresh
      client.invalidateQueries({ queryKey: sectionKeys.byProposal(proposalId) });
      client.refetchQueries({ queryKey: sectionKeys.byProposal(proposalId) });
      toast.success('Section deleted successfully');
    },
  });
}

export function useBulkAssignMutation(proposalId: string) {
  const toast = useToast();
  return useMutation({
    mutationFn: async (input: BulkAssignments) => {
      const parsed = BulkAssignmentsSchema.parse(input);
      // Endpoint returns `{ ok: true }` envelope; HTTP client returns `data` (undefined)
      await http.post(
        `/api/proposals/${proposalId}/product-selections/bulk-assign`,
        parsed
      );
      return true;
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Failed to save assignments');
    },
  });
}
