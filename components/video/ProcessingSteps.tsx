'use client'

import { Check, Loader2, AlertCircle, Film, Sparkles, Video } from 'lucide-react'

export interface StepItem {
  id: string
  title: string
  description?: string
  state: 'pending' | 'active' | 'done' | 'error'
  progress?: number // 0-100
}

interface ProcessingStepsProps {
  steps: StepItem[]
  className?: string
}

export function ProcessingSteps({ steps, className = '' }: ProcessingStepsProps) {
  const getIcon = (id: string, state: StepItem['state'], index: number) => {
    if (state === 'done') {
      return <Check className="w-4 h-4 text-emerald-400" />
    }
    if (state === 'active') {
      return <Loader2 className="w-4 h-4 text-primary-light animate-spin" />
    }
    if (state === 'error') {
      return <AlertCircle className="w-4 h-4 text-red-400" />
    }

    if (id === 'extract') return <Film className="w-3.5 h-3.5 text-text-dim" />
    if (id === 'inpaint') return <Sparkles className="w-3.5 h-3.5 text-text-dim" />
    return <Video className="w-3.5 h-3.5 text-text-dim" />
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {steps.map((step, i) => {
        const isPending = step.state === 'pending'
        const isActive = step.state === 'active'
        const isDone = step.state === 'done'
        const isError = step.state === 'error'

        return (
          <div
            key={step.id}
            className={`p-4 rounded-xl border transition-all duration-300 ${
              isActive
                ? 'bg-primary/10 border-primary/40 shadow-lg shadow-primary/10'
                : isDone
                ? 'bg-emerald-500/5 border-emerald-500/30'
                : isError
                ? 'bg-red-500/10 border-red-500/40'
                : 'bg-surface/50 border-border/60 opacity-60'
            }`}
          >
            <div className="flex items-start gap-3.5">
              {/* Step Badge */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                  isDone
                    ? 'bg-emerald-500/20 border-emerald-500/40'
                    : isActive
                    ? 'bg-primary/20 border-primary/50 shadow-md shadow-primary/30'
                    : isError
                    ? 'bg-red-500/20 border-red-500/50'
                    : 'bg-surface-subtle border-border'
                }`}
              >
                {getIcon(step.id, step.state, i)}
              </div>

              {/* Step Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span
                    className={`text-sm font-semibold truncate ${
                      isDone
                        ? 'text-emerald-300'
                        : isActive
                        ? 'text-white'
                        : isError
                        ? 'text-red-400'
                        : 'text-text-muted'
                    }`}
                  >
                    {step.title}
                  </span>
                  {isActive && step.progress !== undefined && (
                    <span className="text-xs font-mono font-semibold text-primary-light">
                      {step.progress}%
                    </span>
                  )}
                  {isDone && (
                    <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Done
                    </span>
                  )}
                </div>

                {step.description && (
                  <p className="text-xs text-text-dim mb-2.5">{step.description}</p>
                )}

                {/* Progress bar for active state */}
                {(isActive || isDone) && (
                  <div className="w-full h-1.5 bg-background rounded-full overflow-hidden border border-border/50">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isDone
                          ? 'bg-emerald-500 w-full'
                          : 'bg-gradient-to-r from-blue-500 to-accent'
                      }`}
                      style={{
                        width: isDone ? '100%' : `${step.progress || 0}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
