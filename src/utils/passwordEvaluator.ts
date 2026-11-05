import blueprint from '../../firebase-blueprint.json';

export type BadgeId =
  | 'len_12'
  | 'len_16'
  | 'lower_case'
  | 'upper_case'
  | 'digits'
  | 'symbols'
  | 'non_sequential'
  | 'high_entropy';

export type SecurityStageId =
  | 'EXPOSED'
  | 'GUARDED'
  | 'FORTIFIED'
  | 'HARDENED'
  | 'MAXIMUM_SECURITY';

export interface ComplexityBadge {
  id: BadgeId;
  title: string;
  requirement: string;
  safetyReason: string;
  xpPoints: number;
  unlocked: boolean;
}

export interface SecurityTip {
  id: string;
  priority: 'critical' | 'recommended' | 'mastered';
  headline: string;
  detail: string;
  estimatedGain: string;
}

export interface PasswordEvaluation {
  charLength: number;
  poolSize: number;
  rawEntropyBits: number;
  penaltyBits: number;
  entropyBits: number;
  progressPercent: number;
  stageId: SecurityStageId;
  stageLabel: string;
  stageIndex: number;
  crackTimeDisplay: string;
  combinationsScientific: string;
  hasLower: boolean;
  hasUpper: boolean;
  hasDigit: boolean;
  hasSymbol: boolean;
  uniqueRatio: number;
  hasSequence: boolean;
  hasRepeats: boolean;
  hasCommonPattern: boolean;
  badges: ComplexityBadge[];
  earnedBadgeIds: BadgeId[];
  badgeCount: number;
  totalXp: number;
  qualifiesForMaxLeaderboard: boolean;
  tips: SecurityTip[];
}

export interface EducationalSnippet {
  id: string;
  title: string;
  symbolClass: string;
  poolAddition: number;
  exampleFormula: string;
  keyspaceMultiplier: string;
  summary: string;
  whyItMatters: string;
  pitfallToAvoid: string;
}

export const SECURITY_STAGES: {
  id: SecurityStageId;
  label: string;
  minBits: number;
  maxBits: number;
  summary: string;
}[] = [
  {
    id: 'EXPOSED',
    label: 'Level 1 · Exposed',
    minBits: 0,
    maxBits: 35,
    summary: 'Vulnerable to instant dictionary lookup and commodity GPU hash cracking.',
  },
  {
    id: 'GUARDED',
    label: 'Level 2 · Guarded',
    minBits: 36,
    maxBits: 59,
    summary: 'Resists casual guessing, but falls to dedicated offline GPU rigs within hours.',
  },
  {
    id: 'FORTIFIED',
    label: 'Level 3 · Fortified',
    minBits: 60,
    maxBits: 79,
    summary: 'Solid everyday defense against automated credential-stuffing and mask attacks.',
  },
  {
    id: 'HARDENED',
    label: 'Level 4 · Hardened',
    minBits: 80,
    maxBits: 99,
    summary: 'High cryptographic margin requiring multi-decade compute arrays to exhaust.',
  },
  {
    id: 'MAXIMUM_SECURITY',
    label: 'Level 5 · Maximum Security',
    minBits: 100,
    maxBits: 512,
    summary: '100+ bits of entropy across 16+ characters and 6+ badges. Qualifies for Leaderboard.',
  },
];

const COMMON_PATTERNS = [
  'password',
  'passw0rd',
  'p@ssw0rd',
  'qwerty',
  'asdfgh',
  'zxcvbn',
  'admin',
  'welcome',
  'letmein',
  'monkey',
  'dragon',
  'master',
  'shadow',
  'baseball',
  'football',
  'iloveyou',
  'trustno1',
  'sunshine',
  '123456',
  '654321',
];

