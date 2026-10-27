# GeneLab — DNA Sequence Analysis & Scientific Database Explorer

GeneLab is a browser-based bioinformatics workbench. It allows users to input DNA sequences, run standard molecular biology calculations locally in the browser, and query public biological databases for associated gene, protein, structural, chemical, and literature records.

It requires no user accounts, database setups, or paid API keys. All core sequence operations run entirely on the client side using pure TypeScript, while external biological data is queried directly from official public REST APIs.

---

## 1. Local Sequence Analysis Tools

All sequence calculations are computed locally in the browser thread. User sequences are not sent to any remote server for calculation.

### A. Sequence Analyzer (`src/bio/nucleotide.ts`, `src/views/AnalyzerView.tsx`)
* **Input Parsing & Validation:**
  * Accepts raw sequence strings or FASTA formatted text (with single-line or multi-line `>header` lines).
  * Automatically strips whitespace, numbers, and carriage returns.
  * Validates characters against standard DNA bases (`A`, `T`, `G`, `C`), RNA uracil (`U`), and the 11 official IUPAC ambiguity codes (`R`, `Y`, `S`, `W`, `K`, `M`, `B`, `D`, `H`, `V`, `N`).
  * Invalid characters are not silently deleted; the tool halts analysis and reports the exact 1-based character position and the invalid symbol.
* **Composition & GC/AT Content:**
  * Computes total length, unambiguous base counts ($A, T, G, C$), and ambiguous base counts.
  * For sequences with ambiguous IUPAC bases, it reports:
    1. **Unambiguous GC%**: $\frac{G + C}{A + T + G + C} \times 100$
    2. **Minimum GC% Bound**: assumes all ambiguous bases are $A$ or $T$.
    3. **Maximum GC% Bound**: assumes all ambiguous bases are $G$ or $C$.
  * Estimates single-stranded DNA molecular weight based on average nucleotide monophosphate masses ($~330\text{ Da}$ per nucleotide minus terminal water).
* **Strand Operations:**
  * **Complement ($3' \rightarrow 5'$):** Base-pairs $A \leftrightarrow T$, $G \leftrightarrow C$, and resolves IUPAC pairs ($R \leftrightarrow Y$, $S \leftrightarrow S$, $W \leftrightarrow W$, $K \leftrightarrow M$, $B \leftrightarrow V$, $D \leftrightarrow H$, $N \leftrightarrow N$).
  * **Reverse ($3' \rightarrow 5'$):** Inverts string order without complementing bases.
  * **Reverse Complement ($5' \rightarrow 3'$):** The standard antiparallel strand.
  * **Transcription:** Converts DNA thymine ($T$) to RNA uracil ($U$).
* **Visualizations:**
  * Monospaced sequence view broken into 10-base blocks (decamers) with 60 bases per row and coordinate markers.
  * Optional nucleotide syntax highlighting ($A$ = Green, $T$ = Red, $G$ = Amber, $C$ = Blue).
  * Sliding-window GC profile chart (default window: 30 bp, step: 5 bp) to identify GC-rich regions and CpG islands.

### B. Translation & Reading Frames (`src/bio/translation.ts`, `src/views/TranslationView.tsx`)
* **6-Frame Translation:**
  * Forward frames: $+1$ (offset 0), $+2$ (offset 1), $+3$ (offset 2) on the input sequence.
  * Reverse frames: $-1$ (offset 0), $-2$ (offset 1), $-3$ (offset 2) on the reverse complement.
* **Codon Table:**
  * Implements the NCBI Standard / Universal Genetic Code (Translation Table 1) mapping all 64 triplets to single-letter and three-letter amino acid codes.
* **IUPAC Ambiguity Resolution in Codons:**
  * Expands ambiguous codons. If all possible permutations translate to the same amino acid (e.g. `CTN` always encodes Leucine regardless of whether the third base is $A, C, G,$ or $T$), the amino acid is assigned. If permutations encode multiple distinct residues, it assigns `X` (unknown).
