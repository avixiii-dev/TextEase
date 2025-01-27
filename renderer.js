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
        checkForBackup();
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

// Drag and drop handling
document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Add visual feedback
    document.body.classList.add('drag-over');
});

document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remove visual feedback
    document.body.classList.remove('drag-over');
});

document.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remove visual feedback
    document.body.classList.remove('drag-over');
    
    // Get the dropped file
    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    // Check if it's a text file
    const validExtensions = ['.txt', '.md', '.rtf'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
        alert('Only text files (.txt, .md, .rtf) are supported');
        return;
    }
    
    // Handle the dropped file
    const result = await ipcRenderer.invoke('handle-file-drop', file.path);
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

// Add visual feedback styles
const style = document.createElement('style');
style.textContent = `
    body.drag-over::after {
        content: 'Drop text file here';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        z-index: 9999;
    }
    
    .editor {
        position: relative;
    }
    
    .editor.drag-over {
        border: 2px dashed var(--border-color);
    }
`;
document.head.appendChild(style);

// Auto-save functionality
let autoSaveTimeout;
const AUTO_SAVE_DELAY = 5000; // 5 seconds

function triggerAutoSave() {
    if (!currentFilePath) return;
    
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(async () => {
        const content = editor.textContent;
        const saved = await ipcRenderer.invoke('auto-save', { content, filePath: currentFilePath });
        if (saved) {
            // Show temporary save indicator
            const indicator = document.createElement('div');
            indicator.className = 'save-indicator';
            indicator.textContent = 'Auto-saved';
            document.body.appendChild(indicator);
            
            setTimeout(() => {
                indicator.classList.add('fade-out');
                setTimeout(() => indicator.remove(), 500);
            }, 1500);
        }
    }, AUTO_SAVE_DELAY);
}

// Add auto-save trigger to editor input
editor.addEventListener('input', () => {
    triggerAutoSave();
    updatePreview();
    updateWordCount();
});

// Add save indicator styles
const saveIndicatorStyle = document.createElement('style');
saveIndicatorStyle.textContent = `
    .save-indicator {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--bg-color);
        color: var(--text-color);
        padding: 8px 16px;
        border-radius: 4px;
        border: 1px solid var(--border-color);
        font-size: 12px;
        opacity: 1;
        transition: opacity 0.5s ease;
        z-index: 1000;
    }
    
    .save-indicator.fade-out {
        opacity: 0;
    }
`;
document.head.appendChild(saveIndicatorStyle);

// Search and Replace functionality
let currentSearchIndex = -1;
let searchMatches = [];

function getEditorText() {
    return editor.innerText || editor.textContent;
}

function setEditorText(text) {
    editor.textContent = text;
    updatePreview();
    triggerAutoSave();
}

function updateSearchButtonStates() {
    const prevBtn = document.getElementById('searchPrevBtn');
    const nextBtn = document.getElementById('searchNextBtn');
    const hasMatches = searchMatches.length > 0;
    
    if (prevBtn && nextBtn) {
        prevBtn.disabled = !hasMatches;
        nextBtn.disabled = !hasMatches;
    }
}

function performSearch(searchText, caseSensitive = false) {
    const content = getEditorText();
    searchMatches = [];
    currentSearchIndex = -1;
    
    if (!searchText) {
        clearSearchHighlights();
        updateSearchButtonStates();
        return;
    }

    try {
        // Create regex for search
        let flags = 'g';
        if (!caseSensitive) flags += 'i';
        const regex = new RegExp(searchText, flags);
        
        // Find all matches
        let match;
        while ((match = regex.exec(content)) !== null) {
            searchMatches.push({
                start: match.index,
                end: match.index + match[0].length,
                text: match[0]
            });
        }
        
        if (searchMatches.length > 0) {
            currentSearchIndex = 0;
        }
        
        highlightMatches();
        updateSearchStatus();
        updateSearchButtonStates();
    } catch (error) {
        console.error('Search error:', error);
        updateSearchButtonStates();
    }
}

function clearSearchHighlights() {
    const range = document.createRange();
    range.selectNodeContents(editor);
    const content = range.extractContents();
    
    // Remove all highlight spans
    const highlights = content.querySelectorAll('.search-highlight');
    highlights.forEach(highlight => {
        const text = document.createTextNode(highlight.textContent);
        highlight.parentNode.replaceChild(text, highlight);
    });
    
    editor.appendChild(content);
    updateSearchStatus();
    updateSearchButtonStates();
}

