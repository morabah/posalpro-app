import { z } from 'zod';

export const CreateBomSectionSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title is required')
    .max(120, 'Title too long'),
  description: z.string().trim().max(1000).optional(),
});

export type CreateBomSection = z.infer<typeof CreateBomSectionSchema>;

export const BulkAssignmentsSchema = z.object({
  assignments: z
    .array(
      z.object({
        proposalProductId: z.string().min(1),
        sectionId: z.string().min(1).nullable(),
      })
    )
    .min(1),
});

export type BulkAssignments = z.infer<typeof BulkAssignmentsSchema>;

// Helper: validate case-insensitive uniqueness of title among existing sections
export function hasDuplicateTitleCI(
  existing: Array<{ id: string; title: string }>,
  title: string,
  excludeId?: string
): boolean {
  const t = title.trim().toLowerCase();
  return existing.some(s => s.title.trim().toLowerCase() === t && s.id !== excludeId);
}

