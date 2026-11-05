import { useState } from 'react';
import { EDUCATIONAL_SNIPPETS } from '../utils/passwordEvaluator';
import { ResilientImage } from './ResilientImage';
import keyspaceDiagramImg from '../assets/images/diagram_keyspace_growth_1793781838930.jpg';

export function CharacterEducation() {
  const [simLower, setSimLower] = useState(true);
  const [simUpper, setSimUpper] = useState(true);
  const [simDigits, setSimDigits] = useState(true);
  const [simSymbols, setSimSymbols] = useState(true);
  const [simLength, setSimLength] = useState(16);

  const activePool =
    (simLower ? 26 : 0) +
    (simUpper ? 26 : 0) +
    (simDigits ? 10 : 0) +
    (simSymbols ? 32 : 0);

  const safePool = Math.max(activePool, 26);
  const bitsPerChar = Math.log2(safePool);
  const simulatedBits = simLength * bitsPerChar;
  const baselineBits = simLength * Math.log2(26);
  const ratioAdvantage = Math.pow(safePool / 26, simLength);

  const advantageDisplay =
    ratioAdvantage < 1000
      ? `${ratioAdvantage.toFixed(1)}×`
      : `10^${Math.log10(ratioAdvantage).toFixed(1)}×`;

  // Build SVG polyline points across lengths L = 6..32
  const chartLengths = [6, 10, 14, 18, 22, 26, 30, 32];
  const mapX = (l: number) => 44 + ((l - 6) / (32 - 6)) * 396;
  const mapY = (bits: number) => 185 - (Math.min(bits, 220) / 220) * 155;

  const selectedPath = chartLengths
    .map((l, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(l).toFixed(1)} ${mapY(l * bitsPerChar).toFixed(1)}`)
    .join(' ');

  const baselinePath = chartLengths
    .map(
      (l, idx) =>
        `${idx === 0 ? 'M' : 'L'} ${mapX(l).toFixed(1)} ${mapY(l * Math.log2(26)).toFixed(1)}`,
    )
    .join(' ');

  const currentPointX = mapX(simLength);
  const currentPointY = mapY(simulatedBits);
  const threshold100Y = mapY(100);

  return (
    <section id="education" aria-labelledby="education-heading" className="space-y-8">
      <div className="max-w-3xl">
        <h2
          id="education-heading"
          className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
          style={{ textWrap: 'balance' }}
        >
          Why Character Diversity Multiplies Password Safety
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Cryptographic brute-force difficulty scales by <span className="font-mono italic">R^L</span>, where{' '}
          <span className="font-mono italic">R</span> is the size of the unlocked character pool and{' '}
          <span className="font-mono italic">L</span> is password length. Toggle character pools below to inspect how expanding{' '}
          <span className="font-mono italic">R</span> steepens the entropy slope.
        </p>
      </div>

      {/* Interactive Simulation Stage + Visual Keyspace Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Interactive Entropy Slope Explorer
              </h3>
              <span className="text-xs font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">
                H = {simLength} × log₂({safePool}) = {simulatedBits.toFixed(1)} bits
              </span>
            </div>

            {/* Interactive SVG Mathematical Curve */}
            <div className="w-full overflow-x-auto">
              <svg
                viewBox="0 0 460 215"
                role="img"
                aria-label="Coordinate plot comparing entropy bits across password lengths for active character pool versus lowercase-only baseline"
                className="w-full h-auto text-slate-500 dark:text-slate-400 select-none"
              >
                {/* Horizontal Grid Lines */}
                {[0, 50, 100, 150, 200].map((val) => {
                  const y = mapY(val);
                  return (
                    <g key={val}>
                      <line
                        x1="44"
                        y1={y}
                        x2="440"
                        y2={y}
                        stroke="currentColor"
                        strokeOpacity={val === 100 ? '0.45' : '0.14'}
                        strokeDasharray={val === 100 ? '4 4' : undefined}
                      />
                      <text
                        x="38"
                        y={y + 4}
                        textAnchor="end"
                        className="fill-current text-[10px] font-mono"
                      >
                        {val}b
                      </text>
                    </g>
                  );
                })}

                {/* 100-bit Maximum Security Equilibrium Label */}
                <text
                  x="438"
                  y={threshold100Y - 5}
                  textAnchor="end"
                  className="fill-emerald-600 dark:fill-emerald-400 text-[10px] font-mono font-semibold"
                >
                  100-Bit Max Security Threshold
                </text>

                {/* X-Axis Length Ticks */}
                {[8, 12, 16, 20, 24, 28, 32].map((len) => {
                  const x = mapX(len);
                  return (
                    <text
                      key={len}
                      x={x}
                      y="204"
                      textAnchor="middle"
                      className="fill-current text-[10px] font-mono"
                    >
                      L={len}
                    </text>
                  );
                })}

                {/* Baseline Lowercase Curve (R=26) */}
                <path
                  d={baselinePath}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                />

                {/* Active Pool Curve */}
                <path
                  d={selectedPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.75"
                />

                {/* Current Length Marker */}
                <circle
                  cx={currentPointX}
                  cy={currentPointY}
                  r="5"
                  className="fill-emerald-500 stroke-white dark:stroke-slate-900"
                  strokeWidth="2"
                />
              </svg>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-medium text-emerald-700 dark:text-emerald-400">
                Solid curve: Active Pool (R={safePool}, {bitsPerChar.toFixed(2)} bits/char)
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Dashed curve: Lowercase Only (R=26, {baselineBits.toFixed(1)} bits at L={simLength})
              </span>
            </div>
          </div>

          {/* Interactive Pool Toggles + Labeled Length Slider */}
          <div className="pt-5 border-t border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  {
                    label: 'Lowercase a–z (+26)',
                    active: simLower,
                    toggle: () => {
                      if (simLower && !simUpper && !simDigits && !simSymbols) return;
                      setSimLower((v) => !v);
                    },
                  },
                  {
                    label: 'Uppercase A–Z (+26)',
                    active: simUpper,
                    toggle: () => {
                      if (simUpper && !simLower && !simDigits && !simSymbols) return;
                      setSimUpper((v) => !v);
                    },
                  },
                  {
                    label: 'Digits 0–9 (+10)',
                    active: simDigits,
                    toggle: () => {
                      if (simDigits && !simLower && !simUpper && !simSymbols) return;
                      setSimDigits((v) => !v);
                    },
                  },
                  {
                    label: 'Symbols !@# (+32)',
                    active: simSymbols,
                    toggle: () => {
                      if (simSymbols && !simLower && !simUpper && !simDigits) return;
                      setSimSymbols((v) => !v);
                    },
                  },
                ] as const
              ).map((item) => (
                <button
                  key={item.label}
                  type="button"
                  aria-pressed={item.active}
                  onClick={item.toggle}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                    item.active
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {item.active ? `✓ ${item.label}` : item.label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor="sim-length-slider"
                  className="font-medium text-slate-700 dark:text-slate-300"
                >
                  Simulated Password Length: {simLength} characters
                </label>
                <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                  Keyspace gain vs lowercase: {advantageDisplay}
                </span>
              </div>
              <input
                id="sim-length-slider"
                type="range"
                min={8}
                max={32}
                step={1}
                value={simLength}
                onChange={(e) => setSimLength(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-400">
                <span>8 chars</span>
                <span>16 chars (NIST Vault)</span>
                <span>24 chars</span>
                <span>32 chars</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Keyspace Branching Card */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between">
          <div className="aspect-[4/3] w-full overflow-hidden bg-slate-950">
            <ResilientImage
              src={keyspaceDiagramImg}
              alt="Isometric scientific diagram showing exponential branching from a root node into a dense keyspace lattice"
              fallbackTitle="Exponential Keyspace Search Tree"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6 space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Combinatorial Branching Factor
            </h3>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Every position in your password acts as a branching node. When you unlock symbols alongside mixed-case letters and digits, each node splits into 94 branches instead of 26—turning shallow trees into astronomical search lattices.
            </p>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
              <span>26^16 = 4.36 × 10^22</span>
              <span aria-hidden="true">→</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                94^16 = 3.71 × 10^31
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Educational Character Safety Snippets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {EDUCATIONAL_SNIPPETS.map((item) => (
          <article
            key={item.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {item.title}
                </h3>
                <span className="text-xs font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">
                  +{item.poolAddition} symbols · {item.keyspaceMultiplier}
                </span>
              </div>

              <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                <span>Characters: {item.symbolClass}</span>
                <span className="mx-2" aria-hidden="true">·</span>
                <span>{item.exampleFormula}</span>
              </div>

              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {item.summary}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                <strong className="font-semibold text-slate-900 dark:text-slate-100">
                  Security Impact:
                </strong>{' '}
                {item.whyItMatters}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                <strong className="font-semibold text-slate-700 dark:text-slate-300">
                  Common Pitfall:
                </strong>{' '}
                {item.pitfallToAvoid}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
