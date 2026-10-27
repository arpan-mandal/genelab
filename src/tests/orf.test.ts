import { describe, it, expect } from 'vitest';
import { findOpenReadingFrames } from '../bio/orf';

describe('Open Reading Frame (ORF) Finder', () => {
  it('identifies an intact ORF with start ATG and stop TAA', () => {
    // 5' - ATG GCC TTT GCT AAC GGC TAA - 3' (7 codons, 21 nt)
    const seq = 'ATGGCCTTTGCTAACGGCTAA';
    const orfs = findOpenReadingFrames(seq, { minCodonLength: 5, requireStartCodon: true, allowAlternativeStarts: false });

    expect(orfs.length).toBeGreaterThan(0);
    const topOrf = orfs[0];
    expect(topOrf.frame).toBe('+1');
    expect(topOrf.strand).toBe('+');
    expect(topOrf.startCodon).toBe('ATG');
    expect(topOrf.stopCodon).toBe('TAA');
    expect(topOrf.nucleotideLength).toBe(21);
    expect(topOrf.proteinLength).toBe(6); // 6 amino acids before stop
    expect(topOrf.proteinSequence).toBe('MAFANG*');
  });

  it('filters out ORFs below minimum length threshold', () => {
    const seq = 'ATGGCCTAA'; // only 3 codons (9 nt)
    const orfs = findOpenReadingFrames(seq, { minCodonLength: 10, requireStartCodon: true, allowAlternativeStarts: false });
    expect(orfs.length).toBe(0);
  });
});
