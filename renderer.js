const { ipcRenderer } = require('electron');
const { marked } = require('marked');
const hljs = require('highlight.js');

// Configure marked with highlight.js
marked.setOptions({
    highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
    },
    breaks: true,
    gfm: true
});

let currentFilePath = null;
let currentFileType = 'txt';
let isDarkMode = false;

// Initialize UI elements
const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const fileTypeSelect = document.getElementById('fileType');
const fileStatus = document.getElementById('fileStatus');
const currentFileTypeSpan = document.getElementById('currentFileType');
const encodingStatus = document.getElementById('encodingStatus');

// File type handling
fileTypeSelect.addEventListener('change', (e) => {
    setFileType(e.target.value);
});

function setFileType(type) {
    currentFileType = type;
    document.body.className = document.body.className.replace(/txt-mode|md-mode|rtf-mode/g, '');
    document.body.classList.add(`${type}-mode`);
    
    // Update UI
    currentFileTypeSpan.textContent = {
        'txt': 'Plain Text',
        'md': 'Markdown',
        'rtf': 'Rich Text'
    }[type];
    
    // Update preview if needed
    if (type === 'md') {
        updatePreview();
    }
    
    // Update preview visibility when changing file type
    if (currentFileType !== 'md') {
        preview.classList.remove('show');
        editor.style.flex = '1';
    }
}

// Word count function
function updateWordCount() {
    const text = editor.textContent || '';
    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    document.getElementById('wordCount').textContent = `Words: ${wordCount}`;
}

// Plain Text Controls
document.getElementById('txtWordWrap').addEventListener('click', () => {
    const button = document.getElementById('txtWordWrap');
    const isWrapped = editor.style.whiteSpace === 'pre-wrap';
    editor.style.whiteSpace = isWrapped ? 'pre' : 'pre-wrap';
    button.classList.toggle('active', !isWrapped);
});

document.getElementById('txtEncoding').addEventListener('change', (e) => {
    encodingStatus.textContent = e.target.value;
});

// Markdown Controls
function insertMarkdown(before, after = '') {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    const newText = before + (selectedText || 'text') + after;
    const textNode = document.createTextNode(newText);
    
    range.deleteContents();
    range.insertNode(textNode);
    
    updatePreview();
}

document.getElementById('mdBold').addEventListener('click', () => insertMarkdown('**', '**'));
document.getElementById('mdItalic').addEventListener('click', () => insertMarkdown('*', '*'));
document.getElementById('mdHeading').addEventListener('click', () => insertMarkdown('# '));
document.getElementById('mdList').addEventListener('click', () => insertMarkdown('- '));
document.getElementById('mdLink').addEventListener('click', () => insertMarkdown('[', '](url)'));
document.getElementById('mdImage').addEventListener('click', () => insertMarkdown('![alt text](', ')'));
document.getElementById('mdCode').addEventListener('click', () => {
    const selection = window.getSelection();
    const text = selection.toString();
    if (text.includes('\n')) {
        insertMarkdown('```\n', '\n```');
    } else {
        insertMarkdown('`', '`');
    }
});
document.getElementById('mdTable').addEventListener('click', () => {
    insertMarkdown('| Header 1 | Header 2 |\n| --------- | --------- |\n| Cell 1 | Cell 2 |');
});
document.getElementById('mdQuote').addEventListener('click', () => insertMarkdown('> '));
document.getElementById('mdHorizontalRule').addEventListener('click', () => insertMarkdown('---\n'));

// Rich Text Controls
document.getElementById('rtfFont').addEventListener('change', (e) => {
    editor.style.fontFamily = e.target.value;
});

document.getElementById('rtfFontSize').addEventListener('change', (e) => {
    editor.style.fontSize = `${e.target.value}px`;
});

// Text style buttons
['rtfBold', 'rtfItalic', 'rtfUnderline'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => {
        const button = document.getElementById(id);
        const command = id.replace('rtf', '').toLowerCase();
        document.execCommand(command, false);
        
        // Check if the command is active
        const isActive = document.queryCommandState(command);
        button.classList.toggle('active', isActive);
    });
});

document.getElementById('rtfTextColor').addEventListener('input', (e) => {
    document.execCommand('foreColor', false, e.target.value);
});

