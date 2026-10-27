/**
 * GeneLab — Translation & Reading Frames
 * Standard Genetic Code (Universal), IUPAC Ambiguity Resolution,
 * and 6-frame translation (+1, +2, +3, -1, -2, -3).
 */

import { CodonInfo, ReadingFrameId, ReadingFrameResult } from './types';
import { getReverseComplementSequence, IUPAC_DEFINITIONS } from './nucleotide';

export interface AminoAcidDef {
  name: string;
  oneLetter: string;
  threeLetter: string;
  property: 'hydrophobic' | 'polar' | 'positive' | 'negative' | 'stop' | 'special' | 'ambiguous';
  description: string;
}

// Complete 20 Standard Amino Acids + Stop + Ambiguous
export const AMINO_ACIDS: Record<string, AminoAcidDef> = {
  A: { name: 'Alanine', oneLetter: 'A', threeLetter: 'Ala', property: 'hydrophobic', description: 'Small nonpolar aliphatic amino acid' },
  R: { name: 'Arginine', oneLetter: 'R', threeLetter: 'Arg', property: 'positive', description: 'Positively charged basic amino acid with guanidinium group' },
  N: { name: 'Asparagine', oneLetter: 'N', threeLetter: 'Asn', property: 'polar', description: 'Polar uncharged amide amino acid' },
  D: { name: 'Aspartate', oneLetter: 'D', threeLetter: 'Asp', property: 'negative', description: 'Negatively charged acidic amino acid' },
  C: { name: 'Cysteine', oneLetter: 'C', threeLetter: 'Cys', property: 'special', description: 'Sulfhydryl-containing amino acid capable of disulfide bonding' },
  E: { name: 'Glutamate', oneLetter: 'E', threeLetter: 'Glu', property: 'negative', description: 'Negatively charged acidic amino acid' },
  Q: { name: 'Glutamine', oneLetter: 'Q', threeLetter: 'Gln', property: 'polar', description: 'Polar uncharged amide amino acid' },
  G: { name: 'Glycine', oneLetter: 'G', threeLetter: 'Gly', property: 'special', description: 'Smallest achiral amino acid conferring high conformational flexibility' },
  H: { name: 'Histidine', oneLetter: 'H', threeLetter: 'His', property: 'positive', description: 'Basic amino acid with imidazole side chain often in enzyme active sites' },
  I: { name: 'Isoleucine', oneLetter: 'I', threeLetter: 'Ile', property: 'hydrophobic', description: 'Branched-chain hydrophobic aliphatic amino acid' },
  L: { name: 'Leucine', oneLetter: 'L', threeLetter: 'Leu', property: 'hydrophobic', description: 'Branched-chain hydrophobic aliphatic amino acid' },
  K: { name: 'Lysine', oneLetter: 'K', threeLetter: 'Lys', property: 'positive', description: 'Positively charged basic amino acid with primary amine' },
  M: { name: 'Methionine', oneLetter: 'M', threeLetter: 'Met', property: 'hydrophobic', description: 'Sulfur-containing start codon amino acid' },
  F: { name: 'Phenylalanine', oneLetter: 'F', threeLetter: 'Phe', property: 'hydrophobic', description: 'Aromatic hydrophobic amino acid' },
  P: { name: 'Proline', oneLetter: 'P', threeLetter: 'Pro', property: 'special', description: 'Cyclic imino acid that breaks alpha-helices' },
  S: { name: 'Serine', oneLetter: 'S', threeLetter: 'Ser', property: 'polar', description: 'Polar hydroxyl-containing amino acid common in phosphorylation' },
  T: { name: 'Threonine', oneLetter: 'T', threeLetter: 'Thr', property: 'polar', description: 'Polar hydroxyl-containing amino acid with chiral beta-carbon' },
  W: { name: 'Tryptophan', oneLetter: 'W', threeLetter: 'Trp', property: 'hydrophobic', description: 'Largest aromatic amino acid with indole ring' },
  Y: { name: 'Tyrosine', oneLetter: 'Y', threeLetter: 'Tyr', property: 'polar', description: 'Aromatic hydroxyl-containing amino acid' },
  V: { name: 'Valine', oneLetter: 'V', threeLetter: 'Val', property: 'hydrophobic', description: 'Branched-chain hydrophobic aliphatic amino acid' },
  '*': { name: 'Stop Codon', oneLetter: '*', threeLetter: 'Stop', property: 'stop', description: 'Translation termination signal' },
  'X': { name: 'Unknown / Ambiguous', oneLetter: 'X', threeLetter: 'Xaa', property: 'ambiguous', description: 'Indeterminate amino acid due to IUPAC ambiguity' },
};

