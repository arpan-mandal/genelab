/**
 * GeneLab — Nucleotide Processing, Validation & IUPAC Nomenclature
 * Pure TypeScript implementation for browser-based bioinformatics.
 */

import {
  IUPACCode,
  IUPACDefinition,
  NucleotideStats,
  SequenceTransformations,
  SequenceValidationResult,
  GCProfileWindow
} from './types';

// Complete IUPAC nucleotide definition dictionary
export const IUPAC_DEFINITIONS: Record<IUPACCode, IUPACDefinition> = {
  A: { code: 'A', name: 'Adenine', meaning: 'Adenine', bases: ['A'], complement: 'T' },
  T: { code: 'T', name: 'Thymine', meaning: 'Thymine', bases: ['T'], complement: 'A' },
  G: { code: 'G', name: 'Guanine', meaning: 'Guanine', bases: ['G'], complement: 'C' },
  C: { code: 'C', name: 'Cytosine', meaning: 'Cytosine', bases: ['C'], complement: 'G' },
  U: { code: 'U', name: 'Uracil (RNA)', meaning: 'Uracil', bases: ['U'], complement: 'A' },
  R: { code: 'R', name: 'Purine', meaning: 'A or G', bases: ['A', 'G'], complement: 'Y' },
  Y: { code: 'Y', name: 'Pyrimidine', meaning: 'C or T', bases: ['C', 'T'], complement: 'R' },
  S: { code: 'S', name: 'Strong interaction (3 H-bonds)', meaning: 'G or C', bases: ['G', 'C'], complement: 'S' },
  W: { code: 'W', name: 'Weak interaction (2 H-bonds)', meaning: 'A or T', bases: ['A', 'T'], complement: 'W' },
  K: { code: 'K', name: 'Keto group', meaning: 'G or T', bases: ['G', 'T'], complement: 'M' },
  M: { code: 'M', name: 'Amino group', meaning: 'A or C', bases: ['A', 'C'], complement: 'K' },
  B: { code: 'B', name: 'Not A', meaning: 'C, G, or T', bases: ['C', 'G', 'T'], complement: 'V' },
  D: { code: 'D', name: 'Not C', meaning: 'A, G, or T', bases: ['A', 'G', 'T'], complement: 'H' },
  H: { code: 'H', name: 'Not G', meaning: 'A, C, or T', bases: ['A', 'C', 'T'], complement: 'D' },
  V: { code: 'V', name: 'Not T', meaning: 'A, C, or G', bases: ['A', 'C', 'G'], complement: 'B' },
  N: { code: 'N', name: 'Any nucleotide', meaning: 'A, C, G, or T', bases: ['A', 'C', 'G', 'T'], complement: 'N' },
};

export const STANDARD_DNA_BASES = new Set(['A', 'T', 'G', 'C']);
export const ALL_IUPAC_CODES = new Set(Object.keys(IUPAC_DEFINITIONS));

/**
 * Parses raw text input (including FASTA format) and validates against IUPAC nomenclature.
 * Does NOT silently discard or alter invalid characters; reports them with exact counts and positions.
 */
