import { Suspense, lazy, useRef, useCallback, useEffect, type ComponentProps } from 'react'
import { Loader2 } from 'lucide-react'
import type MonacoEditorType from '@monaco-editor/react'

type EditorProps = ComponentProps<typeof MonacoEditorType>

const Editor = lazy(() => import('@monaco-editor/react'))

interface MonacoEditorProps {
  filePath: string
  content: string
  language: string
  onSave: (path: string, content: string) => Promise<void>
  onChange: (content: string) => void
}

function EditorFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <Loader2 size={16} className="animate-spin" />
        Loading editor...
      </div>
    </div>
  )
}

export function MonacoEditor({ filePath, content, language, onSave, onChange }: MonacoEditorProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null)
  // Refs to avoid stale closures in Monaco's addCommand callback
  const filePathRef = useRef(filePath)
  const onSaveRef = useRef(onSave)
  filePathRef.current = filePath
  onSaveRef.current = onSave

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor

    // Cmd+S to save — uses refs to avoid stale closure
    editor.addCommand(
      // Monaco.KeyMod.CtrlCmd | Monaco.KeyCode.KeyS
      2048 | 49, // CtrlCmd = 2048, KeyS = 49
      () => {
        const currentContent = editor.getValue()
        onSaveRef.current(filePathRef.current, currentContent)
      }
    )

    // Context menu actions for selected code → agent
    const actions = [
      { id: 'nano.explain', label: 'NanoCore: Explain This', prompt: 'explain this code:' },
      { id: 'nano.fix', label: 'NanoCore: Fix This', prompt: 'fix this code:' },
      { id: 'nano.refactor', label: 'NanoCore: Refactor', prompt: 'refactor this code:' },
      { id: 'nano.tests', label: 'NanoCore: Write Tests', prompt: 'write tests for this code:' },
      { id: 'nano.optimize', label: 'NanoCore: Optimize', prompt: 'optimize this code:' },
    ]

    for (const action of actions) {
      editor.addAction({
        id: action.id,
        label: action.label,
        contextMenuGroupId: '9_nanocore',
        contextMenuOrder: actions.indexOf(action) + 1,
        precondition: 'editorHasSelection',
        keybindings: [],
        run: (ed: any) => {
          const selection = ed.getModel()?.getValueInRange(ed.getSelection())
          if (!selection) return
          const fullPrompt = `${action.prompt}\n\`\`\`\n${selection}\n\`\`\``
          window.dispatchEvent(new CustomEvent('nanocore-prompt', { detail: fullPrompt }))
        },
      })
    }

    // Group separator for NanoCore actions
    editor.addAction({
      id: 'nano.separator',
      label: '──────────',
      contextMenuGroupId: '9_nanocore',
      contextMenuOrder: 0,
      precondition: monaco.editor.EditorContextKeys.hasNonEmptySelection?.key || 'editorHasSelection',
      run: () => {},
    })
  }, [])

  // Listen for "Apply" from code block snippets in agent output
  useEffect(() => {
    const handler = (e: Event) => {
      const code = (e as CustomEvent).detail as string
      const editor = editorRef.current
      if (!editor || !code) return
      const selection = editor.getSelection()
      if (selection && !selection.isEmpty()) {
        // Replace selection
        editor.executeEdits('nanocore-apply', [{
          range: selection,
          text: code,
        }])
      } else {
        // Insert at cursor
        const pos = editor.getPosition()
        if (pos) {
          editor.executeEdits('nanocore-apply', [{
            range: { startLineNumber: pos.lineNumber, startColumn: pos.column, endLineNumber: pos.lineNumber, endColumn: pos.column },
            text: code,
          }])
        }
      }
      editor.focus()
    }
    window.addEventListener('nanocore-apply-snippet', handler)
    return () => window.removeEventListener('nanocore-apply-snippet', handler)
  }, [])

  const handleChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      onChange(value)
    }
  }, [onChange])

  const editorProps: EditorProps = {
    height: '100%',
    language,
    value: content,
    theme: 'vs-dark',
    onMount: handleEditorDidMount,
    onChange: handleChange,
    options: {
      fontSize: 13,
      fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      padding: { top: 8 },
      lineNumbers: 'on',
      renderLineHighlight: 'line',
      bracketPairColorization: { enabled: true },
      wordWrap: 'off',
      tabSize: 2,
      automaticLayout: true,
      smoothScrolling: true,
      cursorSmoothCaretAnimation: 'on',
    },
  }

  return (
    <Suspense fallback={<EditorFallback />}>
      <Editor {...editorProps} />
    </Suspense>
  )
}
