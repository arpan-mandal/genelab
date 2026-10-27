/**
 * GeneLab — Pairwise Sequence Alignment
 * Needleman-Wunsch Global Alignment Algorithm with configurable scoring matrix.
 * Pure TypeScript implementation running fully locally in browser.
 */

import { AlignmentOptions, AlignmentResult } from './types';
import { validateAndCleanSequence } from './nucleotide';

export const DEFAULT_ALIGNMENT_OPTIONS: AlignmentOptions = {
  matchScore: 2,
  mismatchPenalty: -1,
  gapPenalty: -2,
};

/**
 * Maximum safe length for browser-based O(N*M) dynamic programming table.
 * 2500 x 2500 = 6.25M matrix cells, runs in ~50-100ms in modern JS engines.
 */
export const MAX_SAFE_ALIGNMENT_LENGTH = 2500;

export interface AlignmentValidation {
  canAlign: boolean;
  error?: string;
  warning?: string;
  cleanSeq1: string;
  cleanSeq2: string;
}

export function validateAlignmentInputs(rawSeq1: string, rawSeq2: string): AlignmentValidation {
  const v1 = validateAndCleanSequence(rawSeq1);
  if (!v1.isValid) {
    return {
      canAlign: false,
      error: `Sequence 1 validation failed: ${v1.error}`,
      cleanSeq1: '',
      cleanSeq2: '',
    };
  }

  const v2 = validateAndCleanSequence(rawSeq2);
  if (!v2.isValid) {
    return {
      canAlign: false,
      error: `Sequence 2 validation failed: ${v2.error}`,
      cleanSeq1: '',
      cleanSeq2: '',
    };
  }

  if (v1.cleanedSequence.length === 0 || v2.cleanedSequence.length === 0) {
    return {
      canAlign: false,
      error: 'Both sequences must contain at least one nucleotide base for alignment.',
      cleanSeq1: '',
      cleanSeq2: '',
    };
  }

  let warning: string | undefined = undefined;
  if (v1.cleanedSequence.length > MAX_SAFE_ALIGNMENT_LENGTH || v2.cleanedSequence.length > MAX_SAFE_ALIGNMENT_LENGTH) {
    return {
      canAlign: false,
      error: `Sequence length exceeds browser limit (${MAX_SAFE_ALIGNMENT_LENGTH} nt). Sequence 1 is ${v1.cleanedSequence.length} nt, Sequence 2 is ${v2.cleanedSequence.length} nt. Please use sequences under ${MAX_SAFE_ALIGNMENT_LENGTH} nt to prevent browser thread locking.`,
      cleanSeq1: '',
      cleanSeq2: '',
    };
  } else if (v1.cleanedSequence.length > 1000 || v2.cleanedSequence.length > 1000) {
    warning = 'One or both sequences exceed 1,000 nt. Computation may take several hundred milliseconds.';
  }

  return {
    canAlign: true,
    warning,
    cleanSeq1: v1.cleanedSequence,
    cleanSeq2: v2.cleanedSequence,
  };
}

/**
 * Executes Needleman-Wunsch Global Dynamic Programming Alignment.
 */
