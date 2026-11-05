/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { Moon, Sun } from 'lucide-react';
import { auth, googleProvider } from './firebase';
import { evaluatePassword } from './utils/passwordEvaluator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ResilientImage } from './components/ResilientImage';
import { PasswordSandbox } from './components/PasswordSandbox';
import { BadgeVault } from './components/BadgeVault';
import { CharacterEducation } from './components/CharacterEducation';
import { LeaderboardSection } from './components/LeaderboardSection';
import heroBlueprintImg from './assets/images/hero_entropy_blueprint_1793781837363.jpg';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = window.localStorage.getItem('keystone_theme');
    return saved ? saved === 'dark' : true;
  });

  const [password, setPassword] = useState<string>('Velvet7#Harbor');
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    window.localStorage.setItem('keystone_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const evaluation = useMemo(() => evaluatePassword(password), [password]);

  const handleSignIn = async () => {
    setAuthNotice(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in cancelled or blocked.';
      if (!msg.includes('popup-closed-by-user')) {
        setAuthNotice('Sign-in popup could not complete. Ensure popups are allowed and try again.');
      }
    }
  };

  const handleSignOut = async () => {
    setAuthNotice(null);
    await signOut(auth);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        {/* Strict 3-Zone Top Navigation Bar */}
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
            {/* Zone 1: Single-element Brand Wordmark */}
            <a
              href="#top"
              className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0"
            >
              CFS Keystone Entropy Lab
            </a>

            {/* Zone 2: 4 Single-Line Navigation Links */}
            <nav
              aria-label="Primary sections"
              className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300"
            >
              <a
                href="#evaluator"
                className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                Evaluator
              </a>
              <a
                href="#badges"
                className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                Badges
              </a>
              <a
                href="#education"
                className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                Entropy Math
              </a>
              <a
                href="#leaderboard"
                className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                Leaderboard
              </a>
            </nav>

            {/* Zone 3: 1 Primary Action */}
            <div className="flex items-center shrink-0">
              {user ? (
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleSignIn()}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors whitespace-nowrap shrink-0"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </header>

        <main id="top" className="max-w-7xl mx-auto px-6 py-8 sm:py-12 space-y-16 sm:space-y-20">
          {/* Workspace Toolbar & Hero Split */}
          <div className="space-y-6">
            {/* Workspace Utility Strip (Houses Dark/Light Mode Switch cleanly below header) */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-600 dark:text-slate-400">
                <span>Client-Side Shannon Entropy Sandbox</span>
                <span className="mx-2" aria-hidden="true">·</span>
                <span>NIST SP 800-63B Aligned</span>
                {user && (
                  <>
                    <span className="mx-2" aria-hidden="true">·</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                      Signed in for Leaderboard
                    </span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setDarkMode((prev) => !prev)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
              >
                {darkMode ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                    Switch to Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-slate-700" aria-hidden="true" />
                    Switch to Dark Mode
                  </>
                )}
              </button>
            </div>

            {authNotice && (
              <p
                role="alert"
                className="text-xs font-medium text-amber-700 dark:text-amber-400"
              >
                {authNotice}
              </p>
            )}

            {/* Balanced 2-Column Hero Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-7 flex flex-col justify-center space-y-5 py-2">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Interactive Cryptographic Strength Lab
                </p>
                <h1
                  className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.12] max-w-2xl"
                  style={{ textWrap: 'balance' }}
                >
                  Test Password Resilience, Earn Complexity Badges, and Master Keyspace Math.
                </h1>
                <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                  Experiment with character classes in real time, watch how uppercase, digits, and punctuation symbols multiply brute-force difficulty, and claim a place on the Maximum Security Leaderboard without ever transmitting a password.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => scrollToSection('evaluator')}
                    className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                  >
                    Start Testing Passwords
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection('education')}
                    className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm font-medium transition-colors whitespace-nowrap shrink-0"
                  >
                    Explore Character Safety Math
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 min-h-[240px]">
                <ResilientImage
                  src={heroBlueprintImg}
                  alt="Architectural illustration of brass cipher rings and geometric combinatorics lines on a slate blueprint"
                  fallbackTitle="Entropy Blueprint Visualizer"
                  className="w-full h-full lg:h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Section 1: Interactive Password Evaluator, Progress Bar & Live Tips */}
          <PasswordSandbox
            password={password}
            onPasswordChange={setPassword}
            evaluation={evaluation}
            onJumpToLeaderboard={() => scrollToSection('leaderboard')}
          />

          {/* Section 2: Gamified Complexity Badges */}
          <BadgeVault badges={evaluation.badges} totalXp={evaluation.totalXp} />

          {/* Section 3: Educational Snippets & Interactive Keyspace Simulator */}
          <CharacterEducation />

          {/* Section 4: Maximum Security Leaderboard */}
          <LeaderboardSection
            user={user}
            authReady={authReady}
            onSignIn={handleSignIn}
            evaluation={evaluation}
          />
        </main>

        {/* Quiet Clean Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 mt-20">
          <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            <p>
              Created by the CyberforSec Pte Ltd Team · Zero-knowledge client-side evaluation.
            </p>
            <div className="flex items-center gap-5">
              <a href="#evaluator" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors whitespace-nowrap">
                Evaluator
              </a>
              <a href="#badges" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors whitespace-nowrap">
                Badges
              </a>
              <a href="#education" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors whitespace-nowrap">
                Entropy Math
              </a>
              <a href="#leaderboard" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors whitespace-nowrap">
                Leaderboard
              </a>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
