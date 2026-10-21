import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ARCHIVA ErrorBoundary] Uncaught runtime error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleCopy = async () => {
    const details = `ARCHIVA UBA - Diagnostic Erreur
Date : ${new Date().toISOString()}
Message : ${this.state.error?.message || 'Erreur inconnue'}
Stack :
${this.state.error?.stack || ''}
ComponentStack :
${this.state.errorInfo?.componentStack || ''}`;

    try {
      await navigator.clipboard.writeText(details);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    } catch {
      // Ignorer
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0c',
          color: '#f4f4f5',
          padding: '24px',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            backgroundColor: '#131316',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                flexShrink: 0
              }}>
                <AlertOctagon size={26} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                  Une interruption est survenue
                </h1>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: '#a1a1aa' }}>
                  L'application ARCHIVA UBA a rencontré une anomalie d'affichage.
                </p>
              </div>
            </div>

            <div style={{
              backgroundColor: '#0a0a0c',
              border: '1px solid #27272a',
              borderRadius: '8px',
              padding: '14px',
              marginBottom: '20px',
              fontFamily: 'monospace',
              fontSize: '0.82rem',
              color: '#f87171',
              maxHeight: '160px',
              overflowY: 'auto',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap'
            }}>
              {this.state.error?.message || 'Erreur JavaScript inattendue.'}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={16} />
                Recharger l'application
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#27272a',
                  color: '#f4f4f5',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Tenter de récupérer
              </button>

              <button
                type="button"
                onClick={this.handleCopy}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'transparent',
                  color: '#a1a1aa',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  marginLeft: 'auto'
                }}
              >
                {this.state.copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                {this.state.copied ? 'Copié' : 'Copier l\'erreur'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
