/**
 * Security Rules Specification Test Suite — Dirty Dozen Verification
 * Verifies that all 12 adversarial payloads defined in security_spec.md
 * violate the invariants enforced in firestore.rules.
 */

export interface SimulatedRequest {
  auth: { uid: string; email_verified: boolean } | null;
  pathUserId: string;
  requestTimeMs: number;
  method: 'get' | 'list' | 'create' | 'update' | 'delete';
  queryLimit?: number;
  existingDoc?: Record<string, unknown> | null;
  incomingDoc?: Record<string, unknown> | null;
}

const ALLOWED_BADGES = new Set([
  'len_12',
  'len_16',
  'upper_case',
  'lower_case',
  'digits',
  'symbols',
  'non_sequential',
  'high_entropy',
]);

const REQUIRED_KEYS = [
  'userId',
  'callsign',
  'entropyBits',
  'charLength',
  'poolSize',
  'badgeCount',
  'earnedBadges',
  'tier',
  'createdAt',
  'updatedAt',
];

export function evaluateSimulatedRule(req: SimulatedRequest): 'ALLOW' | 'PERMISSION_DENIED' {
  const isValidId = (id: string) =>
    typeof id === 'string' && id.length >= 1 && id.length <= 128 && /^[a-zA-Z0-9_\-]+$/.test(id);

  const isSignedIn = req.auth !== null;
  const isVerifiedUser = isSignedIn && req.auth?.email_verified === true;

  const isValidEntry = (data: Record<string, unknown> | null | undefined): boolean => {
    if (!data || !req.auth) return false;
    const keys = Object.keys(data);
    if (keys.length !== REQUIRED_KEYS.length) return false;
    if (!REQUIRED_KEYS.every((k) => keys.includes(k))) return false;

    const badges = data.earnedBadges;
    if (!Array.isArray(badges) || badges.length < 6 || badges.length > 8) return false;
    if (badges.length !== data.badgeCount) return false;
    if (typeof badges[0] !== 'string' || badges[0].length > 32) return false;
    if (!badges.every((b) => typeof b === 'string' && ALLOWED_BADGES.has(b))) return false;

    return (
      typeof data.userId === 'string' &&
      isValidId(data.userId) &&
      data.userId === req.auth.uid &&
      typeof data.callsign === 'string' &&
      data.callsign.length >= 2 &&
      data.callsign.length <= 24 &&
      /^[a-zA-Z0-9_\- ]+$/.test(data.callsign) &&
      typeof data.entropyBits === 'number' &&
      data.entropyBits >= 100 &&
      data.entropyBits <= 512 &&
      typeof data.charLength === 'number' &&
      Number.isInteger(data.charLength) &&
      data.charLength >= 16 &&
      data.charLength <= 128 &&
      typeof data.poolSize === 'number' &&
      Number.isInteger(data.poolSize) &&
      data.poolSize >= 70 &&
      data.poolSize <= 100 &&
      typeof data.badgeCount === 'number' &&
      Number.isInteger(data.badgeCount) &&
      data.badgeCount >= 6 &&
      data.badgeCount <= 8 &&
      data.tier === 'MAXIMUM_SECURITY' &&
      typeof data.createdAt === 'number' &&
      typeof data.updatedAt === 'number'
    );
  };

  if (req.method === 'list') {
    if (
      isSignedIn &&
      req.existingDoc?.tier === 'MAXIMUM_SECURITY' &&
      typeof req.queryLimit === 'number' &&
      req.queryLimit <= 50
    ) {
      return 'ALLOW';
    }
    return 'PERMISSION_DENIED';
  }

  if (req.method === 'create') {
    if (
      isVerifiedUser &&
      isValidId(req.pathUserId) &&
      req.pathUserId === req.auth?.uid &&
      isValidEntry(req.incomingDoc) &&
      req.incomingDoc?.createdAt === req.requestTimeMs &&
      req.incomingDoc?.updatedAt === req.requestTimeMs
    ) {
      return 'ALLOW';
    }
    return 'PERMISSION_DENIED';
  }

  if (req.method === 'update') {
    if (
      !isVerifiedUser ||
      !isValidId(req.pathUserId) ||
      !isValidEntry(req.incomingDoc) ||
      !req.existingDoc ||
      !req.incomingDoc ||
      req.pathUserId !== req.auth?.uid ||
      req.incomingDoc.userId !== req.existingDoc.userId ||
      req.incomingDoc.createdAt !== req.existingDoc.createdAt ||
      req.incomingDoc.updatedAt !== req.requestTimeMs
    ) {
      return 'PERMISSION_DENIED';
    }
    const changed = Object.keys(req.incomingDoc).filter(
      (k) => JSON.stringify(req.incomingDoc?.[k]) !== JSON.stringify(req.existingDoc?.[k]),
    );
    const improveAllowed = new Set([
      'callsign',
      'entropyBits',
      'charLength',
      'poolSize',
      'badgeCount',
      'earnedBadges',
      'updatedAt',
    ]);
    const renameAllowed = new Set(['callsign', 'updatedAt']);

    const isImprove =
      Number(req.incomingDoc.entropyBits) > Number(req.existingDoc.entropyBits) &&
      changed.every((k) => improveAllowed.has(k));
    const isRename = changed.every((k) => renameAllowed.has(k));

    return isImprove || isRename ? 'ALLOW' : 'PERMISSION_DENIED';
  }

  return 'PERMISSION_DENIED';
}