// Alignment buttons
['Left', 'Center', 'Right'].forEach(align => {
    const id = `rtfAlign${align}`;
    document.getElementById(id).addEventListener('click', () => {
        const button = document.getElementById(id);
        const command = `justify${align}`;
        document.execCommand(command, false);
        
        // Remove active class from all alignment buttons
        ['Left', 'Center', 'Right'].forEach(a => {
            document.getElementById(`rtfAlign${a}`).classList.remove('active');
        });
        
        // Add active class to clicked button
        button.classList.add('active');
    });
});

// List buttons
['rtfBulletList', 'rtfNumberList'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => {
        const button = document.getElementById(id);
        const command = id === 'rtfBulletList' ? 'insertUnorderedList' : 'insertOrderedList';
        document.execCommand(command, false);
        
        // Check if the command is active
        const isActive = document.queryCommandState(command);
        button.classList.toggle('active', isActive);
    });
});

// File operations
document.getElementById('newFile').addEventListener('click', () => {
    editor.textContent = '';
    currentFilePath = null;
    fileStatus.textContent = 'New Document';
    updatePreview();
    updateWordCount();
});

document.getElementById('openFile').addEventListener('click', async () => {
    const result = await ipcRenderer.invoke('open-file');
    if (result) {
        editor.textContent = result.content;
        currentFilePath = result.filePath;
        fileStatus.textContent = currentFilePath;
        
        // Set file type based on extension
        const extension = result.filePath.split('.').pop();
        if (['txt', 'md', 'rtf'].includes(extension)) {
            fileTypeSelect.value = extension;
            setFileType(extension);
        }
        
        updatePreview();
        updateWordCount();
    }
});

document.getElementById('saveFile').addEventListener('click', async () => {
    const content = editor.textContent;
    const newPath = await ipcRenderer.invoke('save-file', {
        content,
        filePath: currentFilePath,
        fileType: currentFileType
    });
    if (newPath) {
        currentFilePath = newPath;
        fileStatus.textContent = currentFilePath;
    }
});

document.getElementById('saveFileAs').addEventListener('click', async () => {
    const content = editor.textContent;
    const newPath = await ipcRenderer.invoke('save-file', {
        content,
        filePath: currentFilePath,
        fileType: currentFileType,
        saveAs: true
    });
    if (newPath) {
        currentFilePath = newPath;
        fileStatus.textContent = currentFilePath;
    }
});

// Dark mode toggle
document.getElementById('toggleDarkMode').addEventListener('click', () => {
    const button = document.getElementById('toggleDarkMode');
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode');
    button.classList.toggle('active', isDarkMode);
});

// Preview toggle
document.getElementById('togglePreview').addEventListener('click', () => {
    if (currentFileType !== 'md') return;
    const button = document.getElementById('togglePreview');
    preview.classList.toggle('show');
    editor.style.flex = preview.classList.contains('show') ? '0.5' : '1';
    button.classList.toggle('active', preview.classList.contains('show'));
});

// Live preview update
let previewTimeout;
editor.addEventListener('input', () => {
    clearTimeout(previewTimeout);
    previewTimeout = setTimeout(() => {
        updatePreview();
        updateWordCount();
    }, 300);
});

function updatePreview() {
    if (currentFileType !== 'md') return;
    
    const content = editor.textContent;
    if (!content) {
        preview.innerHTML = '';
        return;
    }
    
    try {
        preview.innerHTML = marked.parse(content);
        // Apply syntax highlighting to code blocks
        preview.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightBlock(block);
        });
    } catch (error) {
        console.error('Error updating preview:', error);
    }
}

// Update active states when clicking in editor
editor.addEventListener('mouseup', () => {
    // Update text style buttons
    ['bold', 'italic', 'underline'].forEach(command => {
        const button = document.getElementById(`rtf${command.charAt(0).toUpperCase() + command.slice(1)}`);
        const isActive = document.queryCommandState(command);
        button.classList.toggle('active', isActive);
    });
    
    // Update alignment buttons
    ['Left', 'Center', 'Right'].forEach(align => {
        const button = document.getElementById(`rtfAlign${align}`);
        const isActive = document.queryCommandState(`justify${align}`);
        button.classList.toggle('active', isActive);
    });
    
    // Update list buttons
    const bulletListButton = document.getElementById('rtfBulletList');
    const numberListButton = document.getElementById('rtfNumberList');
    bulletListButton.classList.toggle('active', document.queryCommandState('insertUnorderedList'));
    numberListButton.classList.toggle('active', document.queryCommandState('insertOrderedList'));
});

// Initialize
updateWordCount();
updatePreview();
