import { useState } from 'react';
import { Award, Lock } from 'lucide-react';
import { ComplexityBadge } from '../utils/passwordEvaluator';

interface BadgeVaultProps {
  badges: ComplexityBadge[];
  totalXp: number;
}

type BadgeFilter = 'all' | 'unlocked' | 'locked';

export function BadgeVault({ badges, totalXp }: BadgeVaultProps) {
  const [filter, setFilter] = useState<BadgeFilter>('all');

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const maxPossibleXp = badges.reduce((sum, b) => sum + b.xpPoints, 0);

  const visibleBadges = badges.filter((b) => {
    if (filter === 'unlocked') return b.unlocked;
    if (filter === 'locked') return !b.unlocked;
    return true;
  });

  return (
    <section id="badges" aria-labelledby="badges-heading" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2
            id="badges-heading"
            className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
          >
            Complexity Achievement Badges
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Unlock at least 6 of 8 cryptographic complexity milestones to qualify for Maximum Security Status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="text-sm font-mono tabular-nums text-slate-600 dark:text-slate-300">
            <span>{unlockedCount} / {badges.length} Unlocked</span>
            <span className="mx-2 text-slate-400" aria-hidden="true">·</span>
            <span>{totalXp} / {maxPossibleXp} XP</span>
          </div>

          {/* Interactive Filter Segmented Control */}
          <div
            role="group"
            aria-label="Filter badges by status"
            className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
          >
            {(
              [
                { id: 'all', label: `All (${badges.length})` },
                { id: 'unlocked', label: `Unlocked (${unlockedCount})` },
                { id: 'locked', label: `Locked (${badges.length - unlockedCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  filter === tab.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {visibleBadges.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {filter === 'unlocked'
              ? 'No badges unlocked yet. Start typing in the evaluator above to earn your first complexity badge.'
              : 'All 8 complexity badges have been unlocked!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {visibleBadges.map((badge) => (
            <article
              key={badge.id}
              className={`rounded-xl p-5 border transition-colors flex flex-col justify-between gap-4 ${
                badge.unlocked
                  ? 'bg-white dark:bg-slate-900 border-emerald-500/50 dark:border-emerald-500/40'
                  : 'bg-slate-50/80 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-85'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {badge.title}
                  </h3>
                  {badge.unlocked ? (
                    <Award
                      className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0"
                      aria-label="Badge unlocked"
                    />
                  ) : (
                    <Lock
                      className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5"
                      aria-label="Badge locked"
                    />
                  )}
                </div>

                {/* Unboxed Clean Metadata */}
                <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
                  <span
                    className={
                      badge.unlocked
                        ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                        : 'text-slate-500 dark:text-slate-400'
                    }
                  >
                    {badge.unlocked ? 'Unlocked' : 'Locked'}
                  </span>
                  <span className="text-slate-400" aria-hidden="true">·</span>
                  <span className="text-slate-600 dark:text-slate-300">+{badge.xpPoints} XP</span>
                </div>

                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Requirement: {badge.requirement}
                </p>
              </div>

              <p className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {badge.safetyReason}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
