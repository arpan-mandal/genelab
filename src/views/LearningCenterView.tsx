import React, { useState } from 'react';
import { NavTabId } from '../components/ToolNavigation';
import { PRESET_SEQUENCES, PresetSequence } from '../bio/presets';

interface LearningCenterViewProps {
  onNavigate: (tab: NavTabId) => void;
  onLoadPreset: (preset: PresetSequence) => void;
}

interface LearningTopic {
  id: string;
  category: string;
  title: string;
  simpleDefinition: string;
  technicalExplanation: string;
  example: string;
  targetTool: NavTabId;
  toolActionLabel: string;
  presetId?: string;
}

export const LearningCenterView: React.FC<LearningCenterViewProps> = ({
  onNavigate,
  onLoadPreset,
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>('bioinformatics');

  const topics: LearningTopic[] = [
    {
      id: 'bioinformatics',
      category: '1. Fundamentals',
      title: 'What is Bioinformatics?',
      simpleDefinition: 'The scientific discipline combining computer science, statistics, and molecular biology to store, process, and analyze genetic information.',
      technicalExplanation: 'Bioinformatics develops algorithms (dynamic programming, Hidden Markov Models, suffix trees, de Bruijn graphs) to interpret high-throughput sequencing data, model macromolecular structures, annotate genomic features, and infer evolutionary relationships.',
      example: 'Example: Comparing a patient\'s sequence against the human reference genome to identify disease-associated variants.',
      targetTool: 'analyzer',
      toolActionLabel: 'Open Sequence Analyzer',
    },
    {
      id: 'dna-rna-proteins',
      category: '1. Fundamentals',
      title: 'DNA, RNA, and Proteins',
      simpleDefinition: 'The three core biological polymers described by the Central Dogma of Molecular Biology.',
      technicalExplanation: 'DNA (2\'-deoxyribonucleic acid) stores genetic blueprints. RNA (ribonucleic acid) acts as an informational intermediary (mRNA) and catalytic molecule (rRNA, ribozymes). Proteins (polypeptides composed of 20 standard L-alpha-amino acids) carry out enzymatic catalysis, structural scaffolding, and signal transduction.',
      example: 'DNA (Double Helix) → mRNA Transcript (Single Strand) → Protein (e.g. Hemoglobin tetramer carrying oxygen).',
      targetTool: 'analyzer',
      toolActionLabel: 'Load Beta-Globin in Analyzer',
      presetId: 'hbb-normal',
    },
    {
      id: 'nucleotides-base-pairing',
      category: '1. Fundamentals',
      title: 'Nucleotides and Base Pairing Rules',
      simpleDefinition: 'The fundamental chemical letters that assemble nucleic acid chains.',
      technicalExplanation: 'Nucleotides consist of a nitrogenous base, a pentose sugar (deoxyribose or ribose), and a 5\'-phosphate. Purines (A, G) feature bicyclic rings; pyrimidines (T, C, U) feature monocyclic rings. Watson-Crick base pairing specifies Adenine pairs with Thymine (2 hydrogen bonds: A=T) and Guanine pairs with Cytosine (3 hydrogen bonds: G≡C).',
      example: '5\'-A-T-G-C-3\' pairs strictly with 3\'-T-A-C-G-5\'.',
      targetTool: 'analyzer',
      toolActionLabel: 'Inspect Base Counts in Analyzer',
      presetId: 'short-demo',
    },
    {
      id: 'complementary-strands',
      category: '2. Sequences & Ratios',
      title: 'Complementary & Reverse-Complement Strands',
      simpleDefinition: 'The matching opposing strand of DNA running in the reverse antiparallel direction.',
      technicalExplanation: 'Due to stereochemical polarity, the two strands of the DNA double helix are antiparallel (one runs 5\'→3\', the opposing strand runs 3\'→5\'). Standard bioinformatics convention always records and writes sequences in the 5\'→3\' orientation. Therefore, the reverse complement is produced by taking the Watson-Crick complement and reversing its orientation.',
      example: 'Original: 5\'-ATG GCC-3\' → Complement: 3\'-TAC CGG-5\' → Reverse Complement: 5\'-GGC CAT-3\'.',
      targetTool: 'analyzer',
      toolActionLabel: 'Test Reverse Complement in Analyzer',
      presetId: 'hbb-normal',
    },
    {
      id: 'gc-content',
      category: '2. Sequences & Ratios',
      title: 'GC Content and Biological Significance',
      simpleDefinition: 'The proportion of Guanine and Cytosine bases in a DNA sequence, expressed as a percentage.',
      technicalExplanation: 'GC content = ((G + C) / total sequence length) × 100. Because G≡C pairs share 3 hydrogen bonds and favorable pi-stacking thermodynamics compared to 2 bonds in A=T pairs, higher GC content significantly elevates the thermal melting temperature (Tm) of double-stranded DNA. In eukaryotic genomes, clusters of CpG dinucleotides (CpG islands) demarcate promoter regions.',
      example: 'Thermophilic archaea living at 80°C frequently exhibit >65% GC content to prevent genomic thermal denaturation.',
      targetTool: 'analyzer',
      toolActionLabel: 'View GC Profile in Analyzer',
      presetId: 'hbb-normal',
    },
    {
      id: 'transcription-translation',
      category: '3. Central Dogma',
      title: 'Transcription and Translation',
      simpleDefinition: 'The two-step biological mechanism transforming genomic DNA instructions into functional proteins.',
      technicalExplanation: 'Transcription: RNA Polymerase reads the non-coding template strand to synthesize pre-mRNA matching the 5\'→3\' coding strand, substituting Uracil (U) for Thymine (T). Translation: In the ribosome, tRNAs bearing anticodons align with mRNA codons, forming peptide bonds between amino acids to synthesize polypeptide chains.',
      example: 'DNA: 5\'-ATG-3\' → mRNA: 5\'-AUG-3\' → tRNA anticodon: 3\'-UAC-5\' → Amino Acid: Methionine (Met/M).',
      targetTool: 'translation',
      toolActionLabel: 'Open Translation Workbench',
      presetId: 'short-demo',
    },
    {
      id: 'codons-genetic-code',
      category: '3. Central Dogma',
      title: 'Codons and the Genetic Code',
      simpleDefinition: 'The triplet code of 64 three-letter words mapping to 20 amino acids and stop signals.',
      technicalExplanation: 'Because 4 bases taken in pairs (4² = 16) could not encode 20 amino acids, life evolved a triplet system (4³ = 64 combinations). The genetic code is universal across almost all taxa, non-overlapping, comma-less, and degenerate (multiple synonymous codons encode the same amino acid, explained by Crick\'s 1966 Wobble Hypothesis).',
      example: 'Leucine is encoded by 6 different codons: TTA, TTG, CTT, CTC, CTA, CTG.',
      targetTool: 'translation',
      toolActionLabel: 'Explore Codon Table',
      presetId: 'hbb-normal',
    },
    {
      id: 'reading-frames',
      category: '3. Central Dogma',
      title: 'Reading Frames and Frameshifts',
      simpleDefinition: 'The three possible starting positions in a nucleotide sequence, yielding three frames per strand (six total).',
      technicalExplanation: 'Because codons consist of 3 bases, translation can initiate at offset 0 (Frame +1), offset 1 (Frame +2), or offset 2 (Frame +3). Along the reverse-complement strand, three additional frames (-1, -2, -3) exist. An insertion or deletion (indel) of a non-multiple of 3 bases causes a catastrophic frameshift mutation, corrupting all downstream codons.',
      example: 'Shifting "ATG GCC TTT" by 1 nt produces "TGG CCT TT...", entirely altering the translated peptide sequence.',
      targetTool: 'translation',
      toolActionLabel: 'View 6 Reading Frames',
      presetId: 'short-demo',
    },
    {
      id: 'mutations-variations',
      category: '4. Alignment & Evolution',
      title: 'Mutations and Sequence Differences',
      simpleDefinition: 'Permanent alterations in genomic nucleotide sequences arising from replication errors or mutagenic damage.',
      technicalExplanation: 'Mutations are classified by chemical type: Transitions (purine↔purine A↔G or pyrimidine↔pyrimidine C↔T) occur more frequently than Transversions (purine↔pyrimidine). Functional consequences include Synonymous/Silent mutations (no amino acid change), Missense mutations (amino acid substitution), Nonsense mutations (premature stop codon), and Indels.',
      example: 'Sickle Cell Anemia: A single transversion mutation at codon 6 of HBB (GAG → GTG) replaces Glutamate with Valine.',
      targetTool: 'comparison',
      toolActionLabel: 'Align Normal vs Sickle Cell',
    },
    {
      id: 'fasta-format',
      category: '1. Fundamentals',
      title: 'FASTA Format and Conventions',
      simpleDefinition: 'The standard plain-text format for representing biological sequences in computational biology.',
      technicalExplanation: 'Originating from the FASTA software package (Pearson & Lipman, 1988), FASTA files begin with a single header line prefixed by ">" containing the sequence identifier and description, followed by one or more lines of single-letter sequence codes. Whitespace and numbers are excluded from the sequence body.',
      example: '>sp|P68871|HBB_HUMAN Hemoglobin subunit beta\nATGGTGCACCTGACTCCTGAGGAGAAGTCTGCCGTTACTGCC...',
      targetTool: 'analyzer',
      toolActionLabel: 'Open FASTA in Analyzer',
      presetId: 'hbb-normal',
    },
    {
      id: 'sequence-alignment',
      category: '4. Alignment & Evolution',
      title: 'Sequence Alignment and Percentage Identity',
      simpleDefinition: 'Arranging two or more biological sequences to identify regions of similarity and evolutionary homology.',
      technicalExplanation: 'Global alignment (Needleman-Wunsch, 1970) optimizes the total match score across the entire length of both sequences using dynamic programming recursion: M[i,j] = max(diagonal + score, up + gap, left + gap). Percentage identity is strictly computed as (Identical Aligned Positions / Total Alignment Columns) × 100.',
      example: 'Aligning 100 nt with 90 matches and 10 gap columns yields (90 / 110) = 81.8% global identity.',
      targetTool: 'comparison',
      toolActionLabel: 'Open Sequence Alignment Tool',
    },
    {
      id: 'iupac-ambiguity',
      category: '2. Sequences & Ratios',
      title: 'IUPAC Ambiguity Codes',
      simpleDefinition: 'Standard single-letter codes representing uncertainty or variation at specific nucleotide positions.',
      technicalExplanation: 'Formulated by the International Union of Pure and Applied Chemistry (IUPAC): R = Purine (A/G), Y = Pyrimidine (C/T), S = Strong (G/C), W = Weak (A/T), K = Keto (G/T), M = Amino (A/C), B = not A, D = not C, H = not G, V = not T, N = any base. In bioinformatics, algorithms must handle ambiguity without guessing unique bases.',
      example: 'A degenerate PCR primer sequence like "ATGRYSC" accommodates 8 distinct physical oligonucleotide variants.',
      targetTool: 'analyzer',
      toolActionLabel: 'Load IUPAC Sample Sequence',
      presetId: 'iupac-consensus',
    },
    {
      id: 'open-reading-frames',
      category: '3. Central Dogma',
      title: 'Open Reading Frames (ORFs)',
      simpleDefinition: 'Spans of nucleotide triplets uninterrupted by stop codons, capable of encoding proteins.',
      technicalExplanation: 'An ORF starts with an initiation codon (typically ATG) and terminates at an in-frame stop codon (TAA, TAG, TGA). Long ORFs (e.g., >30-100 codons) represent candidate protein-coding genes. In prokaryotes, ORFs closely reflect mature mRNA; in eukaryotes, intervening introns interrupt genomic ORFs.',
      example: 'Predicting candidate bacterial genes by locating all ORFs >100 amino acids.',
      targetTool: 'orf',
      toolActionLabel: 'Open ORF Finder',
      presetId: 'hbb-normal',
    },
    {
      id: 'computational-limits',
      category: '5. Methodology & Limits',
      title: 'Limitations of Computational Sequence Analysis',
      simpleDefinition: 'Why in silico predictions require experimental laboratory validation before establishing biological reality.',
      technicalExplanation: 'Computer algorithms predict theoretical possibilities, not confirmed biological facts. An in silico ORF may lack an active promoter, fail transcription initiation, or undergo immediate nonsense-mediated mRNA decay. Epigenetics, chromatin compaction, alternative splicing, post-translational modifications, and cellular microenvironments cannot be inferred solely from raw linear primary sequences.',
      example: 'A predicted computer translation cannot guarantee protein solubility, folding into native 3D conformation, or enzymatic kinetics.',
      targetTool: 'about',
      toolActionLabel: 'Read Scientific Limitations',
    },
  ];

  const currentTopic = topics.find((t) => t.id === selectedTopicId) || topics[0];

  const handleActionClick = (topic: LearningTopic) => {
    if (topic.presetId) {
      const p = PRESET_SEQUENCES.find((s) => s.id === topic.presetId);
      if (p) onLoadPreset(p);
    }
    onNavigate(topic.targetTool);
  };

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Header */}
      <div className="border-b border-slate-300 pb-2">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bioinformatics Reference Manual</h1>
        <p className="text-xs text-slate-600 mt-0.5">
          14 core molecular biology and computational genomics topics with formal definitions, biochemical context, and examples.
        </p>
      </div>

      {/* Split Pane: Topic List (left) + Topic Reader (right) */}
      <div className="border border-slate-300 bg-white grid grid-cols-1 md:grid-cols-3 min-h-[480px]">
        {/* Left Column: Topics Directory */}
        <div className="border-r border-slate-300 bg-slate-50 overflow-y-auto max-h-[560px] text-xs">
          <div className="bg-slate-200 border-b border-slate-300 px-3 py-1.5 font-bold text-slate-800 text-[11px] uppercase tracking-wider">
            Index of Topics ({topics.length})
          </div>

          <div className="divide-y divide-slate-200">
            {topics.map((t, idx) => {
              const isSelected = selectedTopicId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTopicId(t.id)}
                  className={`w-full text-left p-2.5 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-slate-300 font-semibold text-slate-900 border-l-4 border-l-slate-800'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="text-[10px] text-slate-500 font-mono mb-0.5">{t.category}</div>
                  <div className="text-xs leading-snug">{idx + 1}. {t.title}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Documentation Content */}
        <div className="md:col-span-2 p-5 space-y-4 overflow-y-auto max-h-[560px] text-xs text-slate-800 font-sans leading-relaxed">
          <div className="border-b border-slate-200 pb-2 flex justify-between items-start">
            <div>
              <span className="text-[11px] font-mono text-slate-500 block">{currentTopic.category}</span>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">{currentTopic.title}</h2>
            </div>
            <button
              type="button"
              onClick={() => handleActionClick(currentTopic)}
              className="btn-primary text-[11px]"
            >
              {currentTopic.toolActionLabel}
            </button>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wide mb-1">
              1. Core Definition
            </h3>
            <p className="p-2.5 bg-slate-50 border border-slate-300 text-slate-900">
              {currentTopic.simpleDefinition}
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wide mb-1">
              2. Technical & Biochemical Explanation
            </h3>
            <p className="p-2.5 bg-white border border-slate-300 text-slate-800 leading-relaxed">
              {currentTopic.technicalExplanation}
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wide mb-1">
              3. Biological Example
            </h3>
            <div className="p-2.5 bg-slate-50 border border-slate-300 font-mono text-xs text-slate-900">
              {currentTopic.example}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500">
            <span>Reference source: GeneLab Bioinformatics Instructional Curriculum</span>
            <button
              type="button"
              onClick={() => handleActionClick(currentTopic)}
              className="btn-classic text-[11px]"
            >
              Test in Workbench →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
