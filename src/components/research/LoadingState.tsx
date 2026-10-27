import React from 'react';

interface LoadingStateProps {
  message?: string;
  provider?: string;
  source?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Querying database...',
  provider,
  source,
}) => {
  const displaySource = source || provider;

  return (
    <div className="border border-slate-300 bg-white p-6 text-center text-xs font-mono text-slate-700 space-y-2">
      <div className="inline-block animate-spin font-bold text-slate-900 text-sm">
        [—]
      </div>
      <div>{message}</div>
      {displaySource && (
        <div className="text-[11px] text-slate-500 font-sans">
          Endpoint: {displaySource} Public API
        </div>
      )}
    </div>
  );
};
