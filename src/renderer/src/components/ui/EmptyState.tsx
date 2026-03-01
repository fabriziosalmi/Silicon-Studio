import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-600 mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-medium text-gray-400 mb-1">{title}</h3>
      {description && <p className="text-xs text-gray-600 text-center max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
