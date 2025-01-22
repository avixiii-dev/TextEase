export interface EditorState {
  content: string;
  filePath: string | null;
  fileType: string;
  isDarkMode: boolean;
  isPreviewEnabled: boolean;
  wordCount: number;
  isModified: boolean;
}

export class EditorStateManager {
  private state: EditorState;

  constructor() {
    this.state = {
      content: '',
      filePath: null,
      fileType: 'txt',
      isDarkMode: false,
      isPreviewEnabled: false,
      wordCount: 0,
      isModified: false
    };
  }

  public getState(): EditorState {
    return { ...this.state };
  }

  public setState(newState: Partial<EditorState>): void {
    this.state = { ...this.state, ...newState };
  }

  public updateWordCount(): void {
    const words = this.state.content.trim().split(/\s+/);
    this.state.wordCount = words[0] === '' ? 0 : words.length;
  }

  public toggleDarkMode(): void {
    this.state.isDarkMode = !this.state.isDarkMode;
  }

  public togglePreview(): void {
    if (this.state.fileType === 'md') {
      this.state.isPreviewEnabled = !this.state.isPreviewEnabled;
    }
  }

  public setFileType(type: string): void {
    this.state.fileType = type;
    if (type !== 'md') {
      this.state.isPreviewEnabled = false;
    }
  }
}
