// Typed Response Envelope Template for Migration from Bridge Pattern

export type ApiResponse<T> = { ok: true; data: T } | { ok: false; code: string; message: string };

export const ok = <T>(data: T): ApiResponse<T> => ({ ok: true, data });