const NOW = 1793781800000;
const VALID_DOC = {
  userId: 'user_alpha',
  callsign: 'CipherFox',
  entropyBits: 124.5,
  charLength: 20,
  poolSize: 94,
  badgeCount: 8,
  earnedBadges: [
    'len_12',
    'len_16',
    'upper_case',
    'lower_case',
    'digits',
    'symbols',
    'non_sequential',
    'high_entropy',
  ],
  tier: 'MAXIMUM_SECURITY',
  createdAt: NOW,
  updatedAt: NOW,
};

const dirtyDozen: { name: string; req: SimulatedRequest }[] = [
  {
    name: '1. Unauthenticated Write',
    req: { auth: null, pathUserId: 'user_alpha', requestTimeMs: NOW, method: 'create', incomingDoc: VALID_DOC },
  },
  {
    name: '2. Unverified Email Spoof',
    req: {
      auth: { uid: 'user_alpha', email_verified: false },
      pathUserId: 'user_alpha',
      requestTimeMs: NOW,
      method: 'create',
      incomingDoc: VALID_DOC,
    },
  },
  {
    name: '3. Cross-UID Identity Spoofing',
    req: {
      auth: { uid: 'attacker_1', email_verified: true },
      pathUserId: 'user_alpha',
      requestTimeMs: NOW,
      method: 'create',
      incomingDoc: VALID_DOC,
    },
  },
  {
    name: '4. Shadow Ghost Field Injection',
    req: {
      auth: { uid: 'user_alpha', email_verified: true },
      pathUserId: 'user_alpha',
      requestTimeMs: NOW,
      method: 'create',
      incomingDoc: { ...VALID_DOC, isAdmin: true },
    },
  },
  {
    name: '5. Sub-Threshold Entropy Submission',
    req: {
      auth: { uid: 'user_alpha', email_verified: true },
      pathUserId: 'user_alpha',
      requestTimeMs: NOW,
      method: 'create',
      incomingDoc: { ...VALID_DOC, entropyBits: 64 },
    },
  },
  {
    name: '6. Resource Poisoning Oversized Callsign',
    req: {
      auth: { uid: 'user_alpha', email_verified: true },
      pathUserId: 'user_alpha',
      requestTimeMs: NOW,
      method: 'create',
      incomingDoc: { ...VALID_DOC, callsign: 'X'.repeat(500) },
    },
  },
  {
    name: '7. Path ID Poisoning',
    req: {
      auth: { uid: 'bad/id$!', email_verified: true },
      pathUserId: 'bad/id$!',
      requestTimeMs: NOW,
      method: 'create',
      incomingDoc: { ...VALID_DOC, userId: 'bad/id$!' },
    },
  },
  {
    name: '8. Array Badge Poisoning',
    req: {
      auth: { uid: 'user_alpha', email_verified: true },
      pathUserId: 'user_alpha',
      requestTimeMs: NOW,
      method: 'create',
      incomingDoc: {
        ...VALID_DOC,
        earnedBadges: ['hacked_badge', 'len_16', 'upper_case', 'lower_case', 'digits', 'symbols'],
        badgeCount: 6,
      },
    },
  },
  {
    name: '9. Client Timestamp Forgery',
    req: {
      auth: { uid: 'user_alpha', email_verified: true },
      pathUserId: 'user_alpha',
      requestTimeMs: NOW,
      method: 'create',
      incomingDoc: { ...VALID_DOC, createdAt: NOW - 99999 },
    },
  },
  {
    name: '10. Immortal Field Mutation on Update',
    req: {
      auth: { uid: 'user_alpha', email_verified: true },
      pathUserId: 'user_alpha',
      requestTimeMs: NOW + 5000,
      method: 'update',
      existingDoc: VALID_DOC,
      incomingDoc: { ...VALID_DOC, entropyBits: 140, createdAt: NOW + 5000, updatedAt: NOW + 5000 },
    },
  },
  {
    name: '11. Score Downgrade Update',
    req: {
      auth: { uid: 'user_alpha', email_verified: true },
      pathUserId: 'user_alpha',
      requestTimeMs: NOW + 5000,
      method: 'update',
      existingDoc: VALID_DOC,
      incomingDoc: { ...VALID_DOC, entropyBits: 110, updatedAt: NOW + 5000 },
    },
  },
  {
    name: '12. Unbounded List Scraping',
    req: {
      auth: { uid: 'user_alpha', email_verified: true },
      pathUserId: '',
      requestTimeMs: NOW,
      method: 'list',
      queryLimit: 500,
      existingDoc: VALID_DOC,
    },
  },
];

for (const testCase of dirtyDozen) {
  const outcome = evaluateSimulatedRule(testCase.req);
  if (outcome !== 'PERMISSION_DENIED') {
    throw new Error(`Security assertion failed for ${testCase.name}: got ${outcome}`);
  }
}
