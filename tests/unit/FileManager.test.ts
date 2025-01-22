import { FileManager } from '../../src/models/FileManager';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');

describe('FileManager', () => {
  let fileManager: FileManager;
  const testFilePath = path.join(__dirname, 'test.txt');
  const testContent = 'Hello, World!';

  beforeEach(() => {
    fileManager = new FileManager();
    (fs.readFileSync as jest.Mock).mockReset();
    (fs.writeFileSync as jest.Mock).mockReset();
  });

  describe('readFile', () => {
    it('should read file content correctly', async () => {
      (fs.readFileSync as jest.Mock).mockReturnValue(testContent);

      const content = await fileManager.readFile(testFilePath);
      expect(content).toBe(testContent);
      expect(fs.readFileSync).toHaveBeenCalledWith(testFilePath, 'utf8');
    });

    it('should throw error when file cannot be read', async () => {
      const error = new Error('File not found');
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await expect(fileManager.readFile(testFilePath)).rejects.toThrow('File not found');
    });
  });

  describe('writeFile', () => {
    it('should write content to file correctly', async () => {
      await fileManager.writeFile(testFilePath, testContent);
      expect(fs.writeFileSync).toHaveBeenCalledWith(testFilePath, testContent);
    });

    it('should throw error when file cannot be written', async () => {
      const error = new Error('Permission denied');
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await expect(fileManager.writeFile(testFilePath, testContent)).rejects.toThrow('Permission denied');
    });
  });

  describe('getFileType', () => {
    it('should return correct file type for .txt files', () => {
      expect(fileManager.getFileType('test.txt')).toBe('txt');
    });

    it('should return correct file type for .md files', () => {
      expect(fileManager.getFileType('test.md')).toBe('md');
    });

    it('should return correct file type for .rtf files', () => {
      expect(fileManager.getFileType('test.rtf')).toBe('rtf');
    });

    it('should return null for unsupported file types', () => {
      expect(fileManager.getFileType('test.doc')).toBeNull();
    });
  });
});
