import { FormEvent, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { CheckCircle2, LogIn, Trash2, Trophy } from 'lucide-react';
import {
  db,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import {
  BadgeId,
  PasswordEvaluation,
  validateCallsign,
} from '../utils/passwordEvaluator';
import { ResilientImage } from './ResilientImage';
import maxInsigniaImg from '../assets/images/insignia_max_security_1793781838760.jpg';

export interface LeaderboardRecord {
  id: string;
  userId: string;
  callsign: string;
  entropyBits: number;
  charLength: number;
  poolSize: number;
  badgeCount: number;
  earnedBadges: BadgeId[];
  tier: 'MAXIMUM_SECURITY';
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

interface LeaderboardSectionProps {
  user: User | null;
  authReady: boolean;
  onSignIn: () => Promise<void>;
  evaluation: PasswordEvaluation;
}

export function LeaderboardSection({
  user,
  authReady,
  onSignIn,
  evaluation,
}: LeaderboardSectionProps) {
  const [entries, setEntries] = useState<LeaderboardRecord[]>([]);
  const [myEntry, setMyEntry] = useState<LeaderboardRecord | null>(null);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [callsignInput, setCallsignInput] = useState('');
  const [formFeedback, setFormFeedback] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fatalRuleError, setFatalRuleError] = useState<Error | null>(null);

  if (fatalRuleError) {
    throw fatalRuleError;
  }

  // 1. Listen to the global Maximum Security leaderboard collection (limit 50, sorted client-side to avoid composite index requirement)
  useEffect(() => {
    if (!authReady || !user) {
      setEntries([]);
      setLoadingEntries(false);
      return;
    }

    setLoadingEntries(true);
    const leaderboardQuery = query(
      collection(db, 'leaderboardEntries'),
      where('tier', '==', 'MAXIMUM_SECURITY'),
      limit(50),
    );

    const unsubscribe = onSnapshot(
      leaderboardQuery,
      (snapshot) => {
        const docs: LeaderboardRecord[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            userId: String(d.userId ?? ''),
            callsign: String(d.callsign ?? 'Anonymous'),
            entropyBits: Number(d.entropyBits ?? 100),
            charLength: Number(d.charLength ?? 16),
            poolSize: Number(d.poolSize ?? 70),
            badgeCount: Number(d.badgeCount ?? 6),
            earnedBadges: Array.isArray(d.earnedBadges) ? (d.earnedBadges as BadgeId[]) : [],
            tier: 'MAXIMUM_SECURITY',
            createdAt: (d.createdAt as Timestamp) ?? null,
            updatedAt: (d.updatedAt as Timestamp) ?? null,
          };
        });

        // Client-side sort by highest entropyBits, then earliest createdAt
        docs.sort((a, b) => {
          if (b.entropyBits !== a.entropyBits) {
            return b.entropyBits - a.entropyBits;
          }
          const aTime = a.createdAt?.toMillis() ?? 0;
          const bTime = b.createdAt?.toMillis() ?? 0;
          return aTime - bTime;
        });

        setEntries(docs.slice(0, 25));
        setLoadingEntries(false);
      },
      (error) => {
        setLoadingEntries(false);
        try {
          handleFirestoreError(error, OperationType.LIST, 'leaderboardEntries');
        } catch (wrapped) {
          setFatalRuleError(wrapped as Error);
        }
      },
    );

    return () => unsubscribe();
  }, [authReady, user]);

  // 2. Listen to the current authenticated user's individual leaderboard document
  useEffect(() => {
    if (!authReady || !user) {
      setMyEntry(null);
      return;
    }

    const userDocRef = doc(db, 'leaderboardEntries', user.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const d = docSnap.data();
          setMyEntry({
            id: docSnap.id,
            userId: String(d.userId ?? user.uid),
            callsign: String(d.callsign ?? 'Anonymous'),
            entropyBits: Number(d.entropyBits ?? 100),
            charLength: Number(d.charLength ?? 16),
            poolSize: Number(d.poolSize ?? 70),
            badgeCount: Number(d.badgeCount ?? 6),
            earnedBadges: Array.isArray(d.earnedBadges) ? (d.earnedBadges as BadgeId[]) : [],
            tier: 'MAXIMUM_SECURITY',
            createdAt: (d.createdAt as Timestamp) ?? null,
            updatedAt: (d.updatedAt as Timestamp) ?? null,
          });
        } else {
          setMyEntry(null);
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, `leaderboardEntries/${user.uid}`);
        } catch (wrapped) {
          setFatalRuleError(wrapped as Error);
        }
      },
    );

    return () => unsubscribe();
  }, [authReady, user]);

  const existingUserEntry = myEntry ?? (user ? entries.find((item) => item.userId === user.uid) ?? null : null);

  useEffect(() => {
    if (existingUserEntry && !callsignInput) {
      setCallsignInput(existingUserEntry.callsign);
    } else if (user && !callsignInput) {
      const fallbackName = (user.displayName ?? 'CipherGuardian')
        .replace(/[^a-zA-Z0-9_\- ]/g, '')
        .trim()
        .slice(0, 20);
      if (fallbackName.length >= 2) {
        setCallsignInput(fallbackName);
      }
    }
  }, [existingUserEntry, user, callsignInput]);

  const handleClaimOrUpgrade = async (e: FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    if (!user) return;
    if (!user.emailVerified) {
      setFormFeedback({
        type: 'error',
        text: 'A verified Google account email is required to write to the leaderboard.',
      });
      return;
    }

    const check = validateCallsign(callsignInput);
    if (!check.valid) {
      setFormFeedback({
        type: 'error',
        text: check.error ?? 'Invalid callsign.',
      });
      return;
    }

    const entryRef = doc(db, 'leaderboardEntries', user.uid);
    const boundedBadges = evaluation.earnedBadgeIds.slice(0, 8);

    setSubmitting(true);
    try {
      if (!existingUserEntry) {
        if (!evaluation.qualifiesForMaxLeaderboard) {
          setFormFeedback({
            type: 'error',
            text: 'Achieve Maximum Security Status (100+ bits, 16+ chars, R≥70, 6+ badges) before claiming a spot.',
          });
          setSubmitting(false);
          return;
        }

        await setDoc(entryRef, {
          userId: user.uid,
          callsign: check.sanitized,
          entropyBits: Math.min(512, Math.max(100, Number(evaluation.entropyBits.toFixed(1)))),
          charLength: Math.min(128, Math.max(16, Math.round(evaluation.charLength))),
          poolSize: Math.min(100, Math.max(70, Math.round(evaluation.poolSize))),
          badgeCount: boundedBadges.length,
          earnedBadges: boundedBadges,
          tier: 'MAXIMUM_SECURITY',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        setFormFeedback({
          type: 'success',
          text: 'Maximum Security achievement recorded on the leaderboard.',
        });
      } else if (
        evaluation.qualifiesForMaxLeaderboard &&
        evaluation.entropyBits > existingUserEntry.entropyBits
      ) {
        await updateDoc(entryRef, {
          callsign: check.sanitized,
          entropyBits: Math.min(512, Math.max(100, Number(evaluation.entropyBits.toFixed(1)))),
          charLength: Math.min(128, Math.max(16, Math.round(evaluation.charLength))),
          poolSize: Math.min(100, Math.max(70, Math.round(evaluation.poolSize))),
          badgeCount: boundedBadges.length,
          earnedBadges: boundedBadges,
          updatedAt: serverTimestamp(),
        });

        setFormFeedback({
          type: 'success',
          text: `Personal best upgraded to ${evaluation.entropyBits.toFixed(1)} bits!`,
        });
      } else if (check.sanitized !== existingUserEntry.callsign) {
        await updateDoc(entryRef, {
          callsign: check.sanitized,
          updatedAt: serverTimestamp(),
        });
        setFormFeedback({
          type: 'success',
          text: 'Leaderboard callsign updated.',
        });
      } else {
        setFormFeedback({
          type: 'error',
          text: `Your recorded personal best is already ${existingUserEntry.entropyBits.toFixed(1)} bits. Test an even stronger specimen or edit your callsign.`,
        });
      }
    } catch (error) {
      try {
        handleFirestoreError(
          error,
          existingUserEntry ? OperationType.UPDATE : OperationType.CREATE,
          `leaderboardEntries/${user.uid}`,
        );
      } catch (wrapped) {
        setFatalRuleError(wrapped as Error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveEntry = async () => {
    if (!user || !existingUserEntry) return;
    setSubmitting(true);
    setFormFeedback(null);
    try {
      await deleteDoc(doc(db, 'leaderboardEntries', user.uid));
      setFormFeedback({
        type: 'success',
        text: 'Your leaderboard record has been removed.',
      });
    } catch (error) {
      try {
        handleFirestoreError(
          error,
          OperationType.DELETE,
          `leaderboardEntries/${user.uid}`,
        );
      } catch (wrapped) {
        setFatalRuleError(wrapped as Error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="leaderboard" aria-labelledby="leaderboard-heading" className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2
            id="leaderboard-heading"
            className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
          >
            Maximum Security Hall of Honor
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Reserved strictly for users who engineer 100+ effective bits across 16+ characters and 6+ badges. Zero passwords or emails are ever stored.
          </p>
        </div>
        <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
          Qualification Gate: ≥100.0 bits · ≥16 chars · R≥70 · ≥6 badges
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Verification & Claim Card (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800">
              <ResilientImage
                src={maxInsigniaImg}
                alt="Precision titanium and emerald Maximum Security crest insignia"
                fallbackTitle="Max Crest"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {evaluation.qualifiesForMaxLeaderboard
                  ? 'Maximum Security Status Unlocked'
                  : 'Qualification Status: In Progress'}
              </h3>
              <p className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400 mt-0.5">
                Current: {evaluation.entropyBits.toFixed(1)} bits · {evaluation.charLength} chars · {evaluation.badgeCount}/8 badges
              </p>
            </div>
          </div>

          {!authReady ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Checking authentication session...
            </p>
          ) : !user ? (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Sign in with Google to view live global rankings and record your Maximum Security entropy score under a custom callsign.
              </p>
              <button
                type="button"
                onClick={() => void onSignIn()}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                Sign In with Google
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => void handleClaimOrUpgrade(e)}
              className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="space-y-1.5">
                <label
                  htmlFor="leaderboard-callsign"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Public Leaderboard Callsign (2–24 alphanumeric chars, no email)
                </label>
                <input
                  id="leaderboard-callsign"
                  type="text"
                  minLength={2}
                  maxLength={24}
                  value={callsignInput}
                  onChange={(e) => setCallsignInput(e.target.value)}
                  placeholder="e.g., CipherArchitect"
                  className="w-full rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {formFeedback && (
                <p
                  role="status"
                  className={`text-xs font-medium ${
                    formFeedback.type === 'success'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formFeedback.text}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={
                    submitting ||
                    (!existingUserEntry && !evaluation.qualifiesForMaxLeaderboard)
                  }
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-500 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  {submitting
                    ? 'Saving...'
                    : !existingUserEntry
                      ? 'Submit Max Security Score'
                      : evaluation.qualifiesForMaxLeaderboard &&
                          evaluation.entropyBits > existingUserEntry.entropyBits
                        ? `Upgrade Record (${evaluation.entropyBits.toFixed(1)}b)`
                        : 'Update Callsign'}
                </button>

                {existingUserEntry && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleRemoveEntry()}
                    aria-label="Delete my leaderboard record"
                    className="inline-flex items-center gap-1.5 py-2.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium text-rose-600 dark:text-rose-400 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    Remove
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Right Live Rankings Table (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          {!user ? (
            <div className="p-10 text-center space-y-3">
              <Trophy className="w-7 h-7 text-emerald-600 dark:text-emerald-400 mx-auto" aria-hidden="true" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Sign In to Stream Verified Rankings
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Leaderboard queries are protected by authenticated Firestore rules. Sign in with Google on the left panel to view and compete on the Hall of Honor.
              </p>
            </div>
          ) : loadingEntries ? (
            <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              Loading verified Maximum Security records...
            </div>
          ) : entries.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                No Maximum Security Records Yet
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Be the very first to engineer a 100+ bit specimen in the evaluator above and claim Rank #1.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-5">Rank</th>
                    <th className="py-3.5 px-4">Callsign</th>
                    <th className="py-3.5 px-4 text-right">Entropy</th>
                    <th className="py-3.5 px-4 text-right">Span &amp; Pool</th>
                    <th className="py-3.5 px-5 text-right">Badges</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {entries.map((entry, idx) => {
                    const isCurrentUser = user.uid === entry.userId;
                    return (
                      <tr
                        key={entry.id}
                        className={
                          isCurrentUser
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/25'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors'
                        }
                      >
                        <td className="py-3.5 px-5 font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                          #{idx + 1}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                          <span>{entry.callsign}</span>
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-emerald-700 dark:text-emerald-400 font-normal">
                              · You
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                          {entry.entropyBits.toFixed(1)} bits
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                          {entry.charLength}c · R={entry.poolSize}
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                          {entry.badgeCount} / 8
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
