/**
 * GeneLab — Scientific Bioinformatics Types
 */

export type Nucleotide = 'A' | 'T' | 'G' | 'C' | 'U';

export type IUPACCode = 
  | 'A' | 'T' | 'G' | 'C' | 'U'
  | 'R' | 'Y' | 'S' | 'W' | 'K' | 'M'
  | 'B' | 'D' | 'H' | 'V' | 'N';

export interface IUPACDefinition {
  code: string;
  name: string;
  meaning: string;
  bases: string[];
  complement: string;
}

export interface SequenceValidationResult {
  isValid: boolean;
  cleanedSequence: string;
  fastaHeader?: string;
  error?: string;
  invalidCharacters: { char: string; count: number; positions: number[] }[];
  totalLength: number;
  unambiguousLength: number;
  ambiguousLength: number;
  hasAmbiguous: boolean;
  isRNA: boolean;
}

export interface NucleotideStats {
  totalLength: number;
  unambiguousLength: number;
  ambiguousLength: number;
  counts: {
    A: number;
    T: number;
    G: number;
    C: number;
    U: number;
    ambiguous: Record<string, number>;
  };
  percentages: {
    A: number;
    T: number;
    G: number;
    C: number;
    U: number;
    ambiguous: number;
  };
  gcContent: {
    // For standard sequences: (G + C) / length * 100
    standard: number;
    // For sequences with ambiguous bases: (G + C) / unambiguousLength * 100
    unambiguousFraction: number;
    // Minimum possible GC% assuming all ambiguous bases are A/T
    minPossible: number;
    // Maximum possible GC% assuming all ambiguous bases are G/C
    maxPossible: number;
    // IUPAC-weighted expected GC% (e.g. S=100% GC, W=0%, R=50% GC, etc.)
    weightedExpected: number;
    hasAmbiguityWarning: boolean;
    note: string;
  };
  atContent: {
    standard: number;
    unambiguousFraction: number;
    note: string;
  };
  molecularWeightEstimatedDa: number; // Approximate g/mol for single-stranded DNA
}

export interface SequenceTransformations {
  original: string;
  complement: string;
  reverse: string;
  reverseComplement: string;
  transcribedRNA: string; // T -> U
  reverseTranscribedDNA?: string; // U -> T
}

export type ReadingFrameId = '+1' | '+2' | '+3' | '-1' | '-2' | '-3';

export interface CodonInfo {
  codon: string;
  offset: number; // 0-based offset within the selected strand
  genomicStart: number; // 1-based index on original sequence
  genomicEnd: number; // 1-based index on original sequence
  aminoAcidOne: string; // e.g. 'M', '*', 'X'
  aminoAcidThree: string; // e.g. 'Met', 'Stop', 'Unk'
  aminoAcidName: string; // e.g. 'Methionine'
  property: 'hydrophobic' | 'polar' | 'positive' | 'negative' | 'stop' | 'special' | 'ambiguous';
  isStart: boolean;
  isStop: boolean;
  isAmbiguous: boolean;
  isIncomplete: boolean;
}

export interface ReadingFrameResult {
  frameId: ReadingFrameId;
  strand: 'forward' | 'reverse';
  offset: number; // 0, 1, or 2
  workingSequence: string; // forward sequence or reverse complement
  codons: CodonInfo[];
  aminoAcidSequenceOne: string;
  aminoAcidSequenceThree: string;
  trailingBases: string;
  hasIncompleteCodon: boolean;
  totalCodons: number;
  startCodonCount: number;
  stopCodonCount: number;
}

export interface AlignmentOptions {
  matchScore: number;
  mismatchPenalty: number; // negative number or positive penalty subtracted
  gapPenalty: number; // negative number or positive penalty subtracted
}

export interface AlignmentResult {
  seq1Aligned: string;
  seq2Aligned: string;
  matchLine: string; // '|' for match, ':' for transition, '.' for transversion/mismatch, ' ' for gap
  alignmentLength: number;
  score: number;
  matches: number;
  mismatches: number;
  gaps: number;
  gapOpenings: number;
  gapExtensions: number;
  identityPercentage: number; // (matches / alignmentLength) * 100
  similarityPercentage: number;
  seq1Gaps: number;
  seq2Gaps: number;
  executionTimeMs: number;
}

export interface ORFItem {
  id: string;
  frame: ReadingFrameId;
  strand: '+' | '-';
  startPos: number; // 1-based coordinate on original sequence
  endPos: number; // 1-based coordinate on original sequence
  nucleotideLength: number;
  proteinLength: number;
  nucleotideSequence: string;
  proteinSequence: string;
  startCodon: string;
  stopCodon: string;
}

export interface GCProfileWindow {
  position: number; // center or start base index
  gcPercent: number;
}