export function validateAndCleanSequence(rawInput: string): SequenceValidationResult {
  if (!rawInput || rawInput.trim().length === 0) {
    return {
      isValid: false,
      cleanedSequence: '',
      error: 'Sequence input is empty. Please enter or upload a DNA sequence.',
      invalidCharacters: [],
      totalLength: 0,
      unambiguousLength: 0,
      ambiguousLength: 0,
      hasAmbiguous: false,
      isRNA: false,
    };
  }

  // Extract FASTA header if present
  let fastaHeader: string | undefined = undefined;
  const lines = rawInput.split(/\r?\n/);
  const sequenceLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('>')) {
      if (!fastaHeader) {
        fastaHeader = trimmed.substring(1).trim();
      }
      // Skip header line
    } else if (trimmed.length > 0) {
      sequenceLines.push(trimmed);
    }
  }

  const rawSequence = sequenceLines.join('');
  if (rawSequence.length === 0) {
    return {
      isValid: false,
      cleanedSequence: '',
      fastaHeader,
      error: 'FASTA header was found, but no sequence data was present on subsequent lines.',
      invalidCharacters: [],
      totalLength: 0,
      unambiguousLength: 0,
      ambiguousLength: 0,
      hasAmbiguous: false,
      isRNA: false,
    };
  }

  // Check character by character, tracking whitespace vs invalid symbols
  const invalidCharMap = new Map<string, number[]>();
  const cleanedChars: string[] = [];
  let containsRNA = false;

  for (let i = 0; i < rawSequence.length; i++) {
    const char = rawSequence[i];
    // Ignore inline whitespace
    if (/\s/.test(char)) continue;

    const upperChar = char.toUpperCase();
    if (upperChar === 'U') {
      containsRNA = true;
      cleanedChars.push(upperChar);
    } else if (ALL_IUPAC_CODES.has(upperChar)) {
      cleanedChars.push(upperChar);
    } else {
      // Invalid character encountered!
      const existing = invalidCharMap.get(char) || [];
      existing.push(i + 1); // 1-based position for scientific reporting
      invalidCharMap.set(char, existing);
    }
  }

  if (invalidCharMap.size > 0) {
    const invalidList = Array.from(invalidCharMap.entries()).map(([char, positions]) => ({
      char,
      count: positions.length,
      positions: positions.slice(0, 10), // first 10 occurrences
    }));

    const detailStrings = invalidList
      .map(item => `'${item.char}' (${item.count}x at pos ${item.positions.join(', ')}${item.count > 10 ? '...' : ''})`)
      .join(', ');

    return {
      isValid: false,
      cleanedSequence: '',
      fastaHeader,
      error: `Invalid characters detected in sequence: ${detailStrings}. Allowed codes: standard bases (A, T, G, C) and IUPAC ambiguity codes (R, Y, S, W, K, M, B, D, H, V, N).`,
      invalidCharacters: invalidList,
      totalLength: rawSequence.length,
      unambiguousLength: 0,
      ambiguousLength: 0,
      hasAmbiguous: false,
      isRNA: containsRNA,
    };
  }

  const cleanedSequence = cleanedChars.join('');
  let unambiguousCount = 0;
  let ambiguousCount = 0;

  for (const c of cleanedChars) {
    if (STANDARD_DNA_BASES.has(c) || c === 'U') {
      unambiguousCount++;
    } else {
      ambiguousCount++;
    }
  }

  return {
    isValid: true,
    cleanedSequence,
    fastaHeader,
    invalidCharacters: [],
    totalLength: cleanedSequence.length,
    unambiguousLength: unambiguousCount,
    ambiguousLength: ambiguousCount,
    hasAmbiguous: ambiguousCount > 0,
    isRNA: containsRNA,
  };
}

/**
 * Calculates comprehensive nucleotide statistics, frequencies, and GC/AT content.
 * Strictly adheres to scientific calculation conventions with ambiguous base handling.
 */
