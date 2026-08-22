interface ProgressBarProps {
  progress: number // 0 - 100
  label?: string
  statusMessage?: string
  color?: 'primary' | 'accent' | 'success'
  showPercentage?: boolean
}

export function ProgressBar({
  progress,
  label,
  statusMessage,
  color = 'primary',
  showPercentage = true,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress))

  const colorStyles = {
    primary: 'from-blue-500 to-indigo-500 shadow-blue-500/30',
    accent: 'from-violet-500 to-purple-500 shadow-violet-500/30',
    success: 'from-emerald-500 to-teal-500 shadow-emerald-500/30',
  }

  return (
    <div className="w-full space-y-2">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-text-primary">{label}</span>
          {showPercentage && <span className="font-semibold text-text-muted">{clamped}%</span>}
        </div>
      )}

      {/* Progress Track */}
      <div className="w-full h-2.5 bg-surface-subtle border border-border/80 rounded-full overflow-hidden p-[1px]">
        <div
          className={`h-full bg-gradient-to-r ${colorStyles[color]} rounded-full transition-all duration-300 shadow-sm relative overflow-hidden`}
          style={{ width: `${clamped}%` }}
        >
          {/* Animated shimmer glow */}
          <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12" />
        </div>
      </div>

      {statusMessage && (
        <p className="text-xs text-text-muted animate-pulse">{statusMessage}</p>
      )}
    </div>
  )
}
