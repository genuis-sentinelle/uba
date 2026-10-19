import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertTriangle, User as UserIcon } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, users } = useAuth();
  const { addLog } = useData();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Veuillez saisir votre nom d\'utilisateur ou adresse email.');
      return;
    }
    if (!password) {
      setError('Veuillez saisir votre mot de passe.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email.trim(), password);
      if (res.success) {
        const u = users.find(usr =>
          usr.email.toLowerCase() === email.trim().toLowerCase() ||
          usr.nomComplet.toLowerCase() === email.trim().toLowerCase()
        );
        addLog('Connexion', `Session ouverte : ${u?.nomComplet || email} (${u?.role || 'agent'})`, 'auth');
      } else {
        setError(res.message || 'Identifiants invalides ou accès non autorisé.');
      }
    } catch {
      setError('Une erreur est survenue lors de la tentative de connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(16px, 4vw, 32px)',
        paddingBottom: 'calc(clamp(16px, 4vw, 32px) + var(--safe-bottom))',
        backgroundColor: 'var(--bg)',
        backgroundImage: "url('/images/uba-app-background.png')",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: 'cover'
      }}
    >
      {/* Voile sombre & accent pour un contraste idéal */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(10, 10, 11, 0.78) 0%, rgba(5, 5, 5, 0.94) 100%)',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* Carte centrale moderne Apple / IA */}
      <div
        className="card ai-border ai-glow"
        style={{
          maxWidth: '440px',
          width: '100%',
          position: 'relative',
          zIndex: 2,
          padding: 'clamp(24px, 5vw, 36px)'
        }}
      >
        {/* En-tête officiel UBA */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img
            src="/images/uba-app-badge.png"
            alt="UBA ARCHIVA Logo"
            style={{
              height: '68px',
              width: '68px',
              borderRadius: '16px',
              objectFit: 'cover',
              border: '1px solid var(--line-strong)',
              boxShadow: 'var(--shadow-2)',
              marginBottom: '14px'
            }}
          />
          <h1 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-1)', margin: '0 0 4px 0' }}>
            Portail Archives UBA
          </h1>
          <p className="text-muted text-sm">
            Supervision & Traitement (Sites Maya-Maya & Mazala)
          </p>
        </div>

        {/* Connexion sécurisée 100% serveur */}
        <div>
          <div
            className="card"
            style={{
              padding: '8px 12px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.8rem',
              backgroundColor: 'var(--surface-2)'
            }}
          >
            <ShieldCheck size={16} color="var(--brand-hi)" />
            <span className="text-muted">Accès sécurisé contrôlé par le serveur Supabase Auth.</span>
          </div>

          {error && (
            <div
              className="card"
              style={{
                backgroundColor: 'rgba(255, 69, 58, 0.12)',
                borderColor: 'var(--danger)',
                padding: '10px 14px',
                fontSize: '0.875rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-1)'
              }}
            >
              <AlertTriangle size={18} color="var(--danger)" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">Nom d'utilisateur ou Email *</label>
              <div style={{ position: 'relative' }}>
                <UserIcon
                  size={17}
                  className="text-muted"
                  style={{ position: 'absolute', left: '12px', top: '14px' }}
                />
                <input
                  type="text"
                  name="username"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="form-input"
                  placeholder="Ex: chef.archives ou nom@uba.cg"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mot de passe *</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={17}
                  className="text-muted"
                  style={{ position: 'absolute', left: '12px', top: '14px' }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  className="form-input"
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ paddingLeft: '38px', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn btn-ghost btn-icon"
                  style={{ position: 'absolute', right: '4px', top: '2px' }}
                  aria-label="Afficher ou masquer mot de passe"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
              style={{ marginTop: '12px' }}
            >
              <span>{loading ? 'Vérification serveur...' : 'Accéder à la plateforme'}</span>
              <ArrowRight size={18} />
            </button>
          </form>
        </div>

        {/* Footer officiel */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid var(--line)',
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'var(--text-3)'
          }}
        >
          <div>United Bank for Africa (UBA Congo) · Gestion des Archives</div>
          <div style={{ marginTop: '2px' }}>Direction des Opérations & Conformité Bancaire</div>
        </div>
      </div>
    </div>
  );
};