export function calculateNucleotideStats(sequence: string): NucleotideStats {
  const totalLength = sequence.length;
  if (totalLength === 0) {
    return {
      totalLength: 0,
      unambiguousLength: 0,
      ambiguousLength: 0,
      counts: { A: 0, T: 0, G: 0, C: 0, U: 0, ambiguous: {} },
      percentages: { A: 0, T: 0, G: 0, C: 0, U: 0, ambiguous: 0 },
      gcContent: {
        standard: 0,
        unambiguousFraction: 0,
        minPossible: 0,
        maxPossible: 0,
        weightedExpected: 0,
        hasAmbiguityWarning: false,
        note: 'Empty sequence.',
      },
      atContent: {
        standard: 0,
        unambiguousFraction: 0,
        note: 'Empty sequence.',
      },
      molecularWeightEstimatedDa: 0,
    };
  }

  const counts = {
    A: 0,
    T: 0,
    G: 0,
    C: 0,
    U: 0,
    ambiguous: {} as Record<string, number>,
  };

  let unambiguousLength = 0;
  let ambiguousLength = 0;

  // Track weighted GC contributions for IUPAC codes
  // S = G/C (1.0), W = A/T (0.0), R = A/G (0.5), Y = C/T (0.5), M = A/C (0.5), K = G/T (0.5)
  // B = C/G/T (2/3 = 0.667), D = A/G/T (1/3 = 0.333), H = A/C/T (1/3 = 0.333), V = A/C/G (2/3 = 0.667), N = 0.5
  let weightedGCPoints = 0;

  for (let i = 0; i < totalLength; i++) {
    const char = sequence[i].toUpperCase();
    if (char === 'A') {
      counts.A++;
      unambiguousLength++;
    } else if (char === 'T') {
      counts.T++;
      unambiguousLength++;
    } else if (char === 'G') {
      counts.G++;
      unambiguousLength++;
      weightedGCPoints += 1.0;
    } else if (char === 'C') {
      counts.C++;
      unambiguousLength++;
      weightedGCPoints += 1.0;
    } else if (char === 'U') {
      counts.U++;
      unambiguousLength++;
    } else {
      // Ambiguous IUPAC code
      ambiguousLength++;
      counts.ambiguous[char] = (counts.ambiguous[char] || 0) + 1;

      switch (char) {
        case 'S': weightedGCPoints += 1.0; break; // G or C
        case 'W': weightedGCPoints += 0.0; break; // A or T
        case 'R': weightedGCPoints += 0.5; break; // A or G
        case 'Y': weightedGCPoints += 0.5; break; // C or T
        case 'K': weightedGCPoints += 0.5; break; // G or T
        case 'M': weightedGCPoints += 0.5; break; // A or C
        case 'B': weightedGCPoints += 2 / 3; break; // C, G, T
        case 'V': weightedGCPoints += 2 / 3; break; // A, C, G
        case 'D': weightedGCPoints += 1 / 3; break; // A, G, T
        case 'H': weightedGCPoints += 1 / 3; break; // A, C, T
        case 'N': weightedGCPoints += 0.5; break; // Any
        default: break;
      }
    }
  }

  // Basic percentages
  const percentages = {
    A: Number(((counts.A / totalLength) * 100).toFixed(2)),
    T: Number(((counts.T / totalLength) * 100).toFixed(2)),
    G: Number(((counts.G / totalLength) * 100).toFixed(2)),
    C: Number(((counts.C / totalLength) * 100).toFixed(2)),
    U: Number(((counts.U / totalLength) * 100).toFixed(2)),
    ambiguous: Number(((ambiguousLength / totalLength) * 100).toFixed(2)),
  };

  const gPlusC = counts.G + counts.C;
  const standardGC = Number(((gPlusC / totalLength) * 100).toFixed(2));
  const standardAT = Number((((counts.A + counts.T + counts.U) / totalLength) * 100).toFixed(2));

  let unambiguousGC = standardGC;
  let unambiguousAT = standardAT;
  let minPossibleGC = standardGC;
  let maxPossibleGC = standardGC;
  let weightedGC = standardGC;
  let gcNote = 'Standard calculation: ((G + C) / total sequence length) × 100.';
  let atNote = 'Standard calculation: ((A + T) / total sequence length) × 100.';
  const hasAmbiguityWarning = ambiguousLength > 0;

  if (hasAmbiguityWarning) {
    if (unambiguousLength > 0) {
      unambiguousGC = Number(((gPlusC / unambiguousLength) * 100).toFixed(2));
      unambiguousAT = Number((((counts.A + counts.T + counts.U) / unambiguousLength) * 100).toFixed(2));
    } else {
      unambiguousGC = 0;
      unambiguousAT = 0;
    }
    // Min possible: all ambiguous bases turn out to be A or T
    minPossibleGC = Number(((gPlusC / totalLength) * 100).toFixed(2));
    // Max possible: all ambiguous bases turn out to be G or C
    maxPossibleGC = Number((((gPlusC + ambiguousLength) / totalLength) * 100).toFixed(2));
    // Expected based on IUPAC nucleotide probabilities
    weightedGC = Number(((weightedGCPoints / totalLength) * 100).toFixed(2));

    gcNote = `Contains ${ambiguousLength} ambiguous nucleotide(s) (${percentages.ambiguous}%). Exact GC percentage is indeterminate. Unambiguous base fraction is ${unambiguousGC}% (denominator: ${unambiguousLength} standard bases). Range across possible base identities is ${minPossibleGC}% – ${maxPossibleGC}%.`;
    atNote = `Calculated over ${unambiguousLength} standard bases: ${unambiguousAT}%.`;
  }

  // Approximate single-stranded DNA molecular weight:
  // dAMP: 331.2 g/mol, dCMP: 307.2 g/mol, dGMP: 347.2 g/mol, dTMP: 322.2 g/mol
  // minus water for phosphodiester bonds ~ 61.96 Da
  const mw = (counts.A * 313.21) + (counts.T * 304.2) + (counts.C * 289.18) + (counts.G * 329.21) + 79.0;

  return {
    totalLength,
    unambiguousLength,
    ambiguousLength,
    counts,
    percentages,
    gcContent: {
      standard: standardGC,
      unambiguousFraction: unambiguousGC,
      minPossible: minPossibleGC,
      maxPossible: maxPossibleGC,
      weightedExpected: weightedGC,
      hasAmbiguityWarning,
      note: gcNote,
    },
    atContent: {
      standard: standardAT,
      unambiguousFraction: unambiguousAT,
      note: atNote,
    },
    molecularWeightEstimatedDa: Math.round(mw),
  };
}