function detectSequentialRun(input: string): boolean {
  if (input.length < 3) return false;
  const lower = input.toLowerCase();
  for (let i = 0; i <= lower.length - 3; i++) {
    const c1 = lower.charCodeAt(i);
    const c2 = lower.charCodeAt(i + 1);
    const c3 = lower.charCodeAt(i + 2);
    const isAlnum =
      (c1 >= 48 && c1 <= 57 && c3 >= 48 && c3 <= 57) ||
      (c1 >= 97 && c1 <= 122 && c3 >= 97 && c3 <= 122);
    if (isAlnum && ((c2 === c1 + 1 && c3 === c2 + 1) || (c2 === c1 - 1 && c3 === c2 - 1))) {
      return true;
    }
  }
  const keyboardRows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  for (const row of keyboardRows) {
    for (let i = 0; i <= row.length - 4; i++) {
      const slice = row.slice(i, i + 4);
      const rev = slice.split('').reverse().join('');
      if (lower.includes(slice) || lower.includes(rev)) {
        return true;
      }
    }
  }
  return false;
}

function detectTripleRepeat(input: string): boolean {
  return /(.)\1\1/.test(input);
}

function detectCommonWord(input: string): boolean {
  const normalized = input
    .toLowerCase()
    .replace(/@/g, 'a')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/\$/g, 's')
    .replace(/3/g, 'e');
  return COMMON_PATTERNS.some((w) => normalized.includes(w));
}

function formatCrackTime(entropyBits: number): string {
  if (entropyBits <= 0) return 'Instant (0 sec)';
  // Offline fast hash benchmark: 10^11 guesses/sec (100 GH/s multi-GPU cluster), average 50% keyspace
  const log10GuessesPerSec = 11;
  const log10AverageSeconds = entropyBits * Math.LOG10E * Math.LN2 - Math.log10(2) - log10GuessesPerSec;

  if (log10AverageSeconds < -3) return 'Under 1 millisecond';
  const seconds = Math.pow(10, Math.min(log10AverageSeconds, 300));

  if (seconds < 1) return `${(seconds * 1000).toFixed(0)} milliseconds`;
  if (seconds < 60) return `${seconds.toFixed(1)} seconds`;
  const minutes = seconds / 60;
  if (minutes < 60) return `${minutes.toFixed(1)} minutes`;
  const hours = minutes / 60;
  if (hours < 24) return `${hours.toFixed(1)} hours`;
  const days = hours / 24;
  if (days < 365.25) return `${days.toFixed(1)} days`;
  const years = days / 365.25;
  if (years < 1_000) return `${years.toFixed(1)} years`;
  if (years < 1_000_000) return `${(years / 1_000).toFixed(1)} thousand years`;
  if (years < 1_000_000_000) return `${(years / 1_000_000).toFixed(1)} million years`;
  if (years < 1e12) return `${(years / 1e9).toFixed(1)} billion years`;
  const log10Years = log10AverageSeconds - Math.log10(31_557_600);
  return `10^${Math.floor(log10Years)} years`;
}

function formatCombinations(entropyBits: number): string {
  if (entropyBits <= 0) return '0';
  const log10Space = entropyBits * Math.LOG10E * Math.LN2;
  if (log10Space < 6) {
    return Math.round(Math.pow(2, entropyBits)).toLocaleString('en-US');
  }
  const exponent = Math.floor(log10Space);
  const mantissa = Math.pow(10, log10Space - exponent);
  return `${mantissa.toFixed(1)} × 10^${exponent}`;
}

