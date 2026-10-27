import React, { useState } from 'react';
import { STANDARD_CODON_TABLE, AMINO_ACIDS, START_CODONS, STOP_CODONS } from '../bio/translation';

interface CodonTableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodonTableModal: React.FC<CodonTableModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<string>('all');

  if (!isOpen) return null;

  const allCodons = Object.entries(STANDARD_CODON_TABLE).map(([codon, aaCode]) => {
    const aa = AMINO_ACIDS[aaCode] || AMINO_ACIDS['X'];
    return {
      codon,
      aaCode,
      name: aa.name,
      threeLetter: aa.threeLetter,
      property: aa.property,
      description: aa.description,
      isStart: START_CODONS.has(codon),
      isStop: STOP_CODONS.has(codon),
    };
  });

  const filteredCodons = allCodons.filter(c => {
    const matchesSearch =
      c.codon.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.threeLetter.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.aaCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProp =
      selectedProperty === 'all' ||
      c.property === selectedProperty ||
      (selectedProperty === 'start' && c.isStart) ||
      (selectedProperty === 'stop' && c.isStop);

    return matchesSearch && matchesProp;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] border-2 border-slate-700 shadow-xl flex flex-col overflow-hidden text-xs font-sans">
        {/* Title Bar */}
        <div className="bg-slate-800 text-white px-3 py-1.5 flex items-center justify-between select-none">
          <span className="font-bold">Genetic Code Table (NCBI Table 1: Standard Universal)</span>
          <button
            type="button"
            onClick={onClose}
            className="hover:bg-slate-700 px-2 py-0.5 font-mono cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-slate-100 border-b border-slate-300 p-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <label className="font-medium text-slate-700">Filter Codon / Amino Acid:</label>
            <input
              type="text"
              placeholder="e.g. ATG, Met, Leucine, L..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-400 px-2 py-1 text-xs w-48 font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="font-medium text-slate-700">Property:</label>
            <select
              value={selectedProperty}
              onChange={e => setSelectedProperty(e.target.value)}
              className="bg-white border border-slate-400 px-2 py-1 text-xs"
            >
              <option value="all">All (64 Codons)</option>
              <option value="start">Start (ATG)</option>
              <option value="stop">Stop (TAA, TAG, TGA)</option>
              <option value="hydrophobic">Hydrophobic</option>
              <option value="polar">Polar</option>
              <option value="positive">Basic (+)</option>
              <option value="negative">Acidic (-)</option>
              <option value="special">Special (Gly, Pro, Cys)</option>
            </select>
          </div>
        </div>

        {/* Dense Table */}
        <div className="overflow-y-auto p-3 max-h-[60vh]">
          <table className="table-dense">
            <thead className="sticky top-0 bg-slate-100">
              <tr>
                <th className="w-20">Codon</th>
                <th className="w-16">1-Letter</th>
                <th className="w-20">3-Letter</th>
                <th>Amino Acid Name</th>
                <th>Chemical Property</th>
                <th>Biological Signal</th>
              </tr>
            </thead>
            <tbody>
              {filteredCodons.map(item => (
                <tr
                  key={item.codon}
                  className={
                    item.isStart
                      ? 'bg-emerald-50 font-bold'
                      : item.isStop
                      ? 'bg-rose-50 font-bold'
                      : ''
                  }
                >
                  <td className="font-bold text-slate-900 tracking-wider font-mono">{item.codon}</td>
                  <td className="font-mono font-bold">{item.aaCode}</td>
                  <td className="font-mono">{item.threeLetter}</td>
                  <td className="font-sans font-medium">{item.name}</td>
                  <td className="font-sans capitalize text-slate-600">{item.property}</td>
                  <td className="font-sans text-[11px]">
                    {item.isStart ? (
                      <span className="text-emerald-800 font-bold">START (Methionine)</span>
                    ) : item.isStop ? (
                      <span className="text-rose-800 font-bold">STOP CODON (*)</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Status footer */}
        <div className="bg-slate-100 border-t border-slate-300 p-2.5 flex justify-between items-center text-xs">
          <span className="text-[11px] text-slate-600 font-mono">
            Showing {filteredCodons.length} of 64 standard genetic codons
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn-classic px-4"
          >
            Close Table
          </button>
        </div>
      </div>
    </div>
  );
};
