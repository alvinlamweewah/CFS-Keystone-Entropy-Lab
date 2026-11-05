import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import {
  generateSafeSpecimen,
  PasswordEvaluation,
  SECURITY_STAGES,
} from '../utils/passwordEvaluator';

interface PasswordSandboxProps {
  password: string;
  onPasswordChange: (next: string) => void;
  evaluation: PasswordEvaluation;
  onJumpToLeaderboard: () => void;
}

export function PasswordSandbox({
  password,
  onPasswordChange,
  evaluation,
  onJumpToLeaderboard,
}: PasswordSandboxProps) {
  const [showPlaintext, setShowPlaintext] = useState(true);

  const stageTheme = (() => {
    switch (evaluation.stageId) {
      case 'MAXIMUM_SECURITY':
        return {
          barClass: 'bg-emerald-500',
          textClass: 'text-emerald-700 dark:text-emerald-400',
          Icon: ShieldCheck,
        };
      case 'HARDENED':
        return {
          barClass: 'bg-sky-500',
          textClass: 'text-sky-700 dark:text-sky-400',
          Icon: ShieldCheck,
        };
      case 'FORTIFIED':
        return {
          barClass: 'bg-cyan-600 dark:bg-cyan-400',
          textClass: 'text-cyan-700 dark:text-cyan-300',
          Icon: CheckCircle2,
        };
      case 'GUARDED':
        return {
          barClass: 'bg-amber-500',
          textClass: 'text-amber-700 dark:text-amber-400',
          Icon: AlertTriangle,
        };
      default:
        return {
          barClass: 'bg-rose-500',
          textClass: 'text-rose-700 dark:text-rose-400',
          Icon: ShieldAlert,
        };
    }
  })();

  const StageIcon = stageTheme.Icon;

  return (
    <section
      id="evaluator"
      aria-labelledby="evaluator-heading"
      className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
    >
      {/* Left Interactive Stage (7 cols) */}
      <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 flex flex-col justify-between gap-6">
        <div className="space-y-6">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <h2
                id="evaluator-heading"
                className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
              >
                Password Entropy Evaluator
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Evaluated locally in browser memory · Zero network transmission · Max 128 characters
              </p>
            </div>
            <div className="text-sm font-mono tabular-nums text-slate-700 dark:text-slate-300">
              <span>{evaluation.totalXp.toLocaleString('en-US')} XP</span>
              <span className="mx-2 text-slate-400" aria-hidden="true">·</span>
              <span>{evaluation.badgeCount} / 8 Badges</span>
            </div>
          </div>

          {/* Input Field + Visibility & Reset */}
          <div className="space-y-3">
            <label
              htmlFor="candidate-password-input"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Candidate Password or Passphrase
            </label>
            <div className="relative flex items-center">
              <input
                id="candidate-password-input"
                type={showPlaintext ? 'text' : 'password'}
                value={password}
                maxLength={128}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder="Type a password or test a specimen below..."
                onChange={(e) => onPasswordChange(e.target.value)}
                className="w-full rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-4 py-3.5 pr-24 font-mono text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPlaintext((prev) => !prev)}
                  aria-label={showPlaintext ? 'Hide password characters' : 'Show password characters'}
                  className="p-2 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors focus-visible:outline-2 focus-visible:outline-emerald-500"
                >
                  {showPlaintext ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
                {password.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onPasswordChange('')}
                    aria-label="Clear password input"
                    className="p-2 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors focus-visible:outline-2 focus-visible:outline-emerald-500"
                  >
                    <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {/* Interactive Specimen Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">
                Load specimen:
              </span>
              <button
                type="button"
                onClick={() => onPasswordChange(generateSafeSpecimen('weak'))}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
              >
                Common Pattern
              </button>
              <button
                type="button"
                onClick={() => onPasswordChange(generateSafeSpecimen('moderate'))}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
              >
                Mixed Passcode
              </button>
              <button
                type="button"
                onClick={() => onPasswordChange(generateSafeSpecimen('diceware'))}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
              >
                3-Word Passphrase
              </button>
              <button
                type="button"
                onClick={() => onPasswordChange(generateSafeSpecimen('maximum'))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors whitespace-nowrap shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                Generate Max Specimen
              </button>
            </div>
          </div>

          {/* Security Level Progress Bar */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className={`flex items-center gap-2 font-semibold text-sm ${stageTheme.textClass}`}>
                <StageIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{evaluation.stageLabel}</span>
              </div>
              <div className="text-sm font-mono tabular-nums text-slate-700 dark:text-slate-300">
                <span>{evaluation.entropyBits.toFixed(1)} effective bits</span>
                <span className="mx-2 text-slate-400" aria-hidden="true">/</span>
                <span>100.0 target</span>
              </div>
            </div>

            {/* Progress Track using compositor transform scaleX */}
            <div
              role="progressbar"
              aria-label="Password security level progress"
              aria-valuenow={evaluation.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="relative h-3 w-full rounded-md bg-slate-200 dark:bg-slate-800 overflow-hidden"
            >
              <div
                className={`h-full w-full origin-left transition-transform duration-200 ease-out ${stageTheme.barClass}`}
                style={{ transform: `scaleX(${evaluation.progressPercent / 100})` }}
              />
            </div>

            {/* 5-Stage Milestone Scale */}
            <div className="grid grid-cols-5 gap-2 pt-1">
              {SECURITY_STAGES.map((s, idx) => {
                const reached = idx <= evaluation.stageIndex && (evaluation.charLength > 0 || idx === 0);
                return (
                  <div key={s.id} className="space-y-0.5">
                    <div
                      className={`text-xs font-medium truncate ${
                        idx === evaluation.stageIndex
                          ? 'text-slate-900 dark:text-slate-100 font-semibold'
                          : reached
                            ? 'text-slate-700 dark:text-slate-300'
                            : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {s.label.split(' · ')[1]}
                    </div>
                    <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {s.minBits === 100 ? '100+ bits' : `${s.minBits}–${s.maxBits}b`}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              {SECURITY_STAGES[evaluation.stageIndex].summary}
            </p>
          </div>
        </div>

        {/* Quantitative Metrics Strip (Tabular Numerals, Hairline Separators, No Nested Cards) */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Length &amp; Pool</div>
            <div className="mt-1 text-lg font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {evaluation.charLength} chars · R={evaluation.poolSize}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Pattern Deduction</div>
            <div className="mt-1 text-lg font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {evaluation.penaltyBits > 0 ? `-${evaluation.penaltyBits.toFixed(1)} bits` : '0.0 bits'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Search Keyspace</div>
            <div className="mt-1 text-lg font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {evaluation.combinationsScientific}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Offline Crack (100 GH/s)</div>
            <div className="mt-1 text-lg font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100 truncate" title={evaluation.crackTimeDisplay}>
              {evaluation.crackTimeDisplay}
            </div>
          </div>
        </div>
      </div>

      {/* Right Control & Actionable Strength Tips Deck (5 cols) */}
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 flex flex-col justify-between gap-6">
        <div className="space-y-5">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Live Strength Diagnostics &amp; Tips
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Prioritized upgrades ordered by entropy bits gained per keystroke.
            </p>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {evaluation.tips.map((tip) => {
              const Icon =
                tip.priority === 'critical'
                  ? AlertTriangle
                  : tip.priority === 'mastered'
                    ? ShieldCheck
                    : Info;
              const tone =
                tip.priority === 'critical'
                  ? 'text-rose-600 dark:text-rose-400'
                  : tip.priority === 'mastered'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-sky-600 dark:text-sky-400';
              const priorityLabel =
                tip.priority === 'critical'
                  ? 'Critical Fix'
                  : tip.priority === 'mastered'
                    ? 'Maximum Status'
                    : 'Recommended Upgrade';

              return (
                <div key={tip.id} className="py-4 first:pt-1 last:pb-1 space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className={`inline-flex items-center gap-1.5 font-semibold ${tone}`}>
                      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      {priorityLabel}
                    </span>
                    <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {tip.estimatedGain}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {tip.headline}
                  </p>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {tip.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Character Class Matrix & Leaderboard CTA */}
        <div className="pt-5 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums">
            <span className={evaluation.hasLower ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}>
              {evaluation.hasLower ? '✓ a–z (+26)' : '○ a–z (+26)'}
            </span>
            <span aria-hidden="true">·</span>
            <span className={evaluation.hasUpper ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}>
              {evaluation.hasUpper ? '✓ A–Z (+26)' : '○ A–Z (+26)'}
            </span>
            <span aria-hidden="true">·</span>
            <span className={evaluation.hasDigit ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}>
              {evaluation.hasDigit ? '✓ 0–9 (+10)' : '○ 0–9 (+10)'}
            </span>
            <span aria-hidden="true">·</span>
            <span className={evaluation.hasSymbol ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}>
              {evaluation.hasSymbol ? '✓ Symbols (+32)' : '○ Symbols (+32)'}
            </span>
          </div>

          {evaluation.qualifiesForMaxLeaderboard ? (
            <button
              type="button"
              onClick={onJumpToLeaderboard}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
            >
              Claim Maximum Security Leaderboard Rank
            </button>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Reach 100+ effective bits, 16+ characters, R≥70 pool, and 6+ badges to unlock the Maximum Security Leaderboard.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
