declare interface Window {
    marked: {
        parse: (text: string) => string;
    };
    hljs: {
        highlightElement: (element: HTMLElement) => void;
    };
}

declare interface IpcMainInvokeEvent {
    preventDefault: () => void;
}

declare interface DialogFilter {
    name: string;
    extensions: string[];
}

declare interface OpenDialogOptions {
    title?: string;
    defaultPath?: string;
    buttonLabel?: string;
    filters?: DialogFilter[];
    properties?: string[];
}

declare interface SaveDialogOptions {
    title?: string;
    defaultPath?: string;
    buttonLabel?: string;
    filters?: DialogFilter[];
}

declare interface MessageBoxOptions {
    type: string;
    title: string;
    message: string;
    detail?: string;
}

declare interface FileDropResult {
    content: string;
    filePath: string;
    fileType: string;
}

declare interface SaveFileOptions {
    content: string;
    filePath: string;
    fileType: string;
    saveAs?: boolean;
}

declare interface AutoSaveOptions {
    content: string;
    filePath: string;
}

declare const ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => Promise<any>;
};
