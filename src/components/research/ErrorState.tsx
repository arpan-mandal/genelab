import React from 'react';

interface ErrorStateProps {
  title?: string;
  error?: string | Error;
  onRetry?: () => void;
  provider?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'API Query Failed',
  error,
  onRetry,
  provider,
}) => {
  const errMsg = typeof error === 'string' ? error : error?.message || 'An unexpected error occurred.';

  return (
    <div className="border border-rose-300 bg-rose-50 p-4 text-xs font-sans text-rose-950 space-y-2">
      <div className="font-bold flex items-center justify-between">
        <span>{title} {provider ? `(${provider})` : ''}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="btn-classic text-rose-900 border-rose-400 bg-white hover:bg-rose-100 text-[11px] py-0.5"
          >
            Retry Request
          </button>
        )}
      </div>

      <p className="font-mono text-[11px] bg-white p-2 border border-rose-200 text-rose-900 break-words">
        {errMsg}
      </p>

      <p className="text-[11px] text-rose-800 leading-normal">
        Ensure your network connection is active. Public academic APIs (NCBI, Ensembl, UniProt) enforce request rate limits and may periodically throttle high-frequency queries.
      </p>
    </div>
  );
};
