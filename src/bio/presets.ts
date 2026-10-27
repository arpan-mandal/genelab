/**
 * GeneLab — Curated Educational Presets
 * Real, biologically verified DNA sequences for classroom demonstration.
 */

export interface PresetSequence {
  id: string;
  name: string;
  organism: string;
  description: string;
  biologicalSignificance: string;
  sequence: string;
  isAmbiguous?: boolean;
}

export interface AlignmentPreset {
  id: string;
  name: string;
  description: string;
  seq1Name: string;
  seq1: string;
  seq2Name: string;
  seq2: string;
  expectedOutcome: string;
}

export const PRESET_SEQUENCES: PresetSequence[] = [
  {
    id: 'hbb-normal',
    name: 'Human Beta-Globin (HBB) — Wild Type',
    organism: 'Homo sapiens',
    description: 'N-terminal coding region of the beta-globin subunit of adult hemoglobin (HbA).',
    biologicalSignificance: 'Codon 6 is GAG, encoding Glutamic acid (E). Wild-type hemoglobin remains soluble in deoxygenated blood.',
    sequence: 'ATGGTGCACCTGACTCCTGAGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAGGCTGCTGGTGGTCTACCCTTGGACCCAGAGGTTCTTTGAGTCCTTTGGGGATCTGTCCACTCCTGATGCTGTTATGGGCAACCCTAAGGTGAAGGCTCATGGCAAGAAAGTGCTCGGTGCCTTTAGTGATGGCCTGGCTCACCTGGACAACCTCAAGGGCACCTTTGCCACACTGAGTGAGCTGCACTGTGACAAGCTGCACGTGGATCCTGAGAACTTCAGGCTCCTGGGCAACGTGCTGGTCTGTGTGCTGGCCCATCACTTTGGCAAAGAATTCACCCCACCAGTGCAGGCTGCCTATCAGAAAGTGGTGGCTGGTGTGGCTAATGCCCTGGCCCACAAGTATCACTAA',
  },
  {
    id: 'hbb-sickle',
    name: 'Human Beta-Globin (HBB) — Sickle Cell (HbS)',
    organism: 'Homo sapiens',
    description: 'Pathogenic mutant of beta-globin causing sickle cell anemia (recessive autosomal disease).',
    biologicalSignificance: 'Single point mutation (A -> T transversion) at codon 6 changes GAG (Glutamate) to GTG (Valine). Hydrophobic valine causes hemoglobin polymerization under low oxygen.',
    sequence: 'ATGGTGCACCTGACTCCTGTGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAGGCTGCTGGTGGTCTACCCTTGGACCCAGAGGTTCTTTGAGTCCTTTGGGGATCTGTCCACTCCTGATGCTGTTATGGGCAACCCTAAGGTGAAGGCTCATGGCAAGAAAGTGCTCGGTGCCTTTAGTGATGGCCTGGCTCACCTGGACAACCTCAAGGGCACCTTTGCCACACTGAGTGAGCTGCACTGTGACAAGCTGCACGTGGATCCTGAGAACTTCAGGCTCCTGGGCAACGTGCTGGTCTGTGTGCTGGCCCATCACTTTGGCAAAGAATTCACCCCACCAGTGCAGGCTGCCTATCAGAAAGTGGTGGCTGGTGTGGCTAATGCCCTGGCCCACAAGTATCACTAA',
  },
  {
    id: 'gfp-chromophore',
    name: 'Green Fluorescent Protein (GFP) Excerpt',
    organism: 'Aequorea victoria (Jellyfish)',
    description: 'Coding sequence containing the famous Ser65-Tyr66-Gly67 fluorophore triad of GFP.',
    biologicalSignificance: 'Spontaneous cyclization and oxidation of the SYG tripeptide generates the 4-(p-hydroxybenzylidene)imidazolidin-5-one chromophore, revolutionizing live-cell molecular imaging.',
    sequence: 'ATGAGTAAAGGAGAAGAACTTTTCACTGGAGTTGTCCCAATTCTTGTTGAATTAGATGGTGATGTTAATGGGCACAAATTTTCTGTCAGTGGAGAGGGTGAAGGTGATGCAACATACGGAAAACTTACCCTTAAATTTATTTGCACTACTGGAAAACTACCTGTTCCATGGCCAACACTTGTCACTACTTTCTCTTATGGTGTTCAATGCTTTTCAAGATACCCAGATCATATGAAACGGCATGACTTTTTCAAGAGTGCCATGCCCGAAGGTTATGTACAGGAAAGAACTATATTTTTCAAAGATGACGGGAACTACAAGACACGTGCTGAAGTCAAGTTTGAAGGTGATACCCTTGTTAATAGAATCGAGTTAAAAGGTATTGATTTTAAAGAAGATGGAAACATTCTTGGACACAAATTGGAATACAACTATAACTCACACAATGTATACATCATGGCAGACAAACAAAAGAATGGAATCAAAGTTAACTTCAAAATTAGACACAACATTGAAGATGGAAGCGTTCAACTAGCAGACCATTATCAACAAAATACTCCAATTGGCGATGGCCCTGTCCTTTTACCAGACAACCATTACCTGTCCACACAATCTGCCCTTTCGAAAGATCCCAACGAAAAGAGAGACCACATGGTCCTTCTTGAGTTTGTAACAGCTGCTGGGATTACACATGGCATGGATGAACTATACAAATAA',
  },
  {
    id: 'insulin-exerpt',
    name: 'Human Preproinsulin (INS) Partial Sequence',
    organism: 'Homo sapiens',
    description: 'Signal peptide and B-chain coding region of the insulin hormone precursor.',
    biologicalSignificance: 'Produced in pancreatic beta-cell islets. Cleavage of the signal peptide and C-peptide produces active dimeric insulin linked by disulfide bonds.',
    sequence: 'ATGGCCCTGTGGATGCGCCTCCTGCCCCTGCTGGCGCTGCTGGCCCTCTGGGGACCTGACCCAGCCGCAGCCTTTGTGAACCAACACCTGTGCGGCTCACACCTGGTGGAAGCTCTCTACCTAGTGTGCGGGGAACGAGGCTTCTTCTACACACCCAAGACCCGCCGGGAGGCAGAGGACCTGCAGGGTGAGTCCAACTAA',
  },
  {
    id: 'iupac-consensus',
    name: 'Degenerate Consensus Binding Site (IUPAC)',
    organism: 'Synthetic / Consensus Motif',
    description: 'Contains degenerate IUPAC ambiguity codes (R, Y, S, W, K, M, N) commonly found in PCR primer cocktails and transcription factor consensus sequences.',
    biologicalSignificance: 'Demonstrates handling of uncertain base calls, degenerate primers, and ambiguity-aware GC calculation ranges.',
    isAmbiguous: true,
    sequence: 'ATGRYSCATGWKMNBBDHVNATGCGTAGCTAGCTAGCRYSWATGCATGCATNATG',
  },
  {
    id: 'short-demo',
    name: 'Classroom Quick-Start DNA Sequence (60 nt)',
    organism: 'Model Sequence',
    description: 'Compact 60-nucleotide sequence with clear codon boundaries, start codon ATG, and stop codon TAA.',
    biologicalSignificance: 'Ideal for inspecting frame-shifts, translation tables, and nucleotide frequencies without scrolling.',
    sequence: 'ATGGCCTTTGCTAACGGCTACCGTGGTCCAGCTGACATCGGTGAAGCTTTCAAACGTTAA',
  },
];

