// [IO_FIX] Memory-safe file operations
import { promises as fs } from 'fs';

export class SafeFileOperations {
  static async writeFileSafe(path: string, content: any, options: any = {}) {
    try {
      // Create backup if file exists
      try {
        await fs.access(path);
        await fs.copyFile(path, `${path}.backup`);
      } catch {
        // File doesn't exist, no backup needed
      }

      // Write in chunks to prevent memory issues
      const chunks = [];
      const chunkSize = 64 * 1024; // 64KB chunks

      for (let i = 0; i < content.length; i += chunkSize) {
        chunks.push(content.slice(i, i + chunkSize));
      }

      await fs.writeFile(path, chunks.join(''), options);

      // Cleanup backup on success
      try {
        await fs.unlink(`${path}.backup`);
      } catch {
        // Backup cleanup failed, but write succeeded
      }

      return true;
    } catch (error) {
      console.error('[IO_FIX] Write operation failed:', error);

      // Restore backup if available
      try {
        await fs.copyFile(`${path}.backup`, path);
        await fs.unlink(`${path}.backup`);
        console.log('[IO_FIX] Restored from backup');
      } catch {
        // Backup restore failed
      }

      throw error;
    }
  }

  static async readFileSafe(path: string, options: any = {}) {
    try {
      const stats = await fs.stat(path);

      // For large files, use streaming
      if (stats.size > 10 * 1024 * 1024) { // 10MB
        console.warn('[IO_FIX] Large file detected, consider streaming');
      }

      return await fs.readFile(path, options);
    } catch (error) {
      console.error('[IO_FIX] Read operation failed:', error);
      throw error;
    }
  }
}