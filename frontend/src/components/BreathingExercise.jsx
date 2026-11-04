import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Wind, CheckCircle2 } from 'lucide-react'
import Button from './Button'

const TECHNIQUES = {
  '4-7-8': {
    name: '4-7-8 Relaxing Breath',
    description: 'Activates the parasympathetic nervous system to quickly reduce acute tension.',
    phases: [
      { name: 'Inhale', duration: 4, instruction: 'Inhale quietly through your nose' },
      { name: 'Hold', duration: 7, instruction: 'Hold your breath gently' },
      { name: 'Exhale', duration: 8, instruction: 'Exhale completely with a gentle whoosh' },
    ],
  },
  box: {
    name: 'Box Breathing (4-4-4-4)',
    description: 'Balances cognitive focus and steadies heart rate before exams or study sessions.',
    phases: [
      { name: 'Inhale', duration: 4, instruction: 'Inhale slowly for 4 seconds' },
      { name: 'Hold', duration: 4, instruction: 'Hold steady for 4 seconds' },
      { name: 'Exhale', duration: 4, instruction: 'Exhale smoothly for 4 seconds' },
      { name: 'Hold', duration: 4, instruction: 'Hold empty for 4 seconds' },
    ],
  },
}

export default function BreathingExercise() {
  const [techniqueKey, setTechniqueKey] = useState('4-7-8')
  const [isActive, setIsActive] = useState(false)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(TECHNIQUES['4-7-8'].phases[0].duration)
  const [completedCycles, setCompletedCycles] = useState(0)

  const activeTechnique = TECHNIQUES[techniqueKey]
  const currentPhase = activeTechnique.phases[phaseIndex]

  // Timer interval effect
  useEffect(() => {
    let interval = null

    if (isActive) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev > 1) {
            return prev - 1
          } else {
            // Move to next phase
            setPhaseIndex((currIdx) => {
              const nextIdx = (currIdx + 1) % activeTechnique.phases.length
              if (nextIdx === 0) {
                setCompletedCycles((c) => c + 1)
              }
              return nextIdx
            })
            // Reset seconds for the next phase
            const nextIdx = (phaseIndex + 1) % activeTechnique.phases.length
            return activeTechnique.phases[nextIdx].duration
          }
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, phaseIndex, activeTechnique])

  const handleStart = () => {
    setIsActive(true)
  }

  const handlePause = () => {
    setIsActive(false)
  }

  const handleReset = () => {
    setIsActive(false)
    setPhaseIndex(0)
    setSecondsLeft(activeTechnique.phases[0].duration)
    setCompletedCycles(0)
  }

  const handleSwitchTechnique = (key) => {
    setIsActive(false)
    setTechniqueKey(key)
    setPhaseIndex(0)
    setSecondsLeft(TECHNIQUES[key].phases[0].duration)
    setCompletedCycles(0)
  }

  // Calculate circle expansion scale based on phase
  const getCircleScale = () => {
    if (!isActive && completedCycles === 0 && secondsLeft === currentPhase.duration) {
      return 'scale-100'
    }
    if (currentPhase.name === 'Inhale') return 'scale-125'
    if (currentPhase.name === 'Hold') return 'scale-125'
    return 'scale-90' // Exhale
  }

  return (
    <div className="bg-white/80 border border-paper-deep/80 rounded-2xl p-6 sm:p-8 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="eyebrow">Interactive Exercise</span>
            <span className="text-[11px] font-mono text-sage-dark bg-sage/12 px-2 py-0.5 rounded-full border border-sage/20">
              Live Guide
            </span>
          </div>
          <h3 className="font-display font-medium text-pine-deep text-2xl">
            Guided Breath Pacer
          </h3>
          <p className="text-xs text-ink-soft mt-0.5">
            {activeTechnique.description}
          </p>
        </div>

        {/* Technique Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-paper rounded-xl border border-paper-deep self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleSwitchTechnique('4-7-8')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              techniqueKey === '4-7-8'
                ? 'bg-white text-pine-deep shadow-sm font-semibold'
                : 'text-ink-soft hover:text-pine'
            }`}
          >
            4-7-8 Relax
          </button>
          <button
            type="button"
            onClick={() => handleSwitchTechnique('box')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              techniqueKey === 'box'
                ? 'bg-white text-pine-deep shadow-sm font-semibold'
                : 'text-ink-soft hover:text-pine'
            }`}
          >
            Box (4-4-4-4)
          </button>
        </div>
      </div>

      {/* Breathing Visualization Visualizer */}
      <div className="py-8 flex flex-col items-center justify-center relative min-h-[300px]">
        {/* Animated breathing circle */}
        <div className="relative flex items-center justify-center w-52 h-52 sm:w-60 sm:h-60">
          {/* Subtle outer aura */}
          <div
            className={`absolute inset-0 rounded-full bg-pine/10 transition-transform duration-1000 ease-in-out ${getCircleScale()}`}
          />
          {/* Middle pulse ring */}
          <div
            className={`absolute inset-4 rounded-full bg-pine-tint border border-pine/20 transition-transform duration-1000 ease-in-out ${getCircleScale()}`}
          />
          {/* Center core */}
          <div className="relative z-10 text-center flex flex-col items-center justify-center p-4">
            <span className="font-mono text-xs uppercase tracking-widest text-pine font-semibold">
              {currentPhase.name}
            </span>
            <span className="font-mono text-5xl sm:text-6xl font-bold text-pine-deep my-1 tracking-tighter">
              {secondsLeft}
            </span>
            <span className="text-[11px] text-ink-faint font-mono">
              seconds
            </span>
          </div>
        </div>

        {/* Action instruction text */}
        <p className="mt-6 text-sm text-pine-deep font-medium text-center max-w-xs transition-opacity duration-300">
          {isActive ? currentPhase.instruction : 'Click Start to begin guided breathing session'}
        </p>

        {/* Cycle indicator */}
        <div className="mt-2 flex items-center gap-1.5 text-xs font-mono text-ink-faint">
          <CheckCircle2 size={13} className={completedCycles > 0 ? 'text-sage' : 'text-ink-faint'} />
          <span>Completed Cycles: {completedCycles}</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-center gap-3 pt-4 border-t border-paper-deep/60">
        {!isActive ? (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleStart}
            className="gap-2 min-w-[130px]"
          >
            <Play size={16} fill="currentColor" /> Start
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handlePause}
            className="gap-2 min-w-[130px] border-amber text-amber-dark hover:bg-amber/10"
          >
            <Pause size={16} fill="currentColor" /> Pause
          </Button>
        )}

        <button
          type="button"
          onClick={handleReset}
          className="p-2.5 rounded-xl border border-paper-deep bg-paper/50 text-ink-soft hover:text-pine hover:bg-white transition-all flex items-center gap-1.5 text-xs font-medium"
          title="Reset timer"
          aria-label="Reset breathing session"
        >
          <RotateCcw size={15} />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </div>
  )
}