// Full 64 standard genetic codons mapping (NCBI translation table 1)
export const STANDARD_CODON_TABLE: Record<string, string> = {
  // Phenylalanine & Leucine
  TTT: 'F', TTC: 'F', TTA: 'L', TTG: 'L',
  // Serine
  TCT: 'S', TCC: 'S', TCA: 'S', TCG: 'S',
  // Tyrosine & Stop
  TAT: 'Y', TAC: 'Y', TAA: '*', TAG: '*',
  // Cysteine, Stop & Tryptophan
  TGT: 'C', TGC: 'C', TGA: '*', TGG: 'W',

  // Leucine
  CTT: 'L', CTC: 'L', CTA: 'L', CTG: 'L',
  // Proline
  CCT: 'P', CCC: 'P', CCA: 'P', CCG: 'P',
  // Histidine & Glutamine
  CAT: 'H', CAC: 'H', CAA: 'Q', CAG: 'Q',
  // Arginine
  CGT: 'R', CGC: 'R', CGA: 'R', CGG: 'R',

  // Isoleucine & Methionine (Start)
  ATT: 'I', ATC: 'I', ATA: 'I', ATG: 'M',
  // Threonine
  ACT: 'T', ACC: 'T', ACA: 'T', ACG: 'T',
  // Asparagine & Lysine
  AAT: 'N', AAC: 'N', AAA: 'K', AAG: 'K',
  // Serine & Arginine
  AGT: 'S', AGC: 'S', AGA: 'R', AGG: 'R',

  // Valine
  GTT: 'V', GTC: 'V', GTA: 'V', GTG: 'V',
  // Alanine
  GCT: 'A', GCC: 'A', GCA: 'A', GCG: 'A',
  // Aspartate & Glutamate
  GAT: 'D', GAC: 'D', GAA: 'E', GAG: 'E',
  // Glycine
  GGT: 'G', GGC: 'G', GGA: 'G', GGG: 'G',
};

export const START_CODONS = new Set(['ATG']);
export const STOP_CODONS = new Set(['TAA', 'TAG', 'TGA']);

/**
 * Expands an ambiguous IUPAC nucleotide into all possible standard bases (A, C, G, T).
 */
export function expandIUPACBase(base: string): string[] {
  const upper = base.toUpperCase();
  if (IUPAC_DEFINITIONS[upper as keyof typeof IUPAC_DEFINITIONS]) {
    // In DNA context, replace U with T
    return IUPAC_DEFINITIONS[upper as keyof typeof IUPAC_DEFINITIONS].bases.map(b => b === 'U' ? 'T' : b);
  }
  return [upper];
}

/**
 * Translates a 3-nucleotide codon using conservative IUPAC resolution.
 * If all possible base combinations code for the exact same amino acid, returns that amino acid.
 * If it could code for different amino acids, returns 'X' (ambiguous).
 */
export function translateCodon(codon: string): {
  aminoAcidOne: string;
  aminoAcidThree: string;
  name: string;
  property: AminoAcidDef['property'];
  isStart: boolean;
  isStop: boolean;
  isAmbiguous: boolean;
} {
  const cleanCodon = codon.toUpperCase().replace(/U/g, 'T');

  // Exact match in standard genetic code
  if (STANDARD_CODON_TABLE[cleanCodon] !== undefined) {
    const aaCode = STANDARD_CODON_TABLE[cleanCodon];
    const def = AMINO_ACIDS[aaCode] || AMINO_ACIDS['X'];
    return {
      aminoAcidOne: aaCode,
      aminoAcidThree: def.threeLetter,
      name: def.name,
      property: def.property,
      isStart: START_CODONS.has(cleanCodon),
      isStop: STOP_CODONS.has(cleanCodon),
      isAmbiguous: false,
    };
  }

  // Handle ambiguous codon: expand all IUPAC possibilities
  if (cleanCodon.length === 3) {
    const b0 = expandIUPACBase(cleanCodon[0]);
    const b1 = expandIUPACBase(cleanCodon[1]);
    const b2 = expandIUPACBase(cleanCodon[2]);

    const candidateAAs = new Set<string>();
    let couldBeStart = false;
    let couldBeStop = false;

    for (const c0 of b0) {
      for (const c1 of b1) {
        for (const c2 of b2) {
          const testCodon = `${c0}${c1}${c2}`;
          const aa = STANDARD_CODON_TABLE[testCodon];
          if (aa) {
            candidateAAs.add(aa);
            if (START_CODONS.has(testCodon)) couldBeStart = true;
            if (STOP_CODONS.has(testCodon)) couldBeStop = true;
          }
        }
      }
    }

    // Conservative resolution: If and only if all possible combinations map to a single amino acid!
    if (candidateAAs.size === 1) {
      const singleAA = Array.from(candidateAAs)[0];
      const def = AMINO_ACIDS[singleAA] || AMINO_ACIDS['X'];
      return {
        aminoAcidOne: singleAA,
        aminoAcidThree: def.threeLetter,
        name: def.name,
        property: def.property,
        isStart: couldBeStart,
        isStop: couldBeStop,
        isAmbiguous: true, // Marked as derived from ambiguous codon
      };
    }
  }

  // Truly ambiguous or unresolved codon
  return {
    aminoAcidOne: 'X',
    aminoAcidThree: 'Xaa',
    name: 'Unknown / Ambiguous',
    property: 'ambiguous',
    isStart: false,
    isStop: false,
    isAmbiguous: true,
  };
}

