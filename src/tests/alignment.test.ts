import { describe, it, expect } from 'vitest';
import {
  needlemanWunschAlign,
  validateAlignmentInputs,
  DEFAULT_ALIGNMENT_OPTIONS,
} from '../bio/alignment';

describe('Needleman-Wunsch Pairwise Global Alignment', () => {
  it('identically aligns identical sequences with 100% identity and 0 gaps', () => {
    const seq = 'ATGCGATCGATC';
    const res = needlemanWunschAlign(seq, seq, DEFAULT_ALIGNMENT_OPTIONS);

    expect(res.seq1Aligned).toBe(seq);
    expect(res.seq2Aligned).toBe(seq);
    expect(res.matches).toBe(seq.length);
    expect(res.mismatches).toBe(0);
    expect(res.gaps).toBe(0);
    expect(res.identityPercentage).toBe(100.0);
    // Score = 12 * 2 = 24
    expect(res.score).toBe(seq.length * DEFAULT_ALIGNMENT_OPTIONS.matchScore);
  });

  it('correctly identifies single nucleotide mismatches', () => {
    const s1 = 'ATGCA';
    const s2 = 'ATGTA'; // C -> T mismatch at pos 4
    const res = needlemanWunschAlign(s1, s2, { matchScore: 2, mismatchPenalty: -1, gapPenalty: -2 });

    expect(res.matches).toBe(4);
    expect(res.mismatches).toBe(1);
    expect(res.gaps).toBe(0);
    expect(res.alignmentLength).toBe(5);
    expect(res.identityPercentage).toBe(80.0);
    // Score = 4 * 2 - 1 = 7
    expect(res.score).toBe(7);
  });

  it('inserts gaps correctly to align sequences with indels', () => {
    const s1 = 'ATGCAT';
    const s2 = 'ATGTCAT'; // insertion of T
    const res = needlemanWunschAlign(s1, s2, { matchScore: 2, mismatchPenalty: -1, gapPenalty: -2 });

    expect(res.gaps).toBe(1);
    expect(res.alignmentLength).toBe(7);
    expect(res.matches).toBe(6);
    // Expect identity = (6 / 7) * 100 ~ 85.71%
    expect(res.identityPercentage).toBeCloseTo(85.71, 1);
  });

  it('validates empty and excessive inputs', () => {
    const resEmpty = validateAlignmentInputs('', 'ATGC');
    expect(resEmpty.canAlign).toBe(false);

    const resInvalid = validateAlignmentInputs('ATGC123', 'ATGC');
    expect(resInvalid.canAlign).toBe(false);
    expect(resInvalid.error).toContain('Sequence 1 validation failed');
  });
});
