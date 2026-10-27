import React, { useState, useRef } from 'react';
import { AppMenu } from './components/AppMenu';
import { Toolbar } from './components/Toolbar';
import { ToolNavigation, NavTabId } from './components/ToolNavigation';
import { StatusBar } from './components/StatusBar';
import { AnalyzerView } from './views/AnalyzerView';
import { TranslationView } from './views/TranslationView';
import { ComparisonView } from './views/ComparisonView';
import { OrfView } from './views/OrfView';
import { GeneExplorer } from './views/GeneExplorer';
import { ProteinStructureExplorer } from './views/ProteinStructureExplorer';
import { LiteratureExplorer } from './views/LiteratureExplorer';
import { CompoundExplorer } from './views/CompoundExplorer';
import { PathwayExplorer } from './views/PathwayExplorer';
import { LearningCenterView } from './views/LearningCenterView';
import { AboutView } from './views/AboutView';
import { CodonTableModal } from './components/CodonTableModal';
import { PRESET_SEQUENCES, PresetSequence } from './bio/presets';
import {
  validateAndCleanSequence,
  calculateNucleotideStats,
  getAllTransformations,
} from './bio/nucleotide';
import { translateReadingFrame } from './bio/translation';
import {
  exportPDFReport,
  generatePlainTextReport,
  triggerFileDownload,
  ReportData,
} from './bio/export';

