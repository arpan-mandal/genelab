/**
 * GeneLab — Open Reading Frame (ORF) Finder
 * Discovers candidate coding sequences across all 6 reading frames.
 */

import { ORFItem, ReadingFrameId } from './types';
import { getReverseComplementSequence } from './nucleotide';
import { translateReadingFrame } from './translation';

export interface ORFOptions {
  minCodonLength: number; // default e.g. 20 or 30 codons
  requireStartCodon: boolean; // default true (ATG)
  allowAlternativeStarts: boolean; // false standard
}

export const DEFAULT_ORF_OPTIONS: ORFOptions = {
  minCodonLength: 20, // 60 nt minimum
  requireStartCodon: true,
  allowAlternativeStarts: false,
};

/**
 * Scans a strand for Open Reading Frames in frames 0, 1, and 2.
 */
function scanStrandORFs(
  sequence: string,
  isReverse: boolean,
  originalLength: number,
  options: ORFOptions
): ORFItem[] {
  const orfs: ORFItem[] = [];
  const strandSymbol: '+' | '-' = isReverse ? '-' : '+';

  // Frames 0, 1, 2 correspond to +1/+2/+3 or -1/-2/-3
  for (let frameOffset = 0; frameOffset < 3; frameOffset++) {
    const frameNumber = frameOffset + 1;
    const frameId: ReadingFrameId = isReverse
      ? (`-${frameNumber}` as ReadingFrameId)
      : (`+${frameNumber}` as ReadingFrameId);

    const frameResult = translateReadingFrame(
      isReverse ? getReverseComplementSequence(sequence) : sequence,
      `+${frameNumber}` as ReadingFrameId // translate forward on strand
    );

    const codons = frameResult.codons.filter(c => !c.isIncomplete);
    const numCodons = codons.length;

    let inOrf = false;
    let orfStartCodonIndex = -1;

    for (let i = 0; i < numCodons; i++) {
      const codon = codons[i];

      if (!inOrf) {
        if (codon.isStart || (!options.requireStartCodon && i === 0)) {
          inOrf = true;
          orfStartCodonIndex = i;
        }
      } else {
        if (codon.isStop) {
          // Found an in-frame stop codon!
          const orfCodons = codons.slice(orfStartCodonIndex, i + 1);
          const codonCount = orfCodons.length; // includes stop

          if (codonCount >= options.minCodonLength) {
            const startCodonObj = orfCodons[0];
            const stopCodonObj = orfCodons[orfCodons.length - 1];

            const ntSeq = orfCodons.map(c => c.codon).join('');
            const aaSeq = orfCodons.map(c => c.aminoAcidOne).join('');

            // Map coordinates back to original genomic 5' -> 3' sequence
            let genomicStart = 0;
            let genomicEnd = 0;

            if (!isReverse) {
              genomicStart = startCodonObj.offset + 1;
              genomicEnd = stopCodonObj.offset + 3;
            } else {
              // On reverse strand, offset 0 is originalLength
              genomicStart = originalLength - (stopCodonObj.offset + 2);
              genomicEnd = originalLength - startCodonObj.offset;
            }

            orfs.push({
              id: `ORF-${frameId}-${genomicStart}-${genomicEnd}`,
              frame: frameId,
              strand: strandSymbol,
              startPos: Math.min(genomicStart, genomicEnd),
              endPos: Math.max(genomicStart, genomicEnd),
              nucleotideLength: ntSeq.length,
              proteinLength: codonCount - 1, // minus stop codon
              nucleotideSequence: ntSeq,
              proteinSequence: aaSeq,
              startCodon: startCodonObj.codon,
              stopCodon: stopCodonObj.codon,
            });
          }

          inOrf = false;
          orfStartCodonIndex = -1;
        }
      }
    }
  }

  return orfs;
}

/**
 * Finds all candidate ORFs across all six reading frames.
 */
export function findOpenReadingFrames(
  sequence: string,
  options: ORFOptions = DEFAULT_ORF_OPTIONS
): ORFItem[] {
  if (sequence.length < 3) return [];

  const forwardORFs = scanStrandORFs(sequence, false, sequence.length, options);
  const reverseORFs = scanStrandORFs(sequence, true, sequence.length, options);

  const combined = [...forwardORFs, ...reverseORFs];

  // Sort by nucleotide length descending (longest candidate ORFs first)
  combined.sort((a, b) => b.nucleotideLength - a.nucleotideLength);

  return combined;
}