/**
 * Generates the complement of a nucleotide sequence adhering to IUPAC standards.
 */
export function getComplementSequence(sequence: string): string {
  const complementMap: Record<string, string> = {
    A: 'T', T: 'A', G: 'C', C: 'G', U: 'A',
    R: 'Y', Y: 'R', S: 'S', W: 'W', K: 'M', M: 'K',
    B: 'V', D: 'H', H: 'D', V: 'B', N: 'N',
    // lowercases
    a: 't', t: 'a', g: 'c', c: 'g', u: 'a',
    r: 'y', y: 'r', s: 's', w: 'w', k: 'm', m: 'k',
    b: 'v', d: 'h', h: 'd', v: 'b', n: 'n',
  };

  const result: string[] = [];
  for (let i = 0; i < sequence.length; i++) {
    const char = sequence[i];
    result.push(complementMap[char] || char);
  }
  return result.join('');
}

/**
 * Reverses a sequence string (3' -> 5' if original was 5' -> 3').
 */
export function getReverseSequence(sequence: string): string {
  return sequence.split('').reverse().join('');
}

/**
 * Generates the reverse complement (standard antiparallel complementary strand in 5' -> 3' direction).
 */
export function getReverseComplementSequence(sequence: string): string {
  return getReverseSequence(getComplementSequence(sequence));
}

/**
 * Simulates in vivo transcription: DNA coding strand to mRNA transcript (T -> U).
 */
export function transcribeDnaToRna(dnaSequence: string): string {
  return dnaSequence.replace(/T/g, 'U').replace(/t/g, 'u');
}

/**
 * Reverse transcription: RNA to cDNA (U -> T).
 */
export function reverseTranscribeRnaToDna(rnaSequence: string): string {
  return rnaSequence.replace(/U/g, 'T').replace(/u/g, 't');
}

/**
 * Performs all standard sequence transformations in one pass.
 */
export function getAllTransformations(sequence: string): SequenceTransformations {
  const complement = getComplementSequence(sequence);
  const reverse = getReverseSequence(sequence);
  const reverseComplement = getReverseComplementSequence(sequence);
  const transcribedRNA = transcribeDnaToRna(sequence);
  const reverseTranscribedDNA = reverseTranscribeRnaToDna(sequence);

  return {
    original: sequence,
    complement,
    reverse,
    reverseComplement,
    transcribedRNA,
    reverseTranscribedDNA,
  };
}

/**
 * Computes a sliding-window GC content profile across the sequence.
 * Essential for identifying GC-rich islands, promoter regions, and compositional bias.
 */
export function calculateGCProfile(sequence: string, windowSize = 30, step = 5): GCProfileWindow[] {
  const len = sequence.length;
  if (len < windowSize) {
    if (len === 0) return [];
    // Single window for short sequence
    const stats = calculateNucleotideStats(sequence);
    return [{ position: 1, gcPercent: stats.gcContent.standard }];
  }

  const profile: GCProfileWindow[] = [];
  for (let start = 0; start <= len - windowSize; start += step) {
    const windowSeq = sequence.substring(start, start + windowSize);
    let gcCount = 0;
    let standardCount = 0;
    for (let j = 0; j < windowSeq.length; j++) {
      const c = windowSeq[j].toUpperCase();
      if (c === 'G' || c === 'C') {
        gcCount++;
        standardCount++;
      } else if (c === 'A' || c === 'T' || c === 'U') {
        standardCount++;
      }
    }
    const gcPct = standardCount > 0 ? Number(((gcCount / windowSeq.length) * 100).toFixed(1)) : 0;
    profile.push({
      position: start + Math.floor(windowSize / 2) + 1, // center base (1-based)
      gcPercent: gcPct,
    });
  }

  return profile;
}