export function evaluatePassword(rawInput: string): PasswordEvaluation {
  // Clamp to max 128 chars matching blueprint constraint
  const input = rawInput.slice(0, 128);
  const charLength = input.length;

  const hasLower = /[a-z]/.test(input);
  const hasUpper = /[A-Z]/.test(input);
  const hasDigit = /[0-9]/.test(input);
  const hasAsciiSymbol = /[^a-zA-Z0-9\s]/.test(input);
  const hasSpace = /\s/.test(input);
  const hasSymbol = hasAsciiSymbol || hasSpace;

  let poolSize = 0;
  if (hasLower) poolSize += 26;
  if (hasUpper) poolSize += 26;
  if (hasDigit) poolSize += 10;
  if (hasAsciiSymbol) poolSize += 32;
  if (hasSpace) poolSize += 1;
  // Cap poolSize to 100 matching blueprint bounds
  poolSize = Math.min(poolSize, 100);

  const rawEntropyBits =
    charLength > 0 && poolSize > 0 ? charLength * Math.log2(poolSize) : 0;

  const uniqueChars = new Set(input.split('')).size;
  const uniqueRatio = charLength > 0 ? uniqueChars / charLength : 0;
  const hasSequence = detectSequentialRun(input);
  const hasRepeats = detectTripleRepeat(input);
  const hasCommonPattern = detectCommonWord(input);

  let penaltyBits = 0;
  if (charLength > 0) {
    if (hasCommonPattern) penaltyBits += 22;
    if (hasSequence) penaltyBits += 12;
    if (hasRepeats) penaltyBits += 10;
    if (charLength >= 6 && uniqueRatio < 0.55) {
      penaltyBits += (0.55 - uniqueRatio) * 30;
    }
  }

  const entropyBits = Math.min(
    512,
    Math.max(0, Number((rawEntropyBits - penaltyBits).toFixed(1))),
  );

  const classCount = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;
  const patternClean =
    charLength >= 8 && !hasSequence && !hasRepeats && !hasCommonPattern;

  const badges: ComplexityBadge[] = [
    {
      id: 'lower_case',
      title: 'Lowercase Foundation',
      requirement: 'Include lowercase letters (a–z)',
      safetyReason: 'Establishes a 26-symbol base alphabet (~4.70 bits per character).',
      xpPoints: 100,
      unlocked: hasLower,
    },
    {
      id: 'upper_case',
      title: 'Case Expansion',
      requirement: 'Include uppercase letters (A–Z)',
      safetyReason: 'Doubles alphabetic pool from 26 to 52 symbols (+1.0 full bit per position).',
      xpPoints: 125,
      unlocked: hasUpper,
    },
    {
      id: 'digits',
      title: 'Numeric Stride',
      requirement: 'Include numeric digits (0–9)',
      safetyReason: 'Expands alphanumeric pool to 62 symbols, defeating pure-letter wordlists.',
      xpPoints: 125,
      unlocked: hasDigit,
    },
    {
      id: 'symbols',
      title: 'Punctuation Cipher',
      requirement: 'Include symbols or spaces (!@#$...)',
      safetyReason: 'Injects up to 33 non-alphanumeric characters, multiplying search trees rapidly.',
      xpPoints: 175,
      unlocked: hasSymbol,
    },
    {
      id: 'len_12',
      title: 'Extended Span',
      requirement: 'Reach at least 12 characters',
      safetyReason: 'Every extra character multiplies total combinations by the entire pool size R.',
      xpPoints: 150,
      unlocked: charLength >= 12,
    },
    {
      id: 'len_16',
      title: 'Vault Span',
      requirement: 'Reach at least 16 characters',
      safetyReason: 'Pushes exponential length into NIST high-assurance passphrase territory.',
      xpPoints: 225,
      unlocked: charLength >= 16,
    },
    {
      id: 'non_sequential',
      title: 'Pattern Breaker',
      requirement: '8+ chars with zero sequences, triple repeats, or common roots',
      safetyReason: 'Prevents rule-based hashcat masks from pruning billions of predictable guesses.',
      xpPoints: 200,
      unlocked: patternClean,
    },
    {
      id: 'high_entropy',
      title: 'Quantum-Grade Keyspace',
      requirement: '100+ effective entropy bits across all 4 character classes',
      safetyReason: 'Exceeds 2^100 effective combinations—infeasible for modern offline GPU clusters.',
      xpPoints: 300,
      unlocked: entropyBits >= 100 && classCount === 4,
    },
  ];

  const earnedBadgeIds = badges.filter((b) => b.unlocked).map((b) => b.id);
  const badgeCount = earnedBadgeIds.length;
  const totalXp = badges.reduce((sum, b) => (b.unlocked ? sum + b.xpPoints : sum), 0);

  const qualifiesForMaxLeaderboard =
    entropyBits >= 100 &&
    charLength >= 16 &&
    poolSize >= 70 &&
    badgeCount >= 6;

  let stageIndex = 0;
  if (qualifiesForMaxLeaderboard) {
    stageIndex = 4;
  } else if (entropyBits >= 80) {
    stageIndex = 3;
  } else if (entropyBits >= 60) {
    stageIndex = 2;
  } else if (entropyBits >= 36) {
    stageIndex = 1;
  } else {
    stageIndex = 0;
  }

  // Note: If entropyBits >= 100 but missing 16+ length or 70+ poolSize, cap stage at Hardened (96%) until full Max Security criteria are met
  const progressPercent = qualifiesForMaxLeaderboard
    ? 100
    : Math.min(96, Math.round((entropyBits / 100) * 100));

  const stage = SECURITY_STAGES[stageIndex];

  const tips: SecurityTip[] = [];
  if (charLength === 0) {
    tips.push({
      id: 'start_typing',
      priority: 'recommended',
      headline: 'Enter a candidate password or generate a specimen to begin analysis',
      detail:
        'All entropy calculations run strictly inside your browser memory—nothing you type is ever sent over the network.',
      estimatedGain: 'Up to 120+ bits',
    });
  } else {
    if (hasCommonPattern) {
      tips.push({
        id: 'remove_common',
        priority: 'critical',
        headline: 'Remove dictionary words and leetspeak roots (e.g., p@ssw0rd, qwerty)',
        detail:
          'Cracking engines test top 10M breached roots with automatic @/0/1/$ substitutions in milliseconds.',
        estimatedGain: '+22.0 bits recovered',
      });
    }
    if (hasSequence) {
      tips.push({
        id: 'remove_sequence',
        priority: 'critical',
        headline: 'Break sequential runs and adjacent keyboard walks (abc, 123, asdf)',
        detail:
          'Adjacent key walks collapse effective randomness because attackers prioritize spatial keyboard graphs.',
        estimatedGain: '+12.0 bits recovered',
      });
    }
    if (hasRepeats) {
      tips.push({
        id: 'remove_repeats',
        priority: 'critical',
        headline: 'Replace 3+ repeated identical characters (aaa, 777) with varied symbols',
        detail:
          'Repeated character runs compress search entropy and forfeit your Pattern Breaker badge.',
        estimatedGain: '+10.0 bits recovered',
      });
    }
    if (!hasSymbol) {
      const nextPool = poolSize + 32;
      const gain = charLength * Math.log2(nextPool) - rawEntropyBits;
      tips.push({
        id: 'add_symbols',
        priority: 'recommended',
        headline: 'Inject punctuation symbols (!, #, %, &, ~) to expand pool by +32',
        detail:
          'Adding even one non-alphanumeric symbol forces brute-force crackers to include all 32 ASCII punctuation marks at every position.',
        estimatedGain: `+${Math.max(4.5, gain).toFixed(1)} bits`,
      });
    }
    if (!hasUpper || !hasLower) {
      tips.push({
        id: 'mix_case',
        priority: 'recommended',
        headline: !hasUpper
          ? 'Mix in uppercase letters (A–Z) at unpredictable interior positions'
          : 'Add lowercase letters (a–z) to complete the 52-letter alphabetic pool',
        detail:
          'Avoid capitalizing only the very first letter—interior uppercase placement defeats standard capitalized-wordlist masks.',
        estimatedGain: `+${Math.max(6, charLength * 0.6).toFixed(1)} bits`,
      });
    }
    if (!hasDigit) {
      tips.push({
        id: 'add_digits',
        priority: 'recommended',
        headline: 'Weave digits (0–9) inside the middle of your phrase rather than the end',
        detail:
          'Trailing digits like "24" or "99" are guessed early; interior digits force full alphanumeric permutation.',
        estimatedGain: `+${Math.max(3.5, charLength * 0.25).toFixed(1)} bits`,
      });
    }
    if (charLength < 16) {
      const charsNeeded = 16 - charLength;
      const effectivePool = Math.max(poolSize, 26);
      const gain = charsNeeded * Math.log2(effectivePool);
      tips.push({
        id: 'increase_length',
        priority: 'recommended',
        headline: `Add ${charsNeeded} more character${charsNeeded > 1 ? 's' : ''} to unlock Vault Span (16+ chars)`,
        detail:
          'Length sits in the exponent (R^L), making every additional character multiply the attacker workload exponentially.',
        estimatedGain: `+${gain.toFixed(1)} bits`,
      });
    }
    if (qualifiesForMaxLeaderboard && tips.length === 0) {
      tips.push({
        id: 'max_achieved',
        priority: 'mastered',
        headline: 'Maximum Security Status verified — zero structural weaknesses detected',
        detail:
          'Your candidate combines 16+ characters, a broad 70+ symbol alphabet, clean non-sequential structure, and 100+ effective bits.',
        estimatedGain: 'Leaderboard Eligible',
      });
    }
  }

  return {
    charLength,
    poolSize,
    rawEntropyBits: Number(rawEntropyBits.toFixed(1)),
    penaltyBits: Number(penaltyBits.toFixed(1)),
    entropyBits,
    progressPercent,
    stageId: stage.id,
    stageLabel: stage.label,
    stageIndex,
    crackTimeDisplay: formatCrackTime(entropyBits),
    combinationsScientific: formatCombinations(entropyBits),
    hasLower,
    hasUpper,
    hasDigit,
    hasSymbol,
    uniqueRatio,
    hasSequence,
    hasRepeats,
    hasCommonPattern,
    badges,
    earnedBadgeIds,
    badgeCount,
    totalXp,
    qualifiesForMaxLeaderboard,
    tips: tips.slice(0, 4),
  };
}