export const ALIGNMENT_PRESETS: AlignmentPreset[] = [
  {
    id: 'hbb-snp',
    name: 'Sickle Cell Anemia: Normal vs HbS (Single Nucleotide Variant)',
    description: 'Comparison of normal Beta-Globin vs Sickle Cell mutant across codon 6.',
    seq1Name: 'HBB Normal (HbA)',
    seq1: 'ATGGTGCACCTGACTCCTGAGGAGAAGTCTGCCGTTACTGCC',
    seq2Name: 'HBB Sickle (HbS)',
    seq2: 'ATGGTGCACCTGACTCCTGTGGAGAAGTCTGCCGTTACTGCC',
    expectedOutcome: 'Exact 1-nucleotide transversion mismatch (A -> T) at nucleotide position 20, leading to Glu6Val amino acid substitution.',
  },
  {
    id: 'frameshift-indel',
    name: 'Frameshift Mutation: 1-Base Insertion & Deletion',
    description: 'Comparison showing how an insertion creates a gap in the reference sequence and disrupts reading frames.',
    seq1Name: 'Wild-Type Sequence',
    seq1: 'ATGGCCTTTGCTAACGGCTACCGTGGTCCAGCTGACATC',
    seq2Name: 'Frameshift Mutant (+A ins, -C del)',
    seq2: 'ATGGCCATTTGCTAACGGCTACCGTGGTCCAGTGACATC',
    expectedOutcome: 'Needleman-Wunsch inserts a gap in Seq1 to align with the inserted "A", and a gap in Seq2 to align with the deleted "C".',
  },
  {
    id: 'evolutionary-divergence',
    name: 'Homologous Sequence Divergence with Indels',
    description: 'Simulates moderate evolutionary drift with multiple matches, transitions, transversions, and gaps.',
    seq1Name: 'Species A Ortholog',
    seq1: 'ATGAAGCTGTGGCTGCTGGCCGCGGCGCTGCTGCTGGGCACCGTGGCGGCC',
    seq2Name: 'Species B Ortholog',
    seq2: 'ATGAAGCTTTGGCTGCTG---GCGGCGCTGCTGTTGGGCACGGTGACGGCC',
    expectedOutcome: 'High identity (~88%) with conservative transitions and a 3-nucleotide (single codon) gap indel.',
  },
];
