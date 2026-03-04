/** Type definitions for the Electron preload API exposed via contextBridge. */

interface ElectronAPI {
  ping: () => Promise<void>
  selectFile: () => Promise<string | null>
  selectDirectory: () => Promise<string | null>
  getBackendPort: () => Promise<number>
  getLogPath: () => Promise<string>
  openPath: (path: string) => Promise<string>
  installUpdate: () => Promise<void>
  onUpdateDownloaded: (callback: (version: string) => void) => (() => void) | void
}

interface Window {
  electronAPI?: ElectronAPI
}