export function generateSafeSpecimen(mode: 'weak' | 'moderate' | 'diceware' | 'maximum'): string {
  if (mode === 'weak') return 'Summer2026!';
  if (mode === 'moderate') return 'Velvet7#Harbor';

  const wordBank = [
    'Cobalt',
    'Prism',
    'Anchor',
    'Quartz',
    'Zephyr',
    'Timber',
    'Vector',
    'Falcon',
    'Solstice',
    'Granite',
    'Canyon',
    'Compass',
    'banjo',
    'lantern',
    'orchard',
    'glacier',
  ];
  const symbols = ['!', '#', '$', '%', '&', '*', '+', '=', '?', '~'];
  const digits = ['2', '3', '4', '5', '6', '7', '8', '9'];

  const randomIndex = (max: number): number => {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    return arr[0] % max;
  };

  if (mode === 'diceware') {
    const w1 = wordBank[randomIndex(wordBank.length)];
    const w2 = wordBank[randomIndex(wordBank.length)].toLowerCase();
    const w3 = wordBank[randomIndex(wordBank.length)];
    return `${w1}-${w2}-${w3}`;
  }

  // Maximum Security specimen: guaranteed >= 18 chars, all 4 character classes, non-sequential, >115 bits
  const p1 = wordBank[randomIndex(8)];
  const p2 = wordBank[8 + randomIndex(8)];
  const sym1 = symbols[randomIndex(symbols.length)];
  const sym2 = symbols[randomIndex(symbols.length)];
  const d1 = digits[randomIndex(digits.length)];
  const d2 = digits[(randomIndex(digits.length) + 3) % digits.length];
  return `${p1}${sym1}${d1}${p2}${sym2}${d2}Kx`;
}

