import { Application } from 'spectron';
import * as path from 'path';

describe('TextEase Application', () => {
  let app: Application;

  beforeEach(async () => {
    app = new Application({
      path: path.join(__dirname, '../../node_modules/.bin/electron'),
      args: [path.join(__dirname, '../../dist/main.js')]
    });

    await app.start();
  });

  afterEach(async () => {
    if (app && app.isRunning()) {
      await app.stop();
    }
  });

  it('shows the initial window', async () => {
    const windowCount = await app.client.getWindowCount();
    expect(windowCount).toBe(1);
  });

  it('has the correct title', async () => {
    const title = await app.client.getTitle();
    expect(title).toBe('TextEase');
  });

  it('can type in editor', async () => {
    const editor = await app.client.$('#editor');
    await editor.click();
    await app.client.keys('Hello, World!');
    const text = await editor.getText();
    expect(text).toBe('Hello, World!');
  });

  it('can toggle dark mode', async () => {
    const darkModeButton = await app.client.$('#darkModeToggle');
    await darkModeButton.click();
    const body = await app.client.$('body');
    const classes = await body.getAttribute('class');
    expect(classes).toContain('dark-mode');
  });

  it('shows word count', async () => {
    const editor = await app.client.$('#editor');
    await editor.click();
    await app.client.keys('Hello, World!');
    const wordCount = await app.client.$('#wordCount');
    const count = await wordCount.getText();
    expect(count).toBe('2 words');
  });

  it('can save file', async () => {
    const editor = await app.client.$('#editor');
    await editor.click();
    await app.client.keys('Test content');
    
    const saveButton = await app.client.$('#saveFile');
    await saveButton.click();
    
    // Mock dialog.showSaveDialog
    await app.webContents.send('save-dialog-response', {
      filePath: path.join(__dirname, 'test.txt'),
      canceled: false
    });
    
    const fileStatus = await app.client.$('#fileStatus');
    const status = await fileStatus.getText();
    expect(status).toContain('test.txt');
  });

  it('shows markdown preview', async () => {
    const fileTypeSelect = await app.client.$('#fileTypeSelect');
    await fileTypeSelect.selectByVisibleText('Markdown');
    
    const editor = await app.client.$('#editor');
    await editor.click();
    await app.client.keys('# Hello');
    
    const preview = await app.client.$('#preview');
    const html = await preview.getHTML();
    expect(html).toContain('<h1>Hello</h1>');
  });
});