/**
 * Translates a nucleotide sequence in a specific reading frame (+1, +2, +3, -1, -2, -3).
 * Preserves incomplete trailing codons, calculates exact genomic coordinates, and returns
 * both 1-letter and 3-letter representations.
 */
export function translateReadingFrame(sequence: string, frameId: ReadingFrameId): ReadingFrameResult {
  const isReverse = frameId.startsWith('-');
  const frameOffset = parseInt(frameId.replace('+', '').replace('-', ''), 10) - 1; // 0, 1, or 2

  // For reverse strand, calculate reverse-complement first
  const workingSequence = isReverse ? getReverseComplementSequence(sequence) : sequence;
  const seqLength = workingSequence.length;

  const codons: CodonInfo[] = [];
  const aaListOne: string[] = [];
  const aaListThree: string[] = [];
  let startCodonCount = 0;
  let stopCodonCount = 0;

  let pos = frameOffset;
  while (pos + 3 <= seqLength) {
    const codonTriplet = workingSequence.substring(pos, pos + 3);
    const translation = translateCodon(codonTriplet);

    // Calculate original 1-based sequence coordinates
    let genomicStart = 0;
    let genomicEnd = 0;

    if (!isReverse) {
      genomicStart = pos + 1;
      genomicEnd = pos + 3;
    } else {
      // In reverse strand, coordinate on original sequence is inverted
      genomicStart = seqLength - (pos + 2);
      genomicEnd = seqLength - pos;
    }

    if (translation.isStart) startCodonCount++;
    if (translation.isStop) stopCodonCount++;

    codons.push({
      codon: codonTriplet,
      offset: pos,
      genomicStart,
      genomicEnd,
      aminoAcidOne: translation.aminoAcidOne,
      aminoAcidThree: translation.aminoAcidThree,
      aminoAcidName: translation.name,
      property: translation.property,
      isStart: translation.isStart,
      isStop: translation.isStop,
      isAmbiguous: translation.isAmbiguous,
      isIncomplete: false,
    });

    aaListOne.push(translation.aminoAcidOne);
    aaListThree.push(translation.aminoAcidThree);

    pos += 3;
  }

  // Trailing incomplete bases (1 or 2 nucleotides)
  const trailingBases = pos < seqLength ? workingSequence.substring(pos) : '';
  const hasIncompleteCodon = trailingBases.length > 0;

  if (hasIncompleteCodon) {
    const incompleteStart = isReverse ? (seqLength - workingSequence.length + 1) : pos + 1;
    const incompleteEnd = isReverse ? (seqLength - pos) : seqLength;
    codons.push({
      codon: trailingBases,
      offset: pos,
      genomicStart: incompleteStart,
      genomicEnd: incompleteEnd,
      aminoAcidOne: `(${trailingBases})`,
      aminoAcidThree: `(${trailingBases})`,
      aminoAcidName: `Incomplete trailing codon (${trailingBases.length} nt)`,
      property: 'special',
      isStart: false,
      isStop: false,
      isAmbiguous: false,
      isIncomplete: true,
    });
  }

  return {
    frameId,
    strand: isReverse ? 'reverse' : 'forward',
    offset: frameOffset,
    workingSequence,
    codons,
    aminoAcidSequenceOne: aaListOne.join(''),
    aminoAcidSequenceThree: aaListThree.join(' '),
    trailingBases,
    hasIncompleteCodon,
    totalCodons: codons.filter(c => !c.isIncomplete).length,
    startCodonCount,
    stopCodonCount,
  };
}

/**
 * Translates all six reading frames simultaneously.
 */
export function translateAllSixFrames(sequence: string): Record<ReadingFrameId, ReadingFrameResult> {
  return {
    '+1': translateReadingFrame(sequence, '+1'),
    '+2': translateReadingFrame(sequence, '+2'),
    '+3': translateReadingFrame(sequence, '+3'),
    '-1': translateReadingFrame(sequence, '-1'),
    '-2': translateReadingFrame(sequence, '-2'),
    '-3': translateReadingFrame(sequence, '-3'),
  };
}