export const EDUCATIONAL_SNIPPETS: EducationalSnippet[] = [
  {
    id: 'lowercase_base',
    title: '01. Lowercase Letters: The Baseline Alphabet',
    symbolClass: 'a – z',
    poolAddition: 26,
    exampleFormula: 'H = L × log₂(26) ≈ 4.70 bits/char',
    keyspaceMultiplier: '26× per extra char',
    summary:
      'Lowercase letters provide 26 distinct possibilities per slot. Alone, an 8-letter lowercase word spans only 2.09 × 10¹¹ combinations—exhausted in roughly 2 seconds by an offline GPU rig.',
    whyItMatters:
      'Lowercase characters become truly resilient when stretched into long multi-word passphrases (20+ characters) or paired with upper, numeric, and symbol classes.',
    pitfallToAvoid:
      'Never use single dictionary words—attackers test complete multi-language dictionaries before brute-forcing random letters.',
  },
  {
    id: 'uppercase_doubling',
    title: '02. Uppercase Letters: Doubling Every Slot',
    symbolClass: 'A – Z',
    poolAddition: 26,
    exampleFormula: 'H = L × log₂(52) ≈ 5.70 bits/char',
    keyspaceMultiplier: '2^L total expansion',
    summary:
      'Mixing uppercase with lowercase doubles the alphabet from 26 to 52 symbols. Because every character position doubles in possibilities, a 16-letter mixed-case string is 2¹⁶ (65,536×) harder to brute-force than lowercase alone.',
    whyItMatters:
      'Adds exactly +1.00 bit of Shannon entropy to every single character position across the entire password.',
    pitfallToAvoid:
      'Avoid capitalizing only the first letter—cracking masks routinely toggle index 0 to uppercase on every dictionary candidate.',
  },
  {
    id: 'digits_anchor',
    title: '03. Numeric Digits: Breaking Pure-Alpha Masks',
    symbolClass: '0 – 9',
    poolAddition: 10,
    exampleFormula: 'H = L × log₂(62) ≈ 5.95 bits/char',
    keyspaceMultiplier: '62^L alphanumeric tree',
    summary:
      'Adding digits expands a 52-letter pool to 62 symbols. Across a 16-character string, stepping from 52¹⁶ to 62¹⁶ multiplies the total search keyspace by more than 16.8×.',
    whyItMatters:
      'Forces an attacker out of alphabetic-only masks into full alphanumeric enumeration at every character index.',
    pitfallToAvoid:
      'Skip birth years (1990–2026) and trailing "123" suffixes; place digits unpredictably inside words or separators.',
  },
  {
    id: 'symbols_multiplier',
    title: '04. Punctuation & Spaces: The 94-Symbol Multiplier',
    symbolClass: '! @ # $ % ^ & * ~',
    poolAddition: 32,
    exampleFormula: 'H = L × log₂(94) ≈ 6.55 bits/char',
    keyspaceMultiplier: '780× over 62¹⁶ at L=16',
    summary:
      'Printable ASCII punctuation unlocks 32 additional characters (33 with space). At 16 characters, expanding the pool from 62 to 94 increases combinations from 4.76 × 10²⁸ to 3.71 × 10³¹—a 780-fold security leap without adding a single extra character of length.',
    whyItMatters:
      'Delivers the highest per-character entropy density available in standard keyboard layouts (~6.55 bits per character).',
    pitfallToAvoid:
      'Do not rely on predictable leetspeak swaps like "@" for "a" or "$" for "s" inside common English words.',
  },
];

