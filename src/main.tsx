import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { initSentry, Sentry } from './services/sentry.ts';

// Initialize real-time error tracking
initSentry();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error }) => (
        <div className="min-h-screen bg-[#F7F7F5] text-[#14161A] flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white border border-[#E8E8E6] rounded-xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-[#F7F7F5] border border-[#E8E8E6] flex items-center justify-center mx-auto text-[#3652C4] font-bold text-lg">
              !
            </div>
            <div className="space-y-1.5">
              <h1 className="text-lg font-semibold text-[#14161A] tracking-tight">
                An unexpected error occurred
              </h1>
              <p className="text-xs text-[#8B8D91] leading-relaxed">
                Our automated telemetry team has been notified. Please refresh the page or return home.
              </p>
            </div>
            {Boolean(error) ? (
              <pre className="text-[11px] text-left p-3 rounded bg-[#F7F7F5] text-[#8B8D91] overflow-x-auto border border-[#E8E8E6]">
                {String(error)}
              </pre>
            ) : null}
            <button
              onClick={() => window.location.assign('/')}
              className="px-4 py-2 text-xs font-medium text-white bg-[#3652C4] hover:bg-[#2B42A4] rounded-lg transition-colors cursor-pointer"
            >
              Return Home
            </button>
          </div>
        </div>
      )}
    >
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>
);
