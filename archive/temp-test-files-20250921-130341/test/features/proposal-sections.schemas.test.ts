/** @jest-environment node */
import { CreateBomSectionSchema, hasDuplicateTitleCI } from '@/features/proposal-sections/schemas';

describe('CreateBomSectionSchema', () => {
  it('accepts valid title and optional description', () => {
    const parsed = CreateBomSectionSchema.parse({ title: 'Cameras', description: 'Front area' });
    expect(parsed.title).toBe('Cameras');
  });

  it('rejects empty title', () => {
    expect(() => CreateBomSectionSchema.parse({ title: '  ' })).toThrow();
  });
});

describe('hasDuplicateTitleCI', () => {
  const existing = [
    { id: '1', title: 'Cameras' },
    { id: '2', title: 'NVRs' },
  ];

  it('detects duplicates case-insensitively', () => {
    expect(hasDuplicateTitleCI(existing, 'cameras')).toBe(true);
    expect(hasDuplicateTitleCI(existing, 'CAMERAS')).toBe(true);
  });

  it('allows unique titles', () => {
    expect(hasDuplicateTitleCI(existing, 'Licenses')).toBe(false);
  });

  it('ignores the same record when excluding ID', () => {
    expect(hasDuplicateTitleCI(existing, 'Cameras', '1')).toBe(false);
  });
});

