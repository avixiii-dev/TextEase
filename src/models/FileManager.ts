import { promises as fs } from 'fs';
import * as path from 'path';

export interface FileContent {
  content: string;
  filePath: string;
  fileType: string;
}

export class FileManager {
  private readonly supportedTypes = ['txt', 'md', 'rtf'];
  private backupDir: string;

  constructor() {
    this.backupDir = path.join(process.env.HOME || process.env.USERPROFILE || '', '.textease/backups');
    this.ensureBackupDir();
  }

  private async ensureBackupDir(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create backup directory:', error);
    }
  }

  public async readFile(filePath: string): Promise<FileContent> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const fileType = this.getFileType(filePath);
      return { content, filePath, fileType };
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }

  public async writeFile(filePath: string, content: string): Promise<void> {
    try {
      await this.createBackup(filePath, content);
      await fs.writeFile(filePath, content);
    } catch (error) {
      throw new Error(`Failed to write file: ${error.message}`);
    }
  }

  public getFileType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    return this.supportedTypes.includes(ext) ? ext : null;
  }

  private async createBackup(filePath: string, content: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = path.basename(filePath);
      const backupPath = path.join(this.backupDir, `${filename}.${timestamp}.bak`);
      await fs.writeFile(backupPath, content);

      // Keep only last 5 backups
      const files = await fs.readdir(this.backupDir);
      const backups = files
        .filter(f => f.startsWith(filename))
        .sort()
        .reverse();

      if (backups.length > 5) {
        for (const file of backups.slice(5)) {
          await fs.unlink(path.join(this.backupDir, file));
        }
      }
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  }
}
