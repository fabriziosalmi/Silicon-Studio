import { useState, useEffect, useRef, memo } from 'react'
import ReactMarkdown from 'react-markdown'

const DEBOUNCE_MS = 120

/**
 * Custom components for ReactMarkdown — dark-themed code blocks.
 */
const markdownComponents = {
  code({ className, children, ...props }: React.ComponentPropsWithoutRef<'code'> & { className?: string }) {
    const isBlock = className?.startsWith('language-')
    if (isBlock) {
      return (
        <pre className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 my-2 overflow-x-auto">
          <code className={`text-xs font-mono text-gray-200 ${className}`} {...props}>
            {children}
          </code>
        </pre>
      )
    }
    return (
      <code className="bg-white/[0.06] px-1.5 py-0.5 rounded text-[13px] font-mono text-blue-300" {...props}>
        {children}
      </code>
    )
  },
  pre({ children }: React.ComponentPropsWithoutRef<'pre'>) {
    // Let the code component handle the <pre> wrapper for fenced blocks
    return <>{children}</>
  },
}

const MemoizedMarkdown = memo(function MemoizedMarkdown({ content }: { content: string }) {
  return <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
})

/**
 * Renders markdown with debounced updates during streaming.
 */
export function StreamingMarkdown({ content }: { content: string }) {
  const [renderedContent, setRenderedContent] = useState(content)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevLenRef = useRef(content.length)

  useEffect(() => {
    const isGrowing = content.length > prevLenRef.current
    prevLenRef.current = content.length

    if (!isGrowing) {
      if (timerRef.current) clearTimeout(timerRef.current)
      setRenderedContent(content)
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setRenderedContent(content)
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [content])

  const tail = content.slice(renderedContent.length)

  return (
    <>
      <MemoizedMarkdown content={renderedContent} />
      {tail && <span className="whitespace-pre-wrap">{tail}</span>}
    </>
  )
}