* **Incomplete Codon Handling:**
  * Residual bases ($1$ or $2$ nucleotides at the $3'$ end that do not form a complete triplet) are reported separately and not discarded.
* **Reference Table:**
  * Includes an interactive 64-codon lookup table categorizing amino acids by physicochemical properties (hydrophobic, polar uncharged, basic, acidic, special, stop).

### C. Pairwise Sequence Alignment (`src/bio/alignment.ts`, `src/views/ComparisonView.tsx`)
* **Algorithm:**
  * Full Needleman-Wunsch dynamic programming algorithm for global pairwise alignment.
  * Complexity: $O(N \times M)$ time and memory.
* **Scoring Parameters:**
  * Match reward: default $+2$
  * Mismatch penalty: default $-1$
  * Linear gap penalty: default $-2$
* **Alignment Metrics:**
  * **Percent Identity:** Calculated strictly as $\frac{\text{Exact Matches}}{\text{Alignment Length}} \times 100$, where alignment length includes all gap columns.
  * Tracks exact matches, mismatches, total gaps, and gap counts per sequence.
* **Visual Output:**
  * Displays Sequence A, match identity line (`|` for match, `:` for transition, `.` for transversion, space for gap/mismatch), and Sequence B.
  * Includes built-in mutation examples: Beta-Globin wild-type vs. Sickle Cell (HbS, single nucleotide transversion $A \rightarrow T$, Glu $\rightarrow$ Val), insertion/deletion frameshift, and divergent homologous sequences.

### D. Open Reading Frame (ORF) Finder (`src/bio/orf.ts`, `src/views/OrfView.tsx`)
* **Scan Scope:**
  * Identifies candidate protein-coding segments across all six reading frames ($+1, +2, +3, -1, -2, -3$).
* **Criteria:**
  * Defines an ORF as a segment starting with an initiation codon (`ATG`) and terminating at the first in-frame stop codon (`TAA`, `TAG`, `TGA`).
  * Filterable by minimum codon length (default: $\ge 20$ codons / $60$ bp).
* **Output:**
  * Interactive 6-track horizontal genetic map showing relative genomic positions of candidate ORFs.
  * Table with start position, stop position, length in nucleotides, length in amino acids, frame, and strand.
  * Details pane displaying both the coding nucleotide sequence and the translated peptide string with one-click clipboard copy.

---

## 2. Public Scientific Database Explorers

GeneLab connects to public bioinformatics databases via standard HTTPS REST requests. No user credentials, accounts, or private API keys are required.

### A. Gene & Transcript Explorer (`src/views/GeneExplorer.tsx`, `src/services/api/ensembl.ts`, `src/services/api/ncbi.ts`)
* **Endpoints Used:**
  * Ensembl REST API (`https://rest.ensembl.org/lookup/symbol/...` and `https://rest.ensembl.org/sequence/id/...`)
  * NCBI E-utilities Gene (`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=gene` & `esummary.fcgi`)
* **Features:**
  * Search by official gene symbol (`HBB`, `TP53`, `BRCA1`, `INS`, `EGFR`, etc.) or Ensembl Gene ID (`ENSG...`).
  * Species selection: Human (*Homo sapiens*), Mouse (*Mus musculus*), Rat (*Rattus norvegicus*), Zebrafish (*Danio rerio*), Fruit Fly (*Drosophila melanogaster*), Nematode (*Caenorhabditis elegans*), Yeast (*Saccharomyces cerevisiae*).
  * Returns genomic coordinates (chromosome, start, end, strand), biotype, and functional summaries.
  * Lists all transcript isoforms, indicating canonical status, genomic spans, and lengths.
  * Fetches real cDNA, CDS (coding), or genomic nucleotide sequences.
  * **"Load into Sequence Analyzer"** sends the fetched sequence directly into the analysis workbench with a single click.

### B. Protein & 3D Structure Explorer (`src/views/ProteinStructureExplorer.tsx`, `src/services/api/uniprot.ts`, `src/services/api/rcsb.ts`)
* **Endpoints Used:**
  * UniProtKB REST API (`https://rest.uniprot.org/uniprotkb/search` & `https://rest.uniprot.org/uniprotkb/{accession}`)
  * RCSB Protein Data Bank API (`https://data.rcsb.org/rest/v1/core/entry/{pdbId}`)
* **Features:**
  * Look up proteins by UniProt accession (e.g. `P68871`, `P04637`) or gene symbol.
  * Displays Swiss-Prot reviewed status, full protein name, organism, amino acid length, molecular mass in Daltons, and subcellular locations.
  * Curated domain/feature table (signal peptides, active sites, binding sites, transmembrane regions).
  * Lists related PDB structures with experimental determination method (X-ray diffraction, cryo-EM, NMR), resolution in Angstroms ($\text{\AA}$), deposition date, authors, and primary literature citation.
  * Embedded interactive **3D Mol* WebGL Viewer** (`src/components/research/MolecularViewer.tsx`) to inspect macromolecular tertiary structures directly in the browser.

### C. Scientific Literature Explorer (`src/views/LiteratureExplorer.tsx`, `src/services/api/pubmed.ts`, `src/services/api/europepmc.ts`)
* **Endpoints Used:**
  * NCBI PubMed E-utilities (`esearch.fcgi?db=pubmed`, `esummary.fcgi`, `efetch.fcgi`)
  * Europe PMC REST API (`https://www.ebi.ac.uk/europepmc/webservices/rest/search`)
* **Features:**
  * Federated search across both PubMed and Europe PMC with deduplication by PMID and DOI.
  * Year filtering (All time, Last 5 years, Last 10 years).
  * Article cards display title, author list, journal name, publication date, PubMed PMID link, DOI link, and an Open Access tag when full text is freely available.
  * Expandable abstract viewer that pulls full abstract text on demand from NCBI EFetch.
  * One-click citation formatting (plain text citation copied to clipboard).

### D. Chemical Compound Explorer (`src/views/CompoundExplorer.tsx`, `src/services/api/pubchem.ts`)
* **Endpoints Used:**
  * NIH PubChem PUG REST API (`https://pubchem.ncbi.nlm.nih.gov/rest/pug/...`)
* **Features:**
  * Search compounds by drug name, chemical name, or numeric PubChem CID (e.g. `Aspirin`, `Caffeine`, `Doxorubicin`, `Imatinib`, `Paclitaxel`, `ATP`).
  * Renders 2D skeletal structural topology from PubChem's dynamic image service.
  * Displays IUPAC systematic name, molecular formula, molecular weight (g/mol), XLogP3 partition coefficient, hydrogen bond donors, hydrogen bond acceptors, and rotatable bonds.
  * Canonical SMILES and InChIKey with one-click copy.
  * Retrieves associated biological activity screens and active BioAssay records (AID).

### E. Biological Pathway & Network Explorer (`src/views/PathwayExplorer.tsx`, `src/services/api/string.ts`, `src/services/api/reactome.ts`)
* **Endpoints Used:**
  * STRING-DB API (`https://string-db.org/api/...`)
  * Reactome Content Service (`https://reactome.org/ContentService/...`)
* **Features:**
  * **Protein-Protein Interactions (STRING):** Queries functional association partners for a given gene. Generates a rendered network diagram with adjustable confidence score thresholds (Medium 0.4, High 0.7, Highest 0.9). Table lists top interactors with combined score, experimental score, and curated database score.
  * **Biochemical Pathways (Reactome):** Retrieves curated Reactome biological pathways containing the gene. Displays pathway stable IDs (`R-HSA-...`), pathway names, and renders the official pathway diagram image.

### F. Cross-Database Entity Resolution (`src/services/api/identifierMapping.ts`, `src/components/research/CrossReferenceList.tsx`)
* Automatically detects identifier types via regex patterns (PDB IDs, UniProt accessions, Ensembl Gene IDs, RefSeq numbers, PMIDs, DOIs).
* Contains a verified cross-reference graph for major model genes (`HBB`, `TP53`, `BRCA1`, `INS`, `EGFR`) allowing 1-click navigation between the Gene Explorer, Protein Explorer, 3D Structures, Reactome Pathways, and PubMed citations.

---

## 3. Database Resilience & API Compliance (`src/services/api/apiClient.ts`)

Public bioinformatics APIs enforce strict usage policies. GeneLab implements a client-side resilience layer to ensure compliance without requiring API keys:

1. **Per-Provider Rate Limiting:**
   * **NCBI E-utilities:** Throttled to 350 ms between requests ($\le 2.8\text{ req/s}$, adhering to NCBI's limit of $3\text{ req/s}$ for unauthenticated requests). Includes standard compliance parameters (`tool=GeneLab` and contact email).
   * **PubChem:** Throttled to 220 ms ($\le 4.5\text{ req/s}$, under the $5\text{ req/s}$ limit).
   * **UniProt:** Throttled to 150 ms ($\le 6.6\text{ req/s}$).
   * **Ensembl:** Throttled to 100 ms ($\le 10\text{ req/s}$, under the $15\text{ req/s}$ limit).
   * **STRING & Reactome:** Throttled to 150–200 ms.
2. **In-Memory LRU Cache:**
   * Caches successful GET responses in memory with a 10-minute Time-To-Live (TTL).
   * Maximum capacity: 150 entries with Least-Recently-Used eviction to prevent redundant network traffic.
3. **Timeout & Retry Policy:**
   * Uses `AbortController` with a 12 to 15 second timeout per request.
   * Exponential backoff retry mechanism (up to 2 retries) for transient network drops.
4. **Normalized Error Handling:**
   * Standardizes HTTP errors, timeouts, and rate limits into `ScientificApiError` objects that display clear messages and retry options instead of crashing the UI.

---

## 4. User Interface Architecture

The interface is engineered around practical scientific software conventions (similar to EMBOSS, NCBI tools, and desktop laboratory systems):
* **Utilitarian Styling:** Monospaced data displays, dense tables, 1px borders, muted slate backgrounds (`#f1f5f9` / `#e2e8f0`), dark navy text (`#0f172a`), and zero decorative gradients or glassmorphism.
* **Top Menu Bar (`src/components/AppMenu.tsx`):** Classic desktop application menus:
  * `File`: Open FASTA file, load preset sequences, export report (TXT, JSON, PDF), print, clear.
  * `Edit`: Copy DNA, copy reverse complement, copy translated peptide.
  * `Tools`: Quick-switch between Sequence Analyzer, Translation, Alignment, ORF Finder, and Codon Table Modal.
  * `Databases`: Direct navigation to Genes, Proteins, Literature, Compounds, and Pathways.
  * `View`: Toggle syntax color-coding, toggle bottom status bar.
  * `Help`: Bioinformatics Learning Reference Manual, algorithms documentation.
* **Application Toolbar (`src/components/Toolbar.tsx`):** One-click buttons for FASTA import, sample loading, analysis actions, report export, and print.
* **Status Bar (`src/components/StatusBar.tsx`):** Fixed bottom bar reporting active sequence validation status, sequence length, GC content, base counts, ambiguous counts, and estimated molecular weight.
* **Export Engine (`src/bio/export.ts`):** Client-side generation of structured plain-text reports, JSON data dumps, and vector PDF reports (`jsPDF`).

---

## 5. Project Structure

```
genelab/
├── src/
│   ├── bio/                          # Pure biological calculation logic (independent of UI)
│   │   ├── types.ts                  # TypeScript types (IUPAC, codon tables, alignments, ORFs)
│   │   ├── presets.ts                # Real biological sequence presets (HBB, sickle cell, etc.)
│   │   ├── nucleotide.ts             # Validation, base frequencies, GC/AT calculations, transformations
│   │   ├── translation.ts            # Standard genetic code (Table 1), 6-frame translation, ambiguity resolution
│   │   ├── alignment.ts              # Needleman-Wunsch global alignment dynamic programming
│   │   ├── orf.ts                    # 6-frame open reading frame scanning
│   │   └── export.ts                 # Plain text, JSON, and PDF report generators
│   ├── services/api/                 # External scientific API integration layer
│   │   ├── apiClient.ts              # Throttling, LRU caching, timeout handling, retries
│   │   ├── ncbi.ts                   # NCBI E-utilities (FASTA fetch, gene/protein/nucleotide search)
│   │   ├── ensembl.ts                # Ensembl REST (gene lookup, species, transcripts, sequence)
│   │   ├── uniprot.ts                # UniProtKB REST (accessions, Swiss-Prot data, domains)
│   │   ├── rcsb.ts                   # RCSB PDB (macromolecular structures, resolutions, citations)
│   │   ├── pubchem.ts                # PubChem PUG REST (2D structure, SMILES, InChIKey, assays)
│   │   ├── pubmed.ts                 # PubMed E-utilities search and abstract retrieval
│   │   ├── europepmc.ts              # Europe PMC search and publication deduplication
│   │   ├── string.ts                 # STRING-DB interaction networks and diagram URLs
│   │   ├── reactome.ts               # Reactome pathway search and diagram exporter
│   │   └── identifierMapping.ts      # Identifier type detection and cross-reference mappings
│   ├── components/                   # UI components
│   │   ├── AppMenu.tsx               # Desktop menu bar (File, Edit, Tools, Databases, View, Help)
│   │   ├── Toolbar.tsx               # Quick-action application toolbar
│   │   ├── ToolNavigation.tsx        # Left navigation panel with active sequence inspector
│   │   ├── StatusBar.tsx             # Bottom application status bar
│   │   ├── CodonTableModal.tsx       # 64-codon interactive reference modal
│   │   └── research/                 # Reusable scientific research components
│   │       ├── SourceBadge.tsx       # Database source attribution badge with outbound links
│   │       ├── CrossReferenceList.tsx# 1-click cross-navigation component
│   │       ├── MolecularViewer.tsx   # 3D Mol* WebGL viewer and 2D chemical structure renderer
│   │       ├── LoadingState.tsx      # Terminal-styled loading indicator
│   │       └── ErrorState.tsx        # Technical error display with retry actions
│   ├── views/                        # Main workbench views
│   │   ├── AnalyzerView.tsx          # Sequence Analyzer with NCBI RefSeq direct fetcher
│   │   ├── TranslationView.tsx       # 6-Frame Translation & Reading Frames
│   │   ├── ComparisonView.tsx        # Pairwise Global Sequence Alignment
│   │   ├── OrfView.tsx               # Open Reading Frame Finder
│   │   ├── GeneExplorer.tsx          # Gene & Transcript Explorer (Ensembl + NCBI)
│   │   ├── ProteinStructureExplorer.tsx # Protein & 3D PDB Explorer (UniProt + RCSB)
│   │   ├── LiteratureExplorer.tsx    # Literature Search (PubMed + Europe PMC)
│   │   ├── CompoundExplorer.tsx      # Chemical Compound Explorer (PubChem)
│   │   ├── PathwayExplorer.tsx       # Pathways & Interactions (STRING + Reactome)
│   │   ├── LearningCenterView.tsx    # Reference manual and academic lessons
│   │   └── AboutView.tsx             # Methodology, formulas, and references
│   ├── tests/                        # Automated unit tests
│   │   ├── nucleotide.test.ts        # IUPAC validation, composition, GC profile tests
│   │   ├── translation.test.ts       # 64 codons, ambiguity resolution, 6 frames
│   │   ├── alignment.test.ts         # Needleman-Wunsch algorithm and scoring tests
│   │   ├── orf.test.ts               # ORF detection and length threshold tests
│   │   └── api.test.ts               # Identifier detection, caching, deduplication tests
│   ├── App.tsx                       # Root application shell and tab router
│   ├── main.tsx                      # Entry point
│   └── index.css                     # Tailwind CSS and utilitarian table styles
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 6. How to Run & Test

### Prerequisites
* Node.js (version 18 or higher recommended)
* npm

### Installation & Development Server
Run from the repository root:
```bash
# Install dependencies
npm install --prefix genelab

# Start the Vite development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

Alternatively, you can work inside the `genelab/` folder directly:
```bash
cd genelab
npm install
npm run dev
```

### Running the Test Suite
GeneLab includes 36 automated unit tests powered by **Vitest**:
```bash
npm test
```
The test suite validates:
* IUPAC validation and rejection of invalid characters.
* Exact GC/AT calculations and boundary calculations for ambiguous sequences.
* Watson-Crick and IUPAC reverse-complement transformations.
* Translation accuracy for all 64 codons and conservative ambiguity resolution.
* Needleman-Wunsch dynamic programming traceback and percent identity formulas.
* In silico ORF identification across all six reading frames.
* Cross-database identifier classification (PDB, UniProt, Ensembl, RefSeq, PMID, DOI).
* Publication deduplication between PubMed and Europe PMC.

### Building for Production
```bash
npm run build
```
Executes `tsc` (TypeScript compiler) followed by `vite build` to generate an optimized production bundle in `genelab/dist/`.

---

## 7. Known Scientific Limitations

1. **Introns & Eukaryotic Splicing:** Calculations treat input sequences as continuous linear molecules. The in silico tools do not model eukaryotic splice donor/acceptor consensus sites ($GT\dots AG$) or alternative splicing mechanisms.
2. **Post-Translational Modifications (PTMs):** Translations predict the primary polypeptide chain. They do not simulate folding, disulfide bond formation, phosphorylation, or glycosylation.
3. **In Silico ORFs vs. In Vivo Biological Genes:** The identification of an open reading frame in silico does not prove that the sequence is expressed in vivo. Biological gene expression requires functional promoters, transcription factor binding sites, RNA polymerase initiation, ribozyme/ribosome binding sequences (Shine-Dalgarno in bacteria, Kozak consensus in eukaryotes), and post-transcriptional stability.
4. **Alignment Memory Bounds:** The Needleman-Wunsch dynamic programming matrix requires $O(N \times M)$ memory. In the browser, pairwise alignment is restricted to sequences $\le 2,500\text{ bp}$ to ensure thread responsiveness.
5. **Alternative Genetic Codes:** Translation uses NCBI Translation Table 1 (Standard / Universal). Alternative codes (such as vertebrate mitochondrial code, where `UGA` codes for Tryptophan instead of Stop) are not currently selectable.

---

## 8. Academic References

1. **Needleman, S. B., & Wunsch, C. D. (1970).** A general method applicable to the search for similarities in the amino acid sequence of two proteins. *Journal of Molecular Biology*, 48(3), 443–453.
2. **Cornish-Bowden, A. (1985).** Nomenclature for incompletely specified bases in nucleic acid sequences: recommendations 1984. *Nucleic Acids Research*, 13(9), 3021–3030.
3. **Crick, F. H. (1966).** Codon—anticodon pairing: the wobble hypothesis. *Journal of Molecular Biology*, 19(2), 548–555.
4. **Sayers, E. W., et al. (2022).** Database resources of the National Center for Biotechnology Information. *Nucleic Acids Research*, 50(D1), D20–D26.
5. **The UniProt Consortium (2023).** UniProt: the Universal Protein Knowledgebase in 2023. *Nucleic Acids Research*, 51(D1), D523–D531.
6. **Berman, H. M., et al. (2000).** The Protein Data Bank. *Nucleic Acids Research*, 28(1), 235–242.
7. **Kim, S., et al. (2023).** PubChem 2023 update. *Nucleic Acids Research*, 51(D1), D1373–D1380.
8. **Szklarczyk, D., et al. (2023).** The STRING database in 2023: protein–protein association networks with increased coverage and high-throughput experimental data. *Nucleic Acids Research*, 51(D1), D638–D646.
9. **Gillespie, M., et al. (2022).** The reactome pathway knowledgebase 2022. *Nucleic Acids Research*, 50(D1), D687–D692.
