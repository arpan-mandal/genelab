/**
 * GeneLab — Cross-Database Identifier Resolution & Entity Linker
 * Unifies accessions across NCBI, UniProt, Ensembl, PDB, PubChem, and Literature.
 */

export type IdentifierType =
  | 'gene_symbol'
  | 'ncbi_gene_id'
  | 'ncbi_nuccore_acc'
  | 'ncbi_protein_acc'
  | 'ensembl_gene_id'
  | 'uniprot_acc'
  | 'pdb_id'
  | 'pmid'
  | 'doi'
  | 'pubchem_cid';

export interface EntityIdentifier {
  type: IdentifierType;
  value: string;
  database: string;
  url: string;
}

export interface BiologicalCrossReferences {
  geneSymbol?: string;
  organism?: string;
  ncbiGeneId?: string;
  ncbiNucleotideAcc?: string;
  ensemblGeneId?: string;
  uniprotAcc?: string;
  pdbIds?: string[];
  pmids?: string[];
  reactomePathwayIds?: string[];
  pubchemCid?: number;
}

/**
 * Detects the probable identifier type based on accession syntax patterns.
 */
export function detectIdentifierType(input: string): IdentifierType | 'keyword' {
  const clean = input.trim();

  // 4-character PDB code (e.g., 4HHB, 1TUP, 1EMA)
  if (/^[0-9][a-zA-Z0-9]{3}$/i.test(clean)) {
    return 'pdb_id';
  }

  // UniProt Accession (e.g. P68871, Q9BYF1, P04637)
  if (/^[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}$/i.test(clean)) {
    return 'uniprot_acc';
  }

  // Ensembl Gene ID (e.g. ENSG00000244734)
  if (/^ENS[A-Z]*G[0-9]{11}$/i.test(clean)) {
    return 'ensembl_gene_id';
  }

  // NCBI RefSeq Nucleotide Accession (e.g. NM_000518, NC_000011, NG_000007)
  if (/^(NM_|NC_|NG_|NR_|XM_|XR_)[0-9]+(\.[0-9]+)?$/i.test(clean)) {
    return 'ncbi_nuccore_acc';
  }

  // NCBI RefSeq Protein Accession (e.g. NP_000509, XP_000001)
  if (/^(NP_|XP_|AP_)[0-9]+(\.[0-9]+)?$/i.test(clean)) {
    return 'ncbi_protein_acc';
  }

  // Pure digits: could be PMID, PubChem CID, or NCBI Gene ID
  if (/^\d{5,9}$/.test(clean)) {
    return 'pmid';
  }

  // DOI (e.g. 10.1038/nature12373)
  if (/^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/.test(clean)) {
    return 'doi';
  }

  return 'keyword';
}

/**
 * Known high-confidence cross-reference dictionary for major model genes/proteins.
 * Used for instant cross-linking between tools.
 */
export const VERIFIED_GENE_MAPPINGS: Record<string, BiologicalCrossReferences> = {
  HBB: {
    geneSymbol: 'HBB',
    organism: 'Homo sapiens',
    ncbiGeneId: '3043',
    ncbiNucleotideAcc: 'NM_000518.5',
    ensemblGeneId: 'ENSG00000244734',
    uniprotAcc: 'P68871',
    pdbIds: ['4HHB', '1HHO', '2HHB', '1A3N'],
    pmids: ['450410', '486790', '15201198'],
    reactomePathwayIds: ['R-HSA-1237044'],
  },
  TP53: {
    geneSymbol: 'TP53',
    organism: 'Homo sapiens',
    ncbiGeneId: '7157',
    ncbiNucleotideAcc: 'NM_000546.6',
    ensemblGeneId: 'ENSG00000141510',
    uniprotAcc: 'P04637',
    pdbIds: ['1TUP', '1TSR', '2OCJ', '3Q05'],
    pmids: ['20930847', '21217739', '17066085'],
    reactomePathwayIds: ['R-HSA-5633007', 'R-HSA-69541'],
  },
  BRCA1: {
    geneSymbol: 'BRCA1',
    organism: 'Homo sapiens',
    ncbiGeneId: '672',
    ncbiNucleotideAcc: 'NM_007294.4',
    ensemblGeneId: 'ENSG00000012048',
    uniprotAcc: 'P38398',
    pdbIds: ['1JM7', '4OFB', '1JNX'],
    pmids: ['7545954', '8944023'],
    reactomePathwayIds: ['R-HSA-5693532'],
  },
  INS: {
    geneSymbol: 'INS',
    organism: 'Homo sapiens',
    ncbiGeneId: '3630',
    ncbiNucleotideAcc: 'NM_000207.3',
    ensemblGeneId: 'ENSG00000254647',
    uniprotAcc: 'P01308',
    pdbIds: ['4INS', '1TRZ', '2KQP'],
    pmids: ['7027255', '6795419'],
    reactomePathwayIds: ['R-HSA-264870'],
  },
  EGFR: {
    geneSymbol: 'EGFR',
    organism: 'Homo sapiens',
    ncbiGeneId: '1956',
    ncbiNucleotideAcc: 'NM_005228.5',
    ensemblGeneId: 'ENSG00000146648',
    uniprotAcc: 'P00533',
    pdbIds: ['1M17', '1IVO', '2ITX'],
    pmids: ['15118073', '15229579'],
    reactomePathwayIds: ['R-HSA-177929'],
  },
};

export function getCrossReferences(key?: string): BiologicalCrossReferences | null {
  if (!key) return null;
  const clean = key.trim().toUpperCase();
  if (VERIFIED_GENE_MAPPINGS[clean]) {
    return VERIFIED_GENE_MAPPINGS[clean];
  }
  for (const mapping of Object.values(VERIFIED_GENE_MAPPINGS)) {
    if (
      mapping.uniprotAcc?.toUpperCase() === clean ||
      mapping.geneSymbol?.toUpperCase() === clean ||
      mapping.ncbiNucleotideAcc?.toUpperCase().includes(clean)
    ) {
      return mapping;
    }
  }
  return null;
}
