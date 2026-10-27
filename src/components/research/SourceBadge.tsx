import React from 'react';
import { ExternalLink } from 'lucide-react';

export type DatabaseSource =
  | 'NCBI'
  | 'NCBI Nucleotide'
  | 'NCBI Gene'
  | 'NCBI Protein'
  | 'PubMed'
  | 'Europe PMC'
  | 'UniProt'
  | 'Ensembl'
  | 'RCSB PDB'
  | 'PubChem'
  | 'STRING'
  | 'Reactome'
  | 'Ensembl / NCBI'
  | 'UniProt / RCSB'
  | 'STRING / Reactome';

interface SourceBadgeProps {
  source: DatabaseSource;
  accession?: string;
  url?: string;
  externalUrl?: string;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ source, accession, url, externalUrl }) => {
  const targetUrl = url || externalUrl;

  const badgeClasses: Record<string, string> = {
    'NCBI': 'bg-blue-100 text-blue-900 border-blue-300',
    'NCBI Nucleotide': 'bg-blue-100 text-blue-900 border-blue-300',
    'NCBI Gene': 'bg-blue-100 text-blue-900 border-blue-300',
    'NCBI Protein': 'bg-blue-100 text-blue-900 border-blue-300',
    'PubMed': 'bg-sky-100 text-sky-900 border-sky-300',
    'Europe PMC': 'bg-emerald-100 text-emerald-900 border-emerald-300',
    'UniProt': 'bg-indigo-100 text-indigo-900 border-indigo-300',
    'Ensembl': 'bg-amber-100 text-amber-900 border-amber-300',
    'RCSB PDB': 'bg-teal-100 text-teal-900 border-teal-300',
    'PubChem': 'bg-cyan-100 text-cyan-900 border-cyan-300',
    'STRING': 'bg-purple-100 text-purple-900 border-purple-300',
    'Reactome': 'bg-rose-100 text-rose-900 border-rose-300',
    'Ensembl / NCBI': 'bg-slate-200 text-slate-800 border-slate-400',
    'UniProt / RCSB': 'bg-slate-200 text-slate-800 border-slate-400',
    'STRING / Reactome': 'bg-slate-200 text-slate-800 border-slate-400',
  };

  const styleCls = badgeClasses[source] || 'bg-slate-100 text-slate-800 border-slate-300';

  if (!targetUrl) {
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 border text-[10px] font-mono font-medium ${styleCls}`}>
        <span>{source}</span>
        {accession && <span className="font-bold">:{accession}</span>}
      </span>
    );
  }

  return (
    <a
      href={targetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 border text-[10px] font-mono font-medium hover:underline cursor-pointer transition-opacity hover:opacity-85 ${styleCls}`}
      title={`Open official entry in ${source}`}
    >
      <span>{source}</span>
      {accession && <span className="font-bold">:{accession}</span>}
      <ExternalLink className="w-2.5 h-2.5 opacity-70" />
    </a>
  );
};
