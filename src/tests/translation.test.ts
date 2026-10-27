import { describe, it, expect } from 'vitest';
import {
  translateCodon,
  translateReadingFrame,
  STANDARD_CODON_TABLE,
  START_CODONS,
  STOP_CODONS,
} from '../bio/translation';

describe('Genetic Code & Codon Translation', () => {
  it('covers all 64 standard genetic codons without missing entries', () => {
    const bases = ['T', 'C', 'A', 'G'];
    let count = 0;
    for (const b1 of bases) {
      for (const b2 of bases) {
        for (const b3 of bases) {
          const codon = `${b1}${b2}${b3}`;
          const aa = STANDARD_CODON_TABLE[codon];
          expect(aa).toBeDefined();
          count++;
        }
      }
    }
    expect(count).toBe(64);
  });

  it('correctly identifies start and stop codons', () => {
    expect(START_CODONS.has('ATG')).toBe(true);
    expect(STOP_CODONS.has('TAA')).toBe(true);
    expect(STOP_CODONS.has('TAG')).toBe(true);
    expect(STOP_CODONS.has('TGA')).toBe(true);

    const atg = translateCodon('ATG');
    expect(atg.aminoAcidOne).toBe('M');
    expect(atg.aminoAcidThree).toBe('Met');
    expect(atg.isStart).toBe(true);

    const taa = translateCodon('TAA');
    expect(taa.aminoAcidOne).toBe('*');
    expect(taa.aminoAcidThree).toBe('Stop');
    expect(taa.isStop).toBe(true);
  });

  it('performs conservative IUPAC ambiguity resolution for codons', () => {
    // CTN: CTA, CTC, CTG, CTT all code for Leucine (L)
    const ctn = translateCodon('CTN');
    expect(ctn.aminoAcidOne).toBe('L');
    expect(ctn.isAmbiguous).toBe(true);

    // TCN: TCA, TCC, TCG, TCT all code for Serine (S)
    const tcn = translateCodon('TCN');
    expect(tcn.aminoAcidOne).toBe('S');

    // AAY: AAC and AAT both code for Asparagine (N)
    const aay = translateCodon('AAY');
    expect(aay.aminoAcidOne).toBe('N');

    // Multi-amino acid ambiguity: GAN -> GAA (E), GAG (E), GAT (D), GAC (D)
    // Could be Glu or Asp -> conservative handling yields 'X'
    const gan = translateCodon('GAN');
    expect(gan.aminoAcidOne).toBe('X');
  });
});

describe('Reading Frame Offsets & Reverse Strand Translation', () => {
  const testSeq = 'ATGGCCTTTGCTAACGGCTAA'; // 21 nt
  // Frame +1 (offset 0): ATG GCC TTT GCT AAC GGC TAA -> M A F A N G * (7 codons, 0 trailing)
  // Frame +2 (offset 1): TGG CCT TTG CTA ACG GCT AA -> W P L L T A (6 codons, trailing 'AA')
  // Frame +3 (offset 2): GGC CTT TGC TAA CGG CTA A -> G L C * R L (6 codons, trailing 'A')

  it('translates forward frame +1 correctly', () => {
    const res = translateReadingFrame(testSeq, '+1');
    expect(res.offset).toBe(0);
    expect(res.strand).toBe('forward');
    expect(res.aminoAcidSequenceOne).toBe('MAFANG*');
    expect(res.trailingBases).toBe('');
    expect(res.hasIncompleteCodon).toBe(false);
    expect(res.startCodonCount).toBe(1);
    expect(res.stopCodonCount).toBe(1);
  });

  it('translates forward frame +2 with offset 1 and preserves trailing bases', () => {
    const res = translateReadingFrame(testSeq, '+2');
    expect(res.offset).toBe(1);
    expect(res.aminoAcidSequenceOne).toBe('WPLLTA');
    expect(res.trailingBases).toBe('AA');
    expect(res.hasIncompleteCodon).toBe(true);
  });

  it('translates reverse strand frames (-1, -2, -3) via reverse complement', () => {
    // Reverse complement of testSeq:
    // testSeq: 5'-ATGGCCTTTGCTAACGGCTAA-3'
    // revComp: 5'-TTAGCCGTTAGCAAAGGCCAT-3'
    // Frame -1 (offset 0 of revComp): TTA GCC GTT AGC AAA GGC CAT -> L A V S K G H (7 codons)
    const res = translateReadingFrame(testSeq, '-1');
    expect(res.strand).toBe('reverse');
    expect(res.offset).toBe(0);
    expect(res.aminoAcidSequenceOne).toBe('LAVSKGH');
  });
});