export const App: React.FC = () => {
  // Start directly on the Sequence Analyzer tool (as mandated: no landing/hero page!)
  const [currentTab, setCurrentTab] = useState<NavTabId>('analyzer');
  const [explorerQuery, setExplorerQuery] = useState<string | undefined>(undefined);
  const [rawSequence, setRawSequence] = useState<string>(PRESET_SEQUENCES[0].sequence);
  const [sequenceName, setSequenceName] = useState<string>(PRESET_SEQUENCES[0].name);

  // View state toggles
  const [colorCodingEnabled, setColorCodingEnabled] = useState(true);
  const [showStatusBar, setShowStatusBar] = useState(true);
  const [showCodonModal, setShowCodonModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNavigate = (tab: NavTabId, query?: string) => {
    setCurrentTab(tab);
    if (query) {
      setExplorerQuery(query);
    }
  };

  const handleLoadSequence = (name: string, seq: string) => {
    setRawSequence(seq);
    setSequenceName(name);
    setCurrentTab('analyzer');
  };

  // Scientific calculation core
  const validation = validateAndCleanSequence(rawSequence);
  const isSeqValid = validation.isValid && validation.cleanedSequence.length > 0;
  const activeSequence = validation.cleanedSequence;

  const stats = calculateNucleotideStats(activeSequence);
  const transformations = isSeqValid ? getAllTransformations(activeSequence) : undefined;
  const selectedFrame = isSeqValid ? translateReadingFrame(activeSequence, '+1') : undefined;

  const handleLoadPreset = (preset: PresetSequence) => {
    setRawSequence(preset.sequence);
    setSequenceName(preset.name);
    setCurrentTab('analyzer');
  };

  const handleClear = () => {
    setRawSequence('');
    setSequenceName('');
  };

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawSequence(content);
        setSequenceName(file.name.replace(/\.[^/.]+$/, ''));
        setCurrentTab('analyzer');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const buildReportData = (): ReportData => {
    return {
      title: 'GeneLab DNA Sequence Analysis',
      sequenceName: sequenceName || validation.fastaHeader || 'Sequence Analysis',
      rawSequence: activeSequence,
      stats,
      transformations,
      selectedFrame,
    };
  };

  const handleExportPDF = () => {
    if (!isSeqValid) return;
    const reportData = buildReportData();
    const filename = `${(sequenceName || 'GeneLab_Analysis').replace(/\s+/g, '_')}_Report.pdf`;
    exportPDFReport(reportData, filename);
  };

  const handleExportTXT = () => {
    if (!isSeqValid) return;
    const reportData = buildReportData();
    const report = generatePlainTextReport(reportData);
    const filename = `${(sequenceName || 'GeneLab_Analysis').replace(/\s+/g, '_')}_Report.txt`;
    triggerFileDownload(report, filename, 'text/plain');
  };

  const handleExportJSON = () => {
    if (!isSeqValid) return;
    const jsonOutput = {
      platform: 'GeneLab Academic Bioinformatics Workbench',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      sequenceName: sequenceName || validation.fastaHeader || 'Sequence Analysis',
      sequenceLength: stats.totalLength,
      rawSequence: activeSequence,
      stats: {
        totalLength: stats.totalLength,
        unambiguousLength: stats.unambiguousLength,
        ambiguousLength: stats.ambiguousLength,
        counts: stats.counts,
        percentages: stats.percentages,
        gcContent: stats.gcContent,
        atContent: stats.atContent,
        molecularWeightEstimatedDa: stats.molecularWeightEstimatedDa,
      },
      transformations: transformations ? {
        complement: transformations.complement,
        reverse: transformations.reverse,
        reverseComplement: transformations.reverseComplement,
        transcribedRNA: transformations.transcribedRNA,
      } : null,
      disclaimer: 'For educational and instructional research use only. Predictions do not establish in vivo gene expression or clinical pathogenicity.',
    };

    const filename = `${(sequenceName || 'GeneLab_Analysis').replace(/\s+/g, '_')}_Data.json`;
    triggerFileDownload(JSON.stringify(jsonOutput, null, 2), filename, 'application/json');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySequence = () => {
    if (activeSequence) navigator.clipboard.writeText(activeSequence);
  };

  const handleCopyRevComp = () => {
    if (transformations?.reverseComplement) {
      navigator.clipboard.writeText(transformations.reverseComplement);
    }
  };

  const handleCopyProtein = () => {
    if (selectedFrame?.aminoAcidSequenceOne) {
      navigator.clipboard.writeText(selectedFrame.aminoAcidSequenceOne);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans text-xs">
      {/* Hidden File Picker Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".fasta,.fa,.fna,.txt,.seq"
        className="hidden"
      />

      {/* 1. Top Menu Bar */}
      <AppMenu
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenFilePicker={handleOpenFilePicker}
        onLoadPreset={handleLoadPreset}
        onExportPDF={handleExportPDF}
        onExportTXT={handleExportTXT}
        onExportJSON={handleExportJSON}
        onPrint={handlePrint}
        onClear={handleClear}
        onOpenCodonModal={() => setShowCodonModal(true)}
        onCopySequence={handleCopySequence}
        onCopyRevComp={handleCopyRevComp}
        onCopyProtein={handleCopyProtein}
        colorCodingEnabled={colorCodingEnabled}
        onToggleColorCoding={() => setColorCodingEnabled(!colorCodingEnabled)}
        showStatusBar={showStatusBar}
        onToggleStatusBar={() => setShowStatusBar(!showStatusBar)}
        hasSequence={isSeqValid}
      />

      {/* 2. Compact Application Toolbar */}
      <Toolbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenFilePicker={handleOpenFilePicker}
        onLoadPreset={handleLoadPreset}
        onExportTXT={handleExportTXT}
        onExportPDF={handleExportPDF}
        onPrint={handlePrint}
        onClear={handleClear}
        hasSequence={isSeqValid}
        sequenceName={sequenceName}
        sequenceLength={stats.totalLength}
      />

      {/* 3. Main Workspace with Sidebar and Content Area */}
      <div className="flex-1 flex flex-col md:flex-row min-w-0">
        {/* Left Navigation Panel */}
        <ToolNavigation
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          hasSequence={isSeqValid}
          sequenceName={sequenceName}
          stats={stats}
          onClear={handleClear}
        />

        {/* Central Workspace Area */}
        <main className="flex-1 p-4 md:p-6 bg-slate-100 overflow-y-auto">
          {currentTab === 'analyzer' && (
            <AnalyzerView
              rawSequence={rawSequence}
              setRawSequence={setRawSequence}
              sequenceName={sequenceName}
              setSequenceName={setSequenceName}
            />
          )}

          {currentTab === 'translation' && (
            <TranslationView
              sequence={activeSequence}
              onLoadPreset={handleLoadPreset}
              onNavigate={handleNavigate}
            />
          )}

          {currentTab === 'comparison' && (
            <ComparisonView />
          )}

          {currentTab === 'orf' && (
            <OrfView
              sequence={activeSequence}
              onLoadPreset={handleLoadPreset}
              onNavigate={handleNavigate}
            />
          )}

          {currentTab === 'genes' && (
            <GeneExplorer
              initialQuery={explorerQuery || 'HBB'}
              onLoadSequence={handleLoadSequence}
              onNavigate={handleNavigate}
            />
          )}

          {currentTab === 'proteins' && (
            <ProteinStructureExplorer
              initialQuery={explorerQuery || 'P68871'}
              onNavigate={handleNavigate}
              onLoadSequence={handleLoadSequence}
            />
          )}

          {currentTab === 'literature' && (
            <LiteratureExplorer
              initialQuery={explorerQuery || 'sickle cell anemia HBB'}
              onNavigate={handleNavigate}
            />
          )}

          {currentTab === 'compounds' && (
            <CompoundExplorer
              initialQuery={explorerQuery || 'Aspirin'}
              onNavigate={handleNavigate}
            />
          )}

          {currentTab === 'pathways' && (
            <PathwayExplorer
              initialQuery={explorerQuery || 'TP53'}
              onNavigate={handleNavigate}
            />
          )}

          {currentTab === 'learning' && (
            <LearningCenterView
              onNavigate={handleNavigate}
              onLoadPreset={handleLoadPreset}
            />
          )}

          {currentTab === 'about' && (
            <AboutView />
          )}
        </main>
      </div>

      {/* 4. Bottom Status Bar */}
      {showStatusBar && (
        <StatusBar
          currentTab={currentTab}
          hasSequence={isSeqValid}
          sequenceName={sequenceName}
          stats={stats}
          isValid={validation.isValid}
        />
      )}

      {/* Codon Modal */}
      <CodonTableModal
        isOpen={showCodonModal}
        onClose={() => setShowCodonModal(false)}
      />
    </div>
  );
};

export default App;