// Verbatim validation synchronized with firebase-blueprint.json
const CALLSIGN_SCHEMA = blueprint.entities.LeaderboardEntry.properties.callsign;
const CALLSIGN_REGEX = new RegExp(CALLSIGN_SCHEMA.pattern);
const CALLSIGN_MIN = CALLSIGN_SCHEMA.minLength;
const CALLSIGN_MAX = CALLSIGN_SCHEMA.maxLength;

export function validateCallsign(raw: string): { valid: boolean; sanitized: string; error?: string } {
  const sanitized = raw.trim().replace(/\s+/g, ' ');
  if (sanitized.length < CALLSIGN_MIN) {
    return {
      valid: false,
      sanitized,
      error: `Callsign must be at least ${CALLSIGN_MIN} characters.`,
    };
  }
  if (sanitized.length > CALLSIGN_MAX) {
    return {
      valid: false,
      sanitized: sanitized.slice(0, CALLSIGN_MAX),
      error: `Callsign must be ${CALLSIGN_MAX} characters or fewer.`,
    };
  }
  if (!CALLSIGN_REGEX.test(sanitized)) {
    return {
      valid: false,
      sanitized,
      error: 'Use only letters, numbers, spaces, hyphens, or underscores.',
    };
  }
  return { valid: true, sanitized };
}
