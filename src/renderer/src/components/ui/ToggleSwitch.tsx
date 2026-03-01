interface ToggleSwitchProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  size?: 'sm' | 'md'
  disabled?: boolean
  label?: string
}

export function ToggleSwitch({ enabled, onChange, size = 'md', disabled = false, label }: ToggleSwitchProps) {
  const track = size === 'sm' ? 'w-7 h-4' : 'w-9 h-5'
  const thumb = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'
  const translate = size === 'sm' ? 'translate-x-3.5' : 'translate-x-[18px]'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`
        relative inline-flex shrink-0 cursor-pointer items-center rounded-full
        transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:ring-offset-1 focus:ring-offset-transparent
        ${track}
        ${enabled ? 'bg-blue-500' : 'bg-white/10'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
      `}
    >
      <span
        className={`
          inline-block rounded-full bg-white shadow-sm
          transition-transform duration-200 ease-in-out
          ${thumb}
          ${enabled ? translate : 'translate-x-[3px]'}
        `}
      />
    </button>
  )
}
