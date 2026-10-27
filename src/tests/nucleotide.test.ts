import { describe, it, expect } from 'vitest';
import {
  validateAndCleanSequence,
  calculateNucleotideStats,
  getComplementSequence,
  getReverseSequence,
  getReverseComplementSequence,
  transcribeDnaToRna,
  calculateGCProfile,
} from '../bio/nucleotide';

describe('Nucleotide Validation & Normalization', () => {
  it('handles empty or whitespace inputs gracefully', () => {
    const res = validateAndCleanSequence('   \n  \t  ');
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('empty');
    expect(res.totalLength).toBe(0);
  });

  it('correctly parses FASTA headers starting with >', () => {
    const fasta = `>HBB_Homo_sapiens Beta Globin\nATGGTGCACCTGACTCCT\nGAGGAGAAGTCTGCCGTT`;
    const res = validateAndCleanSequence(fasta);
    expect(res.isValid).toBe(true);
    expect(res.fastaHeader).toBe('HBB_Homo_sapiens Beta Globin');
    expect(res.cleanedSequence).toBe('ATGGTGCACCTGACTCCTGAGGAGAAGTCTGCCGTT');
    expect(res.totalLength).toBe(36);
  });

  it('rejects invalid characters without silently altering or dropping them', () => {
    const invalidInput = 'ATGC123XYZ!@#';
    const res = validateAndCleanSequence(invalidInput);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('Invalid characters detected');
    // Ensure invalid characters are recorded
    const chars = res.invalidCharacters.map(c => c.char);
    expect(chars).toContain('1');
    expect(chars).toContain('2');
    expect(chars).toContain('3');
    expect(chars).toContain('!');
    expect(chars).toContain('@');
    expect(chars).toContain('#');
  });

  it('accepts valid IUPAC ambiguity codes', () => {
    const iupacSeq = 'ATGCRYWSKMBDHVN';
    const res = validateAndCleanSequence(iupacSeq);
    expect(res.isValid).toBe(true);
    expect(res.hasAmbiguous).toBe(true);
    expect(res.unambiguousLength).toBe(4); // A, T, G, C
    expect(res.ambiguousLength).toBe(11);
  });
});

describe('Nucleotide Counting & GC/AT Content', () => {
  it('accurately counts standard nucleotides and calculates standard GC% and AT%', () => {
    // 10 bases: 3 G, 2 C (GC = 5/10 = 50%), 3 A, 2 T (AT = 5/10 = 50%)
    const seq = 'GGGCCAAATT';
    const stats = calculateNucleotideStats(seq);

    expect(stats.totalLength).toBe(10);
    expect(stats.unambiguousLength).toBe(10);
    expect(stats.ambiguousLength).toBe(0);
    expect(stats.counts.G).toBe(3);
    expect(stats.counts.C).toBe(2);
    expect(stats.counts.A).toBe(3);
    expect(stats.counts.T).toBe(2);
    expect(stats.gcContent.standard).toBe(50.0);
    expect(stats.atContent.standard).toBe(50.0);
    expect(stats.gcContent.hasAmbiguityWarning).toBe(false);
  });

  it('handles ambiguous sequences correctly with range and unambiguous fraction', () => {
    // Sequence: GC + N + N (length 4: G=1, C=1, N=2)
    // Standard GC%: 2/4 = 50%
    // Unambiguous fraction: 2/2 = 100%
    // Min possible GC: 2/4 = 50% (if N=A/T)
    // Max possible GC: 4/4 = 100% (if N=G/C)
    const seq = 'GCNN';
    const stats = calculateNucleotideStats(seq);

    expect(stats.totalLength).toBe(4);
    expect(stats.unambiguousLength).toBe(2);
    expect(stats.ambiguousLength).toBe(2);
    expect(stats.counts.ambiguous['N']).toBe(2);
    expect(stats.gcContent.hasAmbiguityWarning).toBe(true);
    expect(stats.gcContent.standard).toBe(50.0);
    expect(stats.gcContent.unambiguousFraction).toBe(100.0);
    expect(stats.gcContent.minPossible).toBe(50.0);
    expect(stats.gcContent.maxPossible).toBe(100.0);
  });
});

describe('Sequence Transformations', () => {
  it('correctly complements standard and IUPAC bases', () => {
    // A <-> T, C <-> G, R <-> Y, S <-> S, W <-> W, K <-> M, B <-> V, D <-> H, N <-> N
    const seq = 'ATGC RYSW KM BDHV N';
    const cleaned = seq.replace(/\s/g, '');
    const comp = getComplementSequence(cleaned);
    expect(comp).toBe('TACG YRSw MK VHDB N'.replace(/\s/g, '').toUpperCase());
  });

  it('correctly reverses sequence', () => {
    expect(getReverseSequence('ATGCTA')).toBe('ATCGTA');
  });

  it('correctly generates reverse complement', () => {
    // 5'-ATGC-3' -> comp: TACG -> rev: GCAT
    expect(getReverseComplementSequence('ATGC')).toBe('GCAT');
    // Palindrome check: EcoRI recognition site GAATTC
    expect(getReverseComplementSequence('GAATTC')).toBe('GAATTC');
  });

  it('transcribes DNA to RNA replacing T with U', () => {
    expect(transcribeDnaToRna('ATGCTTA')).toBe('AUGCUUA');
  });

  it('calculates sliding window GC profile', () => {
    const seq = 'GCGCGCGCGCGCGCGCGCGCATATATATATATATATATAT'; // 20 GC followed by 20 AT (40 nt)
    const profile = calculateGCProfile(seq, 20, 10);
    expect(profile.length).toBeGreaterThan(0);
    expect(profile[0].gcPercent).toBe(100.0);
    expect(profile[profile.length - 1].gcPercent).toBe(0.0);
  });
});
