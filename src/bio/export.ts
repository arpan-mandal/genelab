/**
 * GeneLab — Report Generation & Data Export
 * Generates formatted Plain-Text analysis reports, structured JSON,
 * and vector PDF documents (via jsPDF) for academic coursework submissions.
 */

import { jsPDF } from 'jspdf';
import {
  AlignmentResult,
  NucleotideStats,
  ReadingFrameResult,
  SequenceTransformations,
} from './types';

export interface ReportData {
  title?: string;
  sequenceName?: string;
  rawSequence: string;
  stats: NucleotideStats;
  transformations?: SequenceTransformations;
  selectedFrame?: ReadingFrameResult;
  alignment?: {
    seq1Name: string;
    seq2Name: string;
    result: AlignmentResult;
  };
}

/**
 * Generates an academic plain-text (.txt) bioinformatics report.
 */
export function generatePlainTextReport(data: ReportData): string {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  const divider = '='.repeat(78);
  const subDivider = '-'.repeat(78);

  let text = `${divider}\n`;
  text += `GENELAB — DNA SEQUENCE ANALYSIS LABORATORY REPORT\n`;
  text += `Platform: GeneLab Academic Bioinformatics Workbench (v1.0)\n`;
  text += `Generated: ${timestamp}\n`;
  text += `${divider}\n\n`;

  // 1. Sequence Overview
  text += `1. SEQUENCE OVERVIEW\n`;
  text += `${subDivider}\n`;
  text += `Sequence Identifier: ${data.sequenceName || 'User Input'}\n`;
  text += `Total Length:        ${data.stats.totalLength} nucleotides (nt)\n`;
  text += `Standard Bases:      ${data.stats.unambiguousLength} nt (${data.stats.totalLength > 0 ? ((data.stats.unambiguousLength / data.stats.totalLength) * 100).toFixed(1) : 0}%)\n`;
  text += `Ambiguous IUPAC:     ${data.stats.ambiguousLength} nt (${data.stats.percentages.ambiguous}%)\n`;
  text += `Estimated Mol Wt:    ~${data.stats.molecularWeightEstimatedDa.toLocaleString()} Daltons (ssDNA)\n\n`;

  // 2. Base Composition & Content
  text += `2. NUCLEOTIDE COMPOSITION & FREQUENCY\n`;
  text += `${subDivider}\n`;
  text += `  Adenine  (A):  ${data.stats.counts.A.toString().padStart(6)} (${data.stats.percentages.A}%)\n`;
  text += `  Thymine  (T):  ${data.stats.counts.T.toString().padStart(6)} (${data.stats.percentages.T}%)\n`;
  text += `  Guanine  (G):  ${data.stats.counts.G.toString().padStart(6)} (${data.stats.percentages.G}%)\n`;
  text += `  Cytosine (C):  ${data.stats.counts.C.toString().padStart(6)} (${data.stats.percentages.C}%)\n`;
  if (data.stats.counts.U > 0) {
    text += `  Uracil   (U):  ${data.stats.counts.U.toString().padStart(6)} (${data.stats.percentages.U}%)\n`;
  }
  if (data.stats.ambiguousLength > 0) {
    text += `  Ambiguous IUPAC Codes: ${JSON.stringify(data.stats.counts.ambiguous)}\n`;
  }
  text += `\n`;
  text += `  GC Content (Standard):      ${data.stats.gcContent.standard}%\n`;
  if (data.stats.gcContent.hasAmbiguityWarning) {
    text += `  GC Content (Unambiguous):   ${data.stats.gcContent.unambiguousFraction}%\n`;
    text += `  GC Content Range:           ${data.stats.gcContent.minPossible}% – ${data.stats.gcContent.maxPossible}%\n`;
    text += `  GC Content Note:            ${data.stats.gcContent.note}\n`;
  }
  text += `  AT Content:                 ${data.stats.atContent.standard}%\n\n`;

  // 3. Transformations
  if (data.transformations) {
    text += `3. SEQUENCE TRANSFORMATIONS\n`;
    text += `${subDivider}\n`;
    text += `Primary (5'->3'):\n${wrapSequence(data.transformations.original, 70)}\n\n`;
    text += `Complementary Strand (3'->5'):\n${wrapSequence(data.transformations.complement, 70)}\n\n`;
    text += `Reverse-Complement (5'->3'):\n${wrapSequence(data.transformations.reverseComplement, 70)}\n\n`;
    text += `Transcribed mRNA (5'->3'):\n${wrapSequence(data.transformations.transcribedRNA, 70)}\n\n`;
  }

  // 4. Reading Frame Translation
  if (data.selectedFrame) {
    text += `4. TRANSLATION & READING FRAME (${data.selectedFrame.frameId})\n`;
    text += `${subDivider}\n`;
    text += `Frame:              ${data.selectedFrame.frameId} (${data.selectedFrame.strand} strand, offset ${data.selectedFrame.offset})\n`;
    text += `Total Codons:       ${data.selectedFrame.totalCodons}\n`;
    text += `Start Codons (ATG): ${data.selectedFrame.startCodonCount}\n`;
    text += `Stop Codons (*):    ${data.selectedFrame.stopCodonCount}\n`;
    if (data.selectedFrame.hasIncompleteCodon) {
      text += `Trailing Nucleotides: ${data.selectedFrame.trailingBases} (incomplete codon)\n`;
    }
    text += `\nAmino Acid Sequence (One-Letter Code):\n`;
    text += `${wrapSequence(data.selectedFrame.aminoAcidSequenceOne, 60)}\n\n`;
  }

  // 5. Sequence Alignment
  if (data.alignment) {
    const aln = data.alignment.result;
    text += `5. PAIRWISE GLOBAL ALIGNMENT (NEEDLEMAN-WUNSCH)\n`;
    text += `${subDivider}\n`;
    text += `Seq 1:              ${data.alignment.seq1Name}\n`;
    text += `Seq 2:              ${data.alignment.seq2Name}\n`;
    text += `Alignment Length:   ${aln.alignmentLength} columns\n`;
    text += `Alignment Score:    ${aln.score}\n`;
    text += `Percentage Identity:${aln.identityPercentage}% (${aln.matches} / ${aln.alignmentLength} columns)\n`;
    text += `Sequence Matches:   ${aln.matches}\n`;
    text += `Mismatches:         ${aln.mismatches}\n`;
    text += `Gaps Inserted:      ${aln.gaps} (Seq1: ${aln.seq1Gaps}, Seq2: ${aln.seq2Gaps})\n\n`;
    text += `Alignment Visualization:\n`;
    text += formatAlignmentBlockText(aln.seq1Aligned, aln.matchLine, aln.seq2Aligned, 60);
    text += `\n`;
  }

  // 6. Methodology & Limitations
  text += `6. METHODOLOGY & SCIENTIFIC DISCLAIMER\n`;
  text += `${subDivider}\n`;
  text += `Calculations run entirely client-side using pure TypeScript in the browser.\n`;
  text += `Codon translation employs NCBI Standard Genetic Code (Table 1).\n`;
  text += `Ambiguous codons are resolved conservatively; unresolved codons yield 'X'.\n`;
  text += `Global alignment applies the Needleman-Wunsch dynamic programming algorithm.\n`;
  text += `DISCLAIMER: GeneLab is an educational and exploratory bioinformatics workbench.\n`;
  text += `Results do not establish clinical diagnosis, pathogenicity, or experimental gene\n`;
  text += `function. In vivo expression requires biological validation.\n`;
  text += `${divider}\n`;

  return text;
}

