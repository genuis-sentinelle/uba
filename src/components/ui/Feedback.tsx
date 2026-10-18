import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';
export type ConfirmOpts = { title: string; message?: string; confirmLabel?: string; danger?: boolean };

interface FeedbackContextType {
  toast: (text: string, type?: ToastType) => void;
  confirm: (opts: ConfirmOpts) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextType | null>(null);

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Array<{ id: number; text: string; type: ToastType }>>([]);
  const [dlg, setDlg] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const idRef = useRef(0);

  const toast = useCallback((text: string, type: ToastType = 'info') => {
    const id = ++idRef.current;
    setToasts(t => [...t, { id, text, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  const confirm = useCallback((o: ConfirmOpts) =>
    new Promise<boolean>(resolve => setDlg({ ...o, resolve })), []);

  const close = (v: boolean) => {
    if (dlg) {
      dlg.resolve(v);
      setDlg(null);
    }
  };

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            {t.text}
          </div>
        ))}
      </div>
      {dlg && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => close(false)}>
          <div className="modal-content modal-content--sm" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{dlg.title}</h3>
            {dlg.message && <p className="text-muted" style={{ marginTop: 8, fontSize: '0.95rem' }}>{dlg.message}</p>}
            <div className="modal-actions" style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => close(false)}>Annuler</button>
              <button type="button" className={`btn ${dlg.danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => close(true)}>
                {dlg.confirmLabel ?? 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => {
  const c = useContext(FeedbackContext);
  if (!c) throw new Error('useFeedback must be used within FeedbackProvider');
  return c;
};
