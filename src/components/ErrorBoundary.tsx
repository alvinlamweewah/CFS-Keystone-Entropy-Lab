import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    message: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || 'An unexpected error occurred.',
    };
  };

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Application ErrorBoundary caught error:', error, errorInfo);
  }

  private renderQuotaHelp(rawMessage: string) {
    const isSpecificReadQuota = rawMessage.includes(
      "Quota exceeded for quota metric 'Free daily read units per project (free tier database)'",
    );
    const isGeneralQuota = rawMessage.includes('Quota exceeded.');

    if (!isSpecificReadQuota && !isGeneralQuota) return null;

    const upgradeUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data?openUpgradeDialog=true`;

    return (
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 space-y-2">
        <p>
          Firestore daily free-tier usage quota has been reached and resets automatically the next day.
          See the Spark plan Enterprise edition details at{' '}
          <a
            href="https://firebase.google.com/pricing#cloud-firestore"
            target="_blank"
            rel="noreferrer"
            className="underline text-emerald-600 dark:text-emerald-400"
          >
            Firebase Cloud Firestore Pricing
          </a>
          .
        </p>
        {isSpecificReadQuota && (
          <p>
            Project owners can review or upgrade database capacity directly in the{' '}
            <a
              href={upgradeUrl}
              target="_blank"
              rel="noreferrer"
              className="underline text-emerald-600 dark:text-emerald-400"
            >
              Firebase Console
            </a>
            .
          </p>
        )}
      </div>
    );
  }

  public render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    let cleanSummary = this.state.message;
    try {
      const parsed = JSON.parse(this.state.message) as { error?: string; operationType?: string; path?: string };
      if (parsed && parsed.error) {
        cleanSummary = `${parsed.error} (${parsed.operationType ?? 'op'} on ${parsed.path ?? 'collection'})`;
      }
    } catch {
      // Plain error string
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-slate-900 dark:text-slate-100">
        <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Data Synchronization Notice
            </h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 break-words">
            {cleanSummary}
          </p>
          {this.renderQuotaHelp(this.state.message)}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, message: '' })}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              Retry Application
            </button>
          </div>
        </div>
      </div>
    );
  }
}
