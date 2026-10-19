import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  User as UserIcon,
  CheckCircle2,
  KeyRound,
  Mail
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, users, hasSuperAdmin, createInitialSuperAdmin } = useAuth();
  const { addLog } = useData();

  // Login form states
  const [identifiant, setIdentifiant] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initial Super Admin setup states (accessible UNE SEULE FOIS)
  const [setupNom, setSetupNom] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupPasswordConfirm, setSetupPasswordConfirm] = useState('');
  const [showSetupPassword, setShowSetupPassword] = useState(false);
  const [setupSuccess, setSetupSuccess] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!identifiant.trim()) {
      setError('Veuillez saisir votre identifiant ou adresse email.');
      return;
    }
    if (!password) {
      setError('Veuillez saisir votre mot de passe.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(identifiant.trim(), password);
      if (res.success) {
        const u = users.find(
          usr =>
            usr.email.toLowerCase() === identifiant.trim().toLowerCase() ||
            usr.nomComplet.toLowerCase() === identifiant.trim().toLowerCase()
        );
        addLog('Connexion', `Session ouverte : ${u?.nomComplet || identifiant} (${u?.role || 'agent'})`, 'auth');
      } else {
        setError(res.message || 'Identifiants invalides ou accès non autorisé.');
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

    const nom = setupNom.trim();
    if (!nom) {
      setError('Veuillez renseigner votre nom complet ou identifiant.');
      return;
    }
    if (!setupPassword) {
      setError('Veuillez saisir un mot de passe.');
      return;
    }
    if (setupPassword.length < 4) {
      setError('Le mot de passe doit comporter au moins 4 caractères.');
      return;
    }
    if (setupPassword !== setupPasswordConfirm) {
      setError('Les deux mots de passe saisis ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const res = await createInitialSuperAdmin({
        nomUtilisateur: nom,
        email: setupEmail.trim() || undefined,
        motDePasse: setupPassword
      });

      if (res.success) {
        setSetupSuccess(res.message);
        addLog('Initialisation Système', `Création initiale du Super Administrateur : ${nom}`, 'auth');
      } else {
        setError(res.message);
      }
    } catch {
      setError('Erreur lors de la configuration du compte Super Administrateur.');
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
          maxWidth: '460px',
          width: '100%',
          position: 'relative',
          zIndex: 2,
          padding: 'clamp(24px, 5vw, 36px)'
        }}
      >
        {/* En-tête officiel UBA */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
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
              marginBottom: '12px'
            }}
          />
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-1)', margin: '0 0 4px 0' }}>
            Portail Archives UBA
          </h1>
          <p className="text-muted text-sm">
            Supervision & Traitement (Sites Maya-Maya & Mazala)
          </p>
        </div>

        {/* ============================================================== */}
        {/* CAS 1 : INITIALISATION UNIQUE DU SUPER ADMINISTRATEUR          */}
        {/* ============================================================== */}
        {!hasSuperAdmin ? (
          <div>
            <div
              className="card"
              style={{
                backgroundColor: 'rgba(227, 30, 36, 0.08)',
                borderColor: 'var(--brand-hi)',
                padding: '12px 14px',
                marginBottom: '18px',
                display: 'flex',
                gap: '10px'
              }}
            >
              <KeyRound size={22} color="var(--brand-hi)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.82rem', lineHeight: 1.4 }}>
                <strong style={{ color: 'var(--text-1)', display: 'block', marginBottom: '3px' }}>
                  Configuration Initiale requise (Accès unique)
                </strong>
                Initialisez le premier compte <strong>Super Administrateur</strong>. Ce champ est accessible <strong>une seule fois</strong> : dès validation, la création publique sera définitivement verrouillée.
              </div>
            </div>

            {error && (
              <div
                className="card"
                style={{
                  backgroundColor: 'rgba(255, 69, 58, 0.12)',
                  borderColor: 'var(--danger)',
                  padding: '10px 14px',
                  fontSize: '0.85rem',
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
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--text-1)'
                }}
              >
                <CheckCircle2 size={18} color="var(--success)" />
                <span>{setupSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSetupSuperAdmin}>
              <div className="form-group">
                <label className="form-label">Nom complet ou Identifiant du Super Admin *</label>
                <div style={{ position: 'relative' }}>
                  <UserIcon
                    size={17}
                    className="text-muted"
                    style={{ position: 'absolute', left: '12px', top: '14px' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Chef d'équipe des Archives"
                    value={setupNom}
                    onChange={e => setSetupNom(e.target.value)}
                    required
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Adresse Email officielle UBA (optionnelle)</label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={17}
                    className="text-muted"
                    style={{ position: 'absolute', left: '12px', top: '14px' }}
                  />
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Ex: chef.archives@uba.cg"
                    value={setupEmail}
                    onChange={e => setSetupEmail(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '4px' }}>
                  Si laissée vide, une adresse @uba.cg sera automatiquement générée.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mot de passe maître *</label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={17}
                    className="text-muted"
                    style={{ position: 'absolute', left: '12px', top: '14px' }}
                  />
                  <input
                    type={showSetupPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Au moins 4 caractères"
                    value={setupPassword}
                    onChange={e => setSetupPassword(e.target.value)}
                    required
                    style={{ paddingLeft: '38px', paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSetupPassword(!showSetupPassword)}
                    className="btn btn-ghost btn-icon"
                    style={{ position: 'absolute', right: '4px', top: '2px' }}
                    aria-label="Afficher ou masquer mot de passe"
                  >
                    {showSetupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirmer le mot de passe maître *</label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={17}
                    className="text-muted"
                    style={{ position: 'absolute', left: '12px', top: '14px' }}
                  />
                  <input
                    type={showSetupPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Retapez le mot de passe"
                    value={setupPasswordConfirm}
                    onChange={e => setSetupPasswordConfirm(e.target.value)}
                    required
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
                style={{ marginTop: '16px' }}
              >
                <ShieldCheck size={18} />
                <span>{loading ? 'Création en cours...' : 'Initialiser le Super Admin & Verrouiller'}</span>
              </button>
            </form>
          </div>
        ) : (
          /* ============================================================== */
          /* CAS 2 : CONNEXION SÉCURISÉE CLASSIQUE (ACCÈS FERMÉ)            */
          /* ============================================================== */
          <div>
            <div
              className="card"
              style={{
                padding: '8px 12px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.8rem',
                backgroundColor: 'var(--surface-2)'
              }}
            >
              <ShieldCheck size={16} color="var(--brand-hi)" />
              <span className="text-muted">Accès strictement réservé au personnel habilité UBA Congo.</span>
            </div>

            {error && (
              <div
                className="card"
                style={{
                  backgroundColor: 'rgba(255, 69, 58, 0.12)',
                  borderColor: 'var(--danger)',
                  padding: '10px 14px',
                  fontSize: '0.85rem',
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
                <label className="form-label">Identifiant ou Email *</label>
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
                    value={identifiant}
                    onChange={e => setIdentifiant(e.target.value)}
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
                style={{ marginTop: '14px' }}
              >
                <span>{loading ? 'Vérification...' : 'Accéder à la plateforme'}</span>
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
