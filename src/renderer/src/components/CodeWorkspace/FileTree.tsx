import { useState, memo, useCallback } from 'react'
import { FolderOpen, FolderClosed, FileCode, FileText, ChevronRight, ChevronDown } from 'lucide-react'

export interface TreeNode {
  name: string
  path: string
  type: 'file' | 'dir'
  children?: TreeNode[]
}

interface FileTreeProps {
  tree: TreeNode | null
  onFileSelect: (path: string) => void
  activeFile: string | null
}

const FILE_ICON_MAP: Record<string, string> = {
  '.py': 'text-yellow-400',
  '.ts': 'text-blue-400',
  '.tsx': 'text-blue-400',
  '.js': 'text-yellow-300',
  '.jsx': 'text-yellow-300',
  '.json': 'text-green-400',
  '.md': 'text-gray-400',
  '.css': 'text-pink-400',
  '.html': 'text-orange-400',
  '.yaml': 'text-purple-400',
  '.yml': 'text-purple-400',
  '.toml': 'text-gray-400',
  '.sh': 'text-green-300',
}

function getFileColor(name: string): string {
  const ext = name.substring(name.lastIndexOf('.'))
  return FILE_ICON_MAP[ext] || 'text-gray-500'
}

function isCodeFile(name: string): boolean {
  const codeExts = ['.py', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.rs', '.go', '.java', '.c', '.cpp', '.h', '.rb', '.php', '.swift', '.sh']
  const ext = name.substring(name.lastIndexOf('.'))
  return codeExts.includes(ext)
}

const TreeItem = memo(function TreeItem({
  node,
  depth,
  onFileSelect,
  activeFile,
}: {
  node: TreeNode
  depth: number
  onFileSelect: (path: string) => void
  activeFile: string | null
}) {
  const [expanded, setExpanded] = useState(depth < 1)

  const handleClick = useCallback(() => {
    if (node.type === 'dir') {
      setExpanded(prev => !prev)
    } else {
      onFileSelect(node.path)
    }
  }, [node.type, node.path, onFileSelect])

  const isActive = node.type === 'file' && node.path === activeFile
  const paddingLeft = 8 + depth * 16

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick() }}
        className={`flex items-center gap-1.5 py-[3px] pr-2 cursor-pointer text-[12px] transition-colors hover:bg-white/5 ${
          isActive ? 'bg-blue-500/15 text-blue-300' : 'text-gray-400'
        }`}
        style={{ paddingLeft }}
      >
        {node.type === 'dir' ? (
          <>
            <span className="text-gray-600 w-3.5 flex justify-center shrink-0">
              {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </span>
            {expanded ? (
              <FolderOpen size={14} className="text-blue-400/70 shrink-0" />
            ) : (
              <FolderClosed size={14} className="text-blue-400/50 shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-3.5 shrink-0" />
            {isCodeFile(node.name) ? (
              <FileCode size={14} className={`${getFileColor(node.name)} shrink-0`} />
            ) : (
              <FileText size={14} className={`${getFileColor(node.name)} shrink-0`} />
            )}
          </>
        )}
        <span className="truncate">{node.name}</span>
      </div>

      {node.type === 'dir' && expanded && node.children?.map(child => (
        <TreeItem
          key={child.path}
          node={child}
          depth={depth + 1}
          onFileSelect={onFileSelect}
          activeFile={activeFile}
        />
      ))}
    </>
  )
})

export function FileTree({ tree, onFileSelect, activeFile }: FileTreeProps) {
  if (!tree) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-gray-600">
        No workspace loaded
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden py-1 select-none">
      {tree.children?.map(child => (
        <TreeItem
          key={child.path}
          node={child}
          depth={0}
          onFileSelect={onFileSelect}
          activeFile={activeFile}
        />
      ))}
    </div>
  )
}
