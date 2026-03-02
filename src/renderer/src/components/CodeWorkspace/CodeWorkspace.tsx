import { useState, useEffect, useCallback, useRef } from 'react'
import { X, Circle, Save, FolderSearch, Settings as SettingsIcon } from 'lucide-react'
import { FileTree } from './FileTree'
import { MonacoEditor } from './MonacoEditor'
import { apiClient } from '../../api/client'
import type { TreeNode } from './FileTree'

interface OpenFile {
  path: string
  name: string
  content: string
  language: string
  dirty: boolean
  savedContent: string
}

export function CodeWorkspace() {
  const [tree, setTree] = useState<TreeNode | null>(null)
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([])
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [workspaceDir, setWorkspaceDir] = useState<string | null>(() =>
    localStorage.getItem('silicon-studio-workspace-dir')
  )
  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Listen for workspace directory changes from Settings
  useEffect(() => {
    const handler = (e: Event) => {
      const dir = (e as CustomEvent).detail
      setWorkspaceDir(dir)
    }
    window.addEventListener('workspace-dir-changed', handler)
    return () => window.removeEventListener('workspace-dir-changed', handler)
  }, [])

  // Load file tree when workspace dir changes
  useEffect(() => {
    if (!workspaceDir) {
      setTree(null)
      return
    }
    setLoading(true)
    apiClient.workspace.tree(workspaceDir)
      .then(setTree)
      .catch(() => setTree(null))
      .finally(() => setLoading(false))
  }, [workspaceDir])

  // Listen for "open file" signals from the terminal (diff proposals)
  useEffect(() => {
    const handler = (e: Event) => {
      const path = (e as CustomEvent).detail
      if (path && typeof path === 'string') {
        handleFileSelect(path)
      }
    }
    window.addEventListener('workspace-open-file', handler)
    return () => window.removeEventListener('workspace-open-file', handler)
  }, [])

  const handleFileSelect = useCallback(async (path: string) => {
    // Check if already open
    const existing = openFiles.find(f => f.path === path)
    if (existing) {
      setActiveFile(path)
      return
    }

    try {
      const { content, language } = await apiClient.workspace.readFile(path)
      const name = path.split('/').pop() || path
      setOpenFiles(prev => [...prev, { path, name, content, language, dirty: false, savedContent: content }])
      setActiveFile(path)
    } catch {
      // Failed to read file
    }
  }, [openFiles])

  const handleCloseFile = useCallback((path: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setOpenFiles(prev => prev.filter(f => f.path !== path))
    if (activeFile === path) {
      setActiveFile(() => {
        const remaining = openFiles.filter(f => f.path !== path)
        return remaining.length > 0 ? remaining[remaining.length - 1].path : null
      })
    }
  }, [activeFile, openFiles])

  const handleSave = useCallback(async (path: string, content: string) => {
    try {
      await apiClient.workspace.saveFile(path, content)
      setOpenFiles(prev => prev.map(f =>
        f.path === path ? { ...f, dirty: false, savedContent: content, content } : f
      ))
      setSaveStatus('Saved')
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => setSaveStatus(null), 2000)
    } catch {
      setSaveStatus('Save failed')
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => setSaveStatus(null), 3000)
    }
  }, [])

  const handleContentChange = useCallback((path: string, content: string) => {
    setOpenFiles(prev => prev.map(f =>
      f.path === path ? { ...f, content, dirty: content !== f.savedContent } : f
    ))
  }, [])

  const active = openFiles.find(f => f.path === activeFile)

  // Empty state: no workspace configured
  if (!workspaceDir) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3 max-w-sm">
          <FolderSearch size={40} className="mx-auto text-gray-600" />
          <h3 className="text-sm font-medium text-gray-400">No workspace configured</h3>
          <p className="text-xs text-gray-600">
            Go to Settings and select a project directory under "Codebase Index" to enable the code workspace.
          </p>
          <button
            onClick={() => {
              // Dispatch event to switch to settings tab
              window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'settings' }))
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded text-xs text-blue-400 transition-colors"
          >
            <SettingsIcon size={12} />
            Open Settings
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      {openFiles.length > 0 && (
        <div className="flex items-center border-b border-white/5 bg-black/20 overflow-x-auto shrink-0">
          {openFiles.map(f => (
            <div
              key={f.path}
              role="button"
              tabIndex={0}
              onClick={() => setActiveFile(f.path)}
              onKeyDown={(e) => { if (e.key === 'Enter') setActiveFile(f.path) }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border-r border-white/5 cursor-pointer shrink-0 transition-colors ${
                f.path === activeFile
                  ? 'bg-[#1e1e1e] text-white'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {f.dirty && <Circle size={6} className="text-blue-400 fill-blue-400" />}
              <span className="truncate max-w-[120px]">{f.name}</span>
              <button
                type="button"
                onClick={(e) => handleCloseFile(f.path, e)}
                className="ml-1 p-0.5 rounded hover:bg-white/10 text-gray-600 hover:text-white transition-colors"
              >
                <X size={10} />
              </button>
            </div>
          ))}
          {saveStatus && (
            <div className="ml-auto px-3 py-1.5 text-[10px] text-gray-500 flex items-center gap-1">
              <Save size={10} />
              {saveStatus}
            </div>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File tree sidebar */}
        <div className="w-56 border-r border-white/5 bg-black/20 shrink-0 overflow-hidden">
          <div className="px-2 py-1.5 text-[10px] font-bold text-gray-600 uppercase tracking-wide border-b border-white/5 truncate">
            {tree?.name || 'Explorer'}
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-600 text-xs">
              Loading...
            </div>
          ) : (
            <FileTree tree={tree} onFileSelect={handleFileSelect} activeFile={activeFile} />
          )}
        </div>

        {/* Editor area */}
        <div className="flex-1 min-w-0">
          {active ? (
            <MonacoEditor
              key={active.path}
              filePath={active.path}
              content={active.content}
              language={active.language}
              onSave={handleSave}
              onChange={(content) => handleContentChange(active.path, content)}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-[#1e1e1e]">
              <p className="text-sm text-gray-600">Select a file to open</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