export function needlemanWunschAlign(
  seq1: string,
  seq2: string,
  options: AlignmentOptions = DEFAULT_ALIGNMENT_OPTIONS
): AlignmentResult {
  const startTime = performance.now();
  const n = seq1.length;
  const m = seq2.length;

  const match = options.matchScore;
  const mismatch = options.mismatchPenalty;
  const gap = options.gapPenalty;

  // Traceback direction bitflags
  // 1 = Diagonal (match/mismatch), 2 = Up (gap in seq2), 3 = Left (gap in seq1)
  const DIAG = 1;
  const UP = 2;
  const LEFT = 3;

  // Initialize DP Matrix: (n + 1) rows x (m + 1) cols
  // Flattened TypedArray for maximum cache locality and performance
  const cols = m + 1;
  const rows = n + 1;
  const scoreMatrix = new Int32Array(rows * cols);
  const tracebackMatrix = new Uint8Array(rows * cols);

  // Initialize borders
  scoreMatrix[0] = 0;
  for (let j = 1; j <= m; j++) {
    scoreMatrix[j] = j * gap;
    tracebackMatrix[j] = LEFT;
  }
  for (let i = 1; i <= n; i++) {
    scoreMatrix[i * cols] = i * gap;
    tracebackMatrix[i * cols] = UP;
  }

  // Fill Dynamic Programming Table
  for (let i = 1; i <= n; i++) {
    const char1 = seq1[i - 1];
    const rowOffset = i * cols;
    const prevRowOffset = (i - 1) * cols;

    for (let j = 1; j <= m; j++) {
      const char2 = seq2[j - 1];
      const matchScore = (char1 === char2) ? match : mismatch;

      const scoreDiag = scoreMatrix[prevRowOffset + (j - 1)] + matchScore;
      const scoreUp = scoreMatrix[prevRowOffset + j] + gap;
      const scoreLeft = scoreMatrix[rowOffset + (j - 1)] + gap;

      let maxScore = scoreDiag;
      let dir = DIAG;

      // Tie-breaking standard: Prefer diagonal (biological conservation), then Up, then Left
      if (scoreUp > maxScore) {
        maxScore = scoreUp;
        dir = UP;
      }
      if (scoreLeft > maxScore) {
        maxScore = scoreLeft;
        dir = LEFT;
      }

      scoreMatrix[rowOffset + j] = maxScore;
      tracebackMatrix[rowOffset + j] = dir;
    }
  }

  // Traceback from bottom-right (n, m) to top-left (0, 0)
  let i = n;
  let j = m;
  const aligned1Arr: string[] = [];
  const aligned2Arr: string[] = [];

  while (i > 0 || j > 0) {
    const dir = tracebackMatrix[i * cols + j];

    if (i > 0 && j > 0 && dir === DIAG) {
      aligned1Arr.push(seq1[i - 1]);
      aligned2Arr.push(seq2[j - 1]);
      i--;
      j--;
    } else if (i > 0 && (j === 0 || dir === UP)) {
      aligned1Arr.push(seq1[i - 1]);
      aligned2Arr.push('-');
      i--;
    } else {
      aligned1Arr.push('-');
      aligned2Arr.push(seq2[j - 1]);
      j--;
    }
  }

  // Reverse arrays to construct 5' -> 3' aligned sequences
  aligned1Arr.reverse();
  aligned2Arr.reverse();

  const seq1Aligned = aligned1Arr.join('');
  const seq2Aligned = aligned2Arr.join('');
  const alignmentLength = seq1Aligned.length;

  let matches = 0;
  let mismatches = 0;
  let totalGaps = 0;
  let seq1Gaps = 0;
  let seq2Gaps = 0;
  let gapOpenings = 0;
  let gapExtensions = 0;
  const matchLineChars: string[] = [];

  let inGap = false;

  for (let k = 0; k < alignmentLength; k++) {
    const c1 = seq1Aligned[k];
    const c2 = seq2Aligned[k];

    if (c1 === '-' || c2 === '-') {
      totalGaps++;
      if (c1 === '-') seq1Gaps++;
      if (c2 === '-') seq2Gaps++;
      matchLineChars.push(' ');

      if (!inGap) {
        gapOpenings++;
        inGap = true;
      } else {
        gapExtensions++;
      }
    } else {
      inGap = false;
      if (c1 === c2) {
        matches++;
        matchLineChars.push('|');
      } else {
        mismatches++;
        // Check transition vs transversion
        // Transitions: A<->G, C<->T (purine-purine or pyrimidine-pyrimidine)
        const isTransition =
          (c1 === 'A' && c2 === 'G') || (c1 === 'G' && c2 === 'A') ||
          (c1 === 'C' && c2 === 'T') || (c1 === 'T' && c2 === 'C');
        matchLineChars.push(isTransition ? ':' : '.');
      }
    }
  }

  const matchLine = matchLineChars.join('');
  // Explicitly documented percentage identity denominator:
  // Identity % = (matches / alignmentLength) * 100
  const identityPercentage = alignmentLength > 0
    ? Number(((matches / alignmentLength) * 100).toFixed(2))
    : 0;

  // Similarity includes transitions as conservative substitutions
  const similarityScore = matches + matchLineChars.filter(c => c === ':').length * 0.5;
  const similarityPercentage = alignmentLength > 0
    ? Number(((similarityScore / alignmentLength) * 100).toFixed(2))
    : 0;

  const totalScore = scoreMatrix[n * cols + m];
  const endTime = performance.now();

  return {
    seq1Aligned,
    seq2Aligned,
    matchLine,
    alignmentLength,
    score: totalScore,
    matches,
    mismatches,
    gaps: totalGaps,
    gapOpenings,
    gapExtensions,
    identityPercentage,
    similarityPercentage,
    seq1Gaps,
    seq2Gaps,
    executionTimeMs: Number((endTime - startTime).toFixed(2)),
  };
}