/**
 * Downloads generated string data as a file.
 */
export function triggerFileDownload(content: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a clean, publication-ready PDF report using jsPDF.
 */
export function exportPDFReport(data: ReportData, filename = 'GeneLab_Analysis_Report.pdf') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 16;
  const usableWidth = pageWidth - (margin * 2);
  let y = margin;

  // Helper for adding new page if y exceeds printable area
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawHeaderFooter();
    }
  };

  const drawHeaderFooter = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 150, 160);
    doc.text('GeneLab — Academic Bioinformatics Workbench', margin, 10);
    doc.text(new Date().toLocaleDateString(), pageWidth - margin, 10, { align: 'right' });
    doc.setDrawColor(220, 225, 230);
    doc.line(margin, 12, pageWidth - margin, 12);
  };

  drawHeaderFooter();
  y = 22;

  // Title block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // navy slate
  doc.text('DNA Sequence Analysis Report', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(13, 148, 136); // teal
  doc.text('GENELAB BIOINFORMATICS PLATFORM', margin, y);
  y += 8;

  // Metadata box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, usableWidth, 20, 2, 2, 'FD');
  y += 5;

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Identifier: ${data.sequenceName || 'User Provided Sequence'}`, margin + 4, y);
  doc.text(`Length: ${data.stats.totalLength} nt`, margin + 90, y);
  y += 5;
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin + 4, y);
  doc.text(`Unambiguous: ${data.stats.unambiguousLength} nt | Ambiguous: ${data.stats.ambiguousLength} nt`, margin + 90, y);
  y += 5;
  doc.text(`Est. Molecular Wt: ~${data.stats.molecularWeightEstimatedDa.toLocaleString()} Da`, margin + 4, y);
  y += 9;

  // Section 1: Nucleotide Composition
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Nucleotide Composition & Statistics', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  const colW = usableWidth / 4;
  doc.text(`Adenine (A): ${data.stats.counts.A} (${data.stats.percentages.A}%)`, margin, y);
  doc.text(`Thymine (T): ${data.stats.counts.T} (${data.stats.percentages.T}%)`, margin + colW, y);
  doc.text(`Guanine (G): ${data.stats.counts.G} (${data.stats.percentages.G}%)`, margin + colW * 2, y);
  doc.text(`Cytosine (C): ${data.stats.counts.C} (${data.stats.percentages.C}%)`, margin + colW * 3, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.text(`GC Content: ${data.stats.gcContent.standard}%`, margin, y);
  doc.text(`AT Content: ${data.stats.atContent.standard}%`, margin + colW * 2, y);
  y += 5;

  if (data.stats.gcContent.hasAmbiguityWarning) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(180, 83, 9);
    doc.text(`Note: ${data.stats.gcContent.note}`, margin, y, { maxWidth: usableWidth });
    y += 7;
  } else {
    y += 2;
  }

  // Section 2: Transformations
  if (data.transformations) {
    checkPageBreak(40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('2. Sequence Transformations', margin, y);
    y += 6;

    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    const truncateForPDF = (s: string, max = 150) => s.length > max ? s.substring(0, max) + '... [truncated]' : s;

    doc.setFont('helvetica', 'bold');
    doc.text("Reverse-Complement (5' -> 3'):", margin, y);
    y += 4;
    doc.setFont('courier', 'normal');
    doc.text(truncateForPDF(data.transformations.reverseComplement), margin, y, { maxWidth: usableWidth });
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.text("Transcribed mRNA (5' -> 3'):", margin, y);
    y += 4;
    doc.setFont('courier', 'normal');
    doc.text(truncateForPDF(data.transformations.transcribedRNA), margin, y, { maxWidth: usableWidth });
    y += 9;
  }

  // Section 3: Reading Frame Translation
  if (data.selectedFrame) {
    checkPageBreak(45);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`3. Translation & Reading Frame (${data.selectedFrame.frameId})`, margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(`Strand: ${data.selectedFrame.strand} | Codons: ${data.selectedFrame.totalCodons} | Start Codons: ${data.selectedFrame.startCodonCount} | Stop Codons: ${data.selectedFrame.stopCodonCount}`, margin, y);
    y += 6;

    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    const aaTrunc = data.selectedFrame.aminoAcidSequenceOne.length > 200
      ? data.selectedFrame.aminoAcidSequenceOne.substring(0, 200) + '... [truncated]'
      : data.selectedFrame.aminoAcidSequenceOne;
    doc.text(aaTrunc, margin, y, { maxWidth: usableWidth });
    y += 12;
  }

  // Section 4: Alignment if present
  if (data.alignment) {
    const aln = data.alignment.result;
    checkPageBreak(45);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('4. Pairwise Alignment Results', margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(`Identity: ${aln.identityPercentage}% | Matches: ${aln.matches} | Mismatches: ${aln.mismatches} | Gaps: ${aln.gaps}`, margin, y);
    y += 6;
  }

  // Disclaimer footer block
  checkPageBreak(25);
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Academic Disclaimer: GeneLab is designed for educational instruction and computational exploration. ' +
    'Predictions do not establish in vivo protein expression, gene function, or clinical pathogenicity.',
    margin,
    y,
    { maxWidth: usableWidth }
  );

  doc.save(filename);
}

/**
 * Wraps a sequence into fixed-width lines.
 */
function wrapSequence(seq: string, lineLen: number): string {
  const lines: string[] = [];
  for (let i = 0; i < seq.length; i += lineLen) {
    lines.push(seq.substring(i, i + lineLen));
  }
  return lines.join('\n');
}

/**
 * Formats Needleman-Wunsch alignment lines with coordinate numbering for text reports.
 */
function formatAlignmentBlockText(s1: string, match: string, s2: string, blockSize = 60): string {
  const lines: string[] = [];
  const len = s1.length;
  let pos1 = 1;
  let pos2 = 1;

  for (let i = 0; i < len; i += blockSize) {
    const sub1 = s1.substring(i, i + blockSize);
    const subMatch = match.substring(i, i + blockSize);
    const sub2 = s2.substring(i, i + blockSize);

    const nonGaps1 = sub1.replace(/-/g, '').length;
    const nonGaps2 = sub2.replace(/-/g, '').length;

    lines.push(`Seq1  ${pos1.toString().padStart(6)}  ${sub1}  ${(pos1 + nonGaps1 - 1).toString().padStart(6)}`);
    lines.push(`                  ${subMatch}`);
    lines.push(`Seq2  ${pos2.toString().padStart(6)}  ${sub2}  ${(pos2 + nonGaps2 - 1).toString().padStart(6)}`);
    lines.push('');

    pos1 += nonGaps1;
    pos2 += nonGaps2;
  }

  return lines.join('\n');
}
