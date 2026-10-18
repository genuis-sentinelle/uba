import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Lock, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, UserPlus, User as UserIcon } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, users, hasSuperAdmin, createInitialSuperAdmin } = useAuth();
  const { addLog } = useData();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initial Super Admin setup states (si aucun compte n'existe)
  const [setupNom, setSetupNom] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupSuccess, setSetupSuccess] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Veuillez saisir votre nom d\'utilisateur ou adresse email.');
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
        setError(res.message || 'Identifiants incorrects ou compte inactif.');
      }
    } catch {
      setError('Une erreur est survenue lors de la tentative de connexion.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSetupSuccess('');

    if (!setupNom.trim()) {
      setError('Veuillez renseigner votre nom d\'utilisateur.');
      return;
    }
    if (!setupPassword) {
      setError('Veuillez saisir votre mot de passe.');
      return;
    }
    if (setupPassword.length < 4) {
      setError('Le mot de passe doit comporter au moins 4 caractères.');
      return;
    }

    setLoading(true);
    try {
      const res = await createInitialSuperAdmin({
        nomUtilisateur: setupNom.trim(),
        motDePasse: setupPassword
      });

      if (res.success) {
        setSetupSuccess(res.message);
        addLog('Initialisation Système', `Création du Super Administrateur : ${setupNom}`, 'auth');
      } else {
        setError(res.message);
      }
    } catch {
      setError('Erreur lors de la configuration du compte.');
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

        {/* CAS 1 : Configuration initiale Super Admin */}
        {!hasSuperAdmin ? (
          <div>
            <div
              className="card"
              style={{
                backgroundColor: 'var(--brand-tint)',
                borderColor: 'rgba(227, 30, 36, 0.3)',
                padding: '12px 14px',
                marginBottom: '20px',
                display: 'flex',
                gap: '10px'
              }}
            >
              <ShieldCheck size={20} color="var(--brand-hi)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div className="text-sm">
                <strong style={{ color: 'var(--text-1)', display: 'block', marginBottom: '2px' }}>
                  Configuration Initiale requise
                </strong>
                Créez le premier compte <strong>Super Administrateur</strong>. Par sécurité, l'accès public sera verrouillé dès sa création.
              </div>
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

            {setupSuccess && (
              <div
                className="card"
                style={{
                  backgroundColor: 'rgba(52, 199, 89, 0.12)',
                  borderColor: 'var(--success)',
                  padding: '10px 14px',
                  fontSize: '0.875rem',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--success)'
                }}
              >
                <CheckCircle2 size={18} />
                <span>{setupSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSetupSuperAdmin}>
              <div className="form-group">
                <label className="form-label">Nom d'utilisateur du Super Admin *</label>
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
                    className="form-input"
                    placeholder="Ex: chef.archives"
                    value={setupNom}
                    onChange={e => setSetupNom(e.target.value)}
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
                    name="new-password"
                    autoComplete="new-password"
                    className="form-input"
                    placeholder="Au moins 4 caractères"
                    value={setupPassword}
                    onChange={e => setSetupPassword(e.target.value)}
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
                style={{ marginTop: '8px' }}
              >
                <UserPlus size={18} /> {loading ? 'Configuration en cours...' : 'Initialiser le Super Admin'}
              </button>
            </form>
          </div>
        ) : (
          /* CAS 2 : Connexion sécurisée avec compte existant */
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
              <span className="text-muted">Accès contrôlé. Comptes administrés par le Chef d'équipe.</span>
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
                    placeholder="Ex: chef.archives ou email"
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
                <span>{loading ? 'Connexion en cours...' : 'Accéder à la plateforme'}</span>
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        )}

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
