import React from 'react';

export const AboutView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl text-xs font-sans text-slate-800 leading-relaxed">
      {/* 1. Header */}
      <div className="border-b border-slate-300 pb-2">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Project Specifications & Methodology</h1>
        <p className="text-xs text-slate-600 mt-0.5">
          GeneLab — Technical specifications, mathematical formulas, algorithmic complexity, and academic references.
        </p>
      </div>

      {/* 2. System Overview */}
      <div className="border border-slate-300 bg-white p-4 space-y-2">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
          1. System Overview
        </h2>
        <p>
          GeneLab is a browser-based computational biology workbench designed for academic laboratory instruction and undergraduate research demonstrations. The platform executes all sequence transformations, statistics, translations, and dynamic programming alignments directly within the client browser engine via pure TypeScript. Zero sequence data is transmitted to external servers, ensuring strict privacy and instantaneous response times.
        </p>
      </div>

      {/* 3. Mathematical Formulas & Algorithmic Complexity Table */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
          2. Mathematical Formulas & Algorithmic Complexity
        </h2>

        <table className="table-dense">
          <thead>
            <tr>
              <th className="w-1/4">Computational Task</th>
              <th className="w-1/4">Algorithm / Method</th>
              <th className="w-1/4">Time Complexity</th>
              <th className="w-1/4">Mathematical Formula / Recurrence</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="font-bold">Base Counting & Ratios</td>
              <td>Single-pass iteration</td>
              <td className="font-mono">O(N)</td>
              <td className="font-mono text-[11px]">GC% = ((G + C) / N) × 100</td>
            </tr>
            <tr>
              <td className="font-bold">IUPAC Ambiguity Range</td>
              <td>Combinatorial bounds</td>
              <td className="font-mono">O(N)</td>
              <td className="font-mono text-[11px]">
                Min: (G+C)/N | Max: (G+C+Amb)/N
              </td>
            </tr>
            <tr>
              <td className="font-bold">Sliding-Window GC Profile</td>
              <td>Sliding window filter (w=30, s=5)</td>
              <td className="font-mono">O(N)</td>
              <td className="font-mono text-[11px]">GC_win% = ((G_win + C_win) / w) × 100</td>
            </tr>
            <tr>
              <td className="font-bold">Reverse Complement</td>
              <td>Watson-Crick antiparallel map</td>
              <td className="font-mono">O(N)</td>
              <td className="font-mono text-[11px]">revcomp(S) = reverse(complement(S))</td>
            </tr>
            <tr>
              <td className="font-bold">6-Frame Codon Translation</td>
              <td>NCBI Translation Table 1</td>
              <td className="font-mono">O(N)</td>
              <td className="font-mono text-[11px]">codon(i) = S[3i .. 3i+2] → AA</td>
            </tr>
            <tr>
              <td className="font-bold">Pairwise Global Alignment</td>
              <td>Needleman–Wunsch Dynamic Prog.</td>
              <td className="font-mono">O(N × M)</td>
              <td className="font-mono text-[11px]">
                M[i,j] = max(diag + s, up + d, left + d)
              </td>
            </tr>
            <tr>
              <td className="font-bold">Open Reading Frame Finder</td>
              <td>6-Frame State Machine Scan</td>
              <td className="font-mono">O(N)</td>
              <td className="font-mono text-[11px]">Scan(ATG → stop in TAA/TAG/TGA)</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. Verification and Test Suite */}
      <div className="border border-slate-300 bg-white p-4 space-y-2">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
          3. Verification & Automated Unit Testing Suite
        </h2>
        <p>
          All calculations are verified through an automated unit test suite executed by Vitest. The test suite includes 23 unit tests across 4 test suites:
        </p>
        <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-slate-700">
          <li><strong>nucleotide.test.ts (11 tests):</strong> Whitespace normalization, FASTA header parsing, strict non-IUPAC rejection, 11 IUPAC ambiguity codes, exact GC/AT calculations with boundary limits, complements, reverse complement, transcription, and sliding-window GC profile.</li>
          <li><strong>translation.test.ts (6 tests):</strong> Exhaustive coverage of all 64 standard codons, start/stop detection, conservative IUPAC resolution (CTN → L, AAY → N, GAN → X), forward offsets (+1, +2, +3), reverse-strand frames (-1, -2, -3), and trailing incomplete codon retention.</li>
          <li><strong>alignment.test.ts (4 tests):</strong> 100% identity match, single-nucleotide mismatches (SNPs), indel gap insertion, score calculation, and input boundary validation.</li>
          <li><strong>orf.test.ts (2 tests):</strong> Start/stop coordinate calculation and minimum codon length threshold filtering.</li>
        </ul>
      </div>

      {/* 5. Documented Scientific Limitations */}
      <div className="border border-slate-300 bg-white p-4 space-y-2">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
          4. Documented Scientific Limitations
        </h2>
        <ul className="list-disc pl-5 space-y-1 text-slate-700">
          <li><strong>Linear In Silico Processing:</strong> Operates on linear sequences without modeling eukaryotic pre-mRNA splicing (intron removal at GT-AG boundaries) or alternative isoform splicing.</li>
          <li><strong>No Post-Translational Modeling:</strong> Translations yield primary polypeptide sequences; secondary folding, disulfide bond formation, phosphorylation, and glycosylation are not computed.</li>
          <li><strong>Candidate ORFs vs. In Vivo Genes:</strong> Predicted open reading frames represent theoretical coding capability; biological gene expression requires active promoters, transcription factors, and ribosome binding.</li>
          <li><strong>Standard Genetic Code Only:</strong> Calculations employ NCBI Universal Genetic Code (Table 1); specialized mitochondrial (Table 2) or alternative non-standard codes are not implemented.</li>
          <li><strong>Client Memory Bounds:</strong> Needleman–Wunsch alignment dynamic programming table is bounded to sequences $\le 2,500$ nt to prevent browser thread locking.</li>
        </ul>
      </div>

      {/* 6. Academic References */}
      <div className="border border-slate-300 bg-white p-4 space-y-2">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
          5. Primary Literature References
        </h2>
        <ol className="list-decimal pl-5 space-y-1.5 font-mono text-[11px] text-slate-700">
          <li>
            Needleman, S. B., & Wunsch, C. D. (1970). A general method applicable to the search for similarities in the amino acid sequence of two proteins. <em>Journal of Molecular Biology</em>, 48(3), 443–453.
          </li>
          <li>
            Crick, F. H. (1966). Codon—anticodon pairing: the wobble hypothesis. <em>Journal of Molecular Biology</em>, 19(2), 548–555.
          </li>
          <li>
            Cornish-Bowden, A. (1985). Nomenclature for incompletely specified bases in nucleic acid sequences: recommendations 1984. <em>Nucleic Acids Research</em>, 13(9), 3021–3030.
          </li>
          <li>
            Pearson, W. R., & Lipman, D. J. (1988). Improved tools for biological sequence comparison. <em>Proceedings of the National Academy of Sciences</em>, 85(8), 2444–2448.
          </li>
          <li>
            NCBI Resource Coordinators (2023). Database resources of the National Center for Biotechnology Information. <em>Nucleic Acids Research</em>, 51(D1), D29–D38.
          </li>
        </ol>
      </div>
    </div>
  );
};
