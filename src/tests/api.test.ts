import { describe, it, expect, beforeEach } from 'vitest';
import {
  detectIdentifierType,
  getCrossReferences,
} from '../services/api/identifierMapping';
import { deduplicatePublications } from '../services/api/europepmc';
import { PublicationRecord } from '../services/api/pubmed';
import { generatePathwayDiagramUrl } from '../services/api/reactome';
import { generateNetworkImageUrl } from '../services/api/string';
import { ScientificApiError, clearApiCache, getApiCacheMetrics } from '../services/api/apiClient';

describe('Scientific Identifier Detection & Entity Resolution', () => {
  it('correctly classifies standard PDB identifiers (4 alphanumeric characters)', () => {
    expect(detectIdentifierType('4HHB')).toBe('pdb_id');
    expect(detectIdentifierType('1tup')).toBe('pdb_id');
    expect(detectIdentifierType('2HHB')).toBe('pdb_id');
    expect(detectIdentifierType('6VXX')).toBe('pdb_id');
  });

  it('correctly classifies UniProt accessions', () => {
    expect(detectIdentifierType('P68871')).toBe('uniprot_acc');
    expect(detectIdentifierType('P04637')).toBe('uniprot_acc');
    expect(detectIdentifierType('P38398')).toBe('uniprot_acc');
    expect(detectIdentifierType('P01308')).toBe('uniprot_acc');
  });

  it('correctly classifies Ensembl Gene IDs', () => {
    expect(detectIdentifierType('ENSG00000244734')).toBe('ensembl_gene_id');
    expect(detectIdentifierType('ENSG00000141510')).toBe('ensembl_gene_id');
  });

  it('correctly classifies NCBI RefSeq accessions', () => {
    expect(detectIdentifierType('NM_000518.5')).toBe('ncbi_nuccore_acc');
    expect(detectIdentifierType('NC_000011.10')).toBe('ncbi_nuccore_acc');
    expect(detectIdentifierType('NP_000509.1')).toBe('ncbi_protein_acc');
  });

  it('correctly classifies PubMed PMIDs and DOIs', () => {
    expect(detectIdentifierType('15201198')).toBe('pmid');
    expect(detectIdentifierType('20930847')).toBe('pmid');
    expect(detectIdentifierType('10.1038/nature12373')).toBe('doi');
    expect(detectIdentifierType('10.1056/NEJMoa1200690')).toBe('doi');
  });

  it('falls back to keyword for gene names or general phrases', () => {
    expect(detectIdentifierType('beta globin')).toBe('keyword');
    expect(detectIdentifierType('sickle cell anemia')).toBe('keyword');
  });
});

describe('Cross-Database Reference Dictionaries', () => {
  it('resolves verified cross-references for major model genes', () => {
    const hbb = getCrossReferences('HBB');
    expect(hbb).not.toBeNull();
    expect(hbb?.geneSymbol).toBe('HBB');
    expect(hbb?.uniprotAcc).toBe('P68871');
    expect(hbb?.pdbIds).toContain('4HHB');
    expect(hbb?.ensemblGeneId).toBe('ENSG00000244734');
    expect(hbb?.ncbiNucleotideAcc).toContain('NM_000518');

    const tp53 = getCrossReferences('P04637'); // Lookup by UniProt accession
    expect(tp53).not.toBeNull();
    expect(tp53?.geneSymbol).toBe('TP53');
    expect(tp53?.pdbIds).toContain('1TUP');
  });

  it('returns null for unmapped query symbols', () => {
    expect(getCrossReferences('XYZ999_UNKNOWN')).toBeNull();
    expect(getCrossReferences('')).toBeNull();
  });
});

describe('Literature Deduplication (PubMed & Europe PMC)', () => {
  it('deduplicates articles by PMID and DOI', () => {
    const pubmedPubs: PublicationRecord[] = [
      {
        pmid: '123456',
        doi: '10.1000/182',
        title: 'Article One',
        authors: ['Smith J'],
        firstAuthor: 'Smith J',
        journal: 'Nature',
        pubDate: '2023',
        year: 2023,
        source: 'PubMed',
        sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/123456/',
      },
      {
        pmid: '789012',
        title: 'Article Two',
        authors: ['Doe J'],
        firstAuthor: 'Doe J',
        journal: 'Science',
        pubDate: '2022',
        year: 2022,
        source: 'PubMed',
        sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/789012/',
      },
    ];

    const europePmcPubs: PublicationRecord[] = [
      {
        pmid: '123456', // Duplicate PMID!
        doi: '10.1000/182',
        title: 'Article One (Europe PMC Index)',
        authors: ['Smith J'],
        firstAuthor: 'Smith J',
        journal: 'Nature',
        pubDate: '2023',
        year: 2023,
        source: 'Europe PMC',
        sourceUrl: 'https://europepmc.org/article/MED/123456',
        isOpenAccess: true,
      },
      {
        pmid: '333444', // Distinct record
        doi: '10.1000/333',
        title: 'Article Three',
        authors: ['Johnson A'],
        firstAuthor: 'Johnson A',
        journal: 'Cell',
        pubDate: '2024',
        year: 2024,
        source: 'Europe PMC',
        sourceUrl: 'https://europepmc.org/article/MED/333444',
        isOpenAccess: true,
      },
    ];

    const combined = deduplicatePublications(pubmedPubs, europePmcPubs);
    expect(combined.length).toBe(3);
    const pmids = combined.map((p) => p.pmid);
    expect(pmids).toEqual(['123456', '789012', '333444']);
  });
});

describe('Scientific API Client & URL Builders', () => {
  beforeEach(() => {
    clearApiCache();
  });

  it('manages in-memory cache lifecycle', () => {
    expect(getApiCacheMetrics().size).toBe(0);
  });

  it('generates valid Reactome diagram image URLs', () => {
    const url = generatePathwayDiagramUrl('R-HSA-5633007');
    expect(url).toContain('https://reactome.org/ContentService/exporter/diagram/R-HSA-5633007.png');
  });

  it('generates valid STRING network image URLs with confidence parameters', () => {
    const url = generateNetworkImageUrl('TP53', 9606, 0.7);
    expect(url).toContain('https://string-db.org/api/image/network?identifiers=TP53');
    expect(url).toContain('species=9606');
    expect(url).toContain('required_score=700');
  });

  it('constructs ScientificApiError with structured attributes', () => {
    const error = new ScientificApiError(
      'Rate limit reached',
      'ncbi',
      429,
      true,
      'Retry after 1 second'
    );
    expect(error.provider).toBe('ncbi');
    expect(error.status).toBe(429);
    expect(error.isRetryable).toBe(true);
    expect(error.name).toBe('ScientificApiError');
  });
});