function highlightMatches() {
    if (searchMatches.length === 0) {
        clearSearchHighlights();
        return;
    }

    const content = getEditorText();
    let html = '';
    let lastIndex = 0;

    searchMatches.forEach((match, index) => {
        // Add text before match
        html += content.substring(lastIndex, match.start);
        
        // Add highlighted match
        const matchClass = index === currentSearchIndex ? 'search-highlight current-match' : 'search-highlight';
        html += `<span class="${matchClass}">${match.text}</span>`;
        
        lastIndex = match.end;
    });

    // Add remaining text
    html += content.substring(lastIndex);
    
    // Update editor content
    editor.innerHTML = html;
    
    // Scroll current match into view
    if (currentSearchIndex >= 0) {
        const currentMatch = editor.querySelector('.current-match');
        if (currentMatch) {
            currentMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

function updateSearchStatus() {
    const statusEl = document.getElementById('searchStatus');
    if (!statusEl) return;

    if (searchMatches.length === 0) {
        statusEl.textContent = 'No matches';
    } else {
        statusEl.textContent = `${currentSearchIndex + 1}/${searchMatches.length} matches`;
    }
}

function navigateSearch(direction) {
    if (searchMatches.length === 0) return;
    
    currentSearchIndex += direction;
    if (currentSearchIndex >= searchMatches.length) {
        currentSearchIndex = 0;
    } else if (currentSearchIndex < 0) {
        currentSearchIndex = searchMatches.length - 1;
    }
    
    highlightMatches();
    updateSearchStatus();
}

// Add event listeners for search navigation
document.getElementById('searchNextBtn').addEventListener('click', () => {
    navigateSearch(1);
});

document.getElementById('searchPrevBtn').addEventListener('click', () => {
    navigateSearch(-1);
});

// Add keyboard shortcuts for search navigation
editor.addEventListener('keydown', (e) => {
    if (e.key === 'F3' || (e.ctrlKey && e.key === 'g')) {
        e.preventDefault();
        navigateSearch(1);
    } else if (e.shiftKey && e.key === 'F3') {
        e.preventDefault();
        navigateSearch(-1);
    } else if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
});

// Add event listeners for search and replace
document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchText = e.target.value;
    performSearch(searchText);
});

document.getElementById('searchBtn').addEventListener('click', () => {
    const searchText = document.getElementById('searchInput').value;
    performSearch(searchText);
});

document.getElementById('replaceBtn').addEventListener('click', () => {
    const replaceText = document.getElementById('replaceInput').value;
    replaceMatch(replaceText);
});

document.getElementById('replaceAllBtn').addEventListener('click', () => {
    const searchText = document.getElementById('searchInput').value;
    const replaceText = document.getElementById('replaceInput').value;
    replaceAll(searchText, replaceText);
});

function replaceMatch(replaceText) {
    if (currentSearchIndex === -1 || searchMatches.length === 0) return;
    
    const content = getEditorText();
    const match = searchMatches[currentSearchIndex];
    const newContent = content.substring(0, match.start) + 
                      replaceText + 
                      content.substring(match.end);
    
    setEditorText(newContent);
    
    // Adjust indices for remaining matches
    const lengthDiff = replaceText.length - match.text.length;
    for (let i = currentSearchIndex + 1; i < searchMatches.length; i++) {
        searchMatches[i].start += lengthDiff;
        searchMatches[i].end += lengthDiff;
    }
    
    // Remove the replaced match
    searchMatches.splice(currentSearchIndex, 1);
    if (currentSearchIndex >= searchMatches.length) {
        currentSearchIndex = searchMatches.length - 1;
    }
    
    // Re-highlight remaining matches
    highlightMatches();
    updateSearchStatus();
}

function replaceAll(searchText, replaceText, caseSensitive = false) {
    if (!searchText) return;

    const content = getEditorText();
    let flags = 'g';
    if (!caseSensitive) flags += 'i';
    
    try {
        const regex = new RegExp(searchText, flags);
        const newContent = content.replace(regex, replaceText);
        setEditorText(newContent);
        
        // Clear search state
        searchMatches = [];
        currentSearchIndex = -1;
        clearSearchHighlights();
        updateSearchStatus();
    } catch (error) {
        console.error('Replace error:', error);
    }
}

// Add recovery option
async function checkForBackup() {
    if (!currentFilePath) return;
    
    const backup = await ipcRenderer.invoke('recover-from-backup', currentFilePath);
    if (backup) {
        const response = confirm('A backup was found. Would you like to recover it?');
        if (response) {
            editor.textContent = backup.content;
            updatePreview();
            updateWordCount();
        }
    }
}

// Check for backup when opening file
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
        checkForBackup();
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', async (e) => {
    // Save: Ctrl + S
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        const content = editor.textContent;
        const newPath = await ipcRenderer.invoke('save-file', {
            content,
            filePath: currentFilePath,
            fileType: currentFileType
        });
        if (newPath) {
            currentFilePath = newPath;
            fileStatus.textContent = currentFilePath;
            showSaveIndicator('File saved');
        }
    }
    
    // Save As: Ctrl + Shift + S
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
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
            showSaveIndicator('File saved as ' + newPath);
        }
    }

    // Quick Save: Alt + S (Save without dialog if file exists)
    if (e.altKey && e.key === 's') {
        e.preventDefault();
        if (currentFilePath) {
            const content = editor.textContent;
            await ipcRenderer.invoke('save-file', {
                content,
                filePath: currentFilePath,
                fileType: currentFileType,
                quickSave: true
            });
            showSaveIndicator('File saved');
        } else {
            // If no file path exists, behave like normal save
            const content = editor.textContent;
            const newPath = await ipcRenderer.invoke('save-file', {
                content,
                filePath: currentFilePath,
                fileType: currentFileType
            });
            if (newPath) {
                currentFilePath = newPath;
                fileStatus.textContent = currentFilePath;
                showSaveIndicator('File saved');
            }
        }
    }
});

// Show save indicator
function showSaveIndicator(message) {
    const indicator = document.createElement('div');
    indicator.className = 'save-indicator';
    indicator.textContent = message;
    document.body.appendChild(indicator);
    
    setTimeout(() => {
        indicator.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(indicator);
        }, 500);
    }, 1500);
}

// Initialize
updateWordCount();
updatePreview();
