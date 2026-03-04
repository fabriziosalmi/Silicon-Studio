import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    ping: () => ipcRenderer.invoke('ping'),
    selectFile: () => ipcRenderer.invoke('dialog:openFile'),
    selectDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    getBackendPort: () => ipcRenderer.invoke('get-backend-port'),
    getLogPath: () => ipcRenderer.invoke('get-log-path'),
    openPath: (path: string) => ipcRenderer.invoke('open-path', path),
    installUpdate: () => ipcRenderer.invoke('install-update'),
    onUpdateDownloaded: (callback: (version: string) => void) => {
        const handler = (_event: Electron.IpcRendererEvent, version: string) => callback(version);
        ipcRenderer.on('update-downloaded', handler);
        // Return a cleanup function to remove the listener
        return () => ipcRenderer.removeListener('update-downloaded', handler);
    },
});
