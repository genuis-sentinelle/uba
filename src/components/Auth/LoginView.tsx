import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, KeyRound, UserPlus } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, users, hasSuperAdmin, createInitialSuperAdmin } = useAuth();
  const { addLog } = useData();

  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Initial Super Admin setup states (si aucun compte n'existe)
  const [setupNom, setSetupNom] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');
  const [setupSuccess, setSetupSuccess] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Veuillez saisir votre adresse email professionnelle.');
      return;
    }
    const success = login(email.trim(), password);
    if (success) {
      const u = users.find(usr => usr.email.toLowerCase() === email.trim().toLowerCase());
      addLog('Connexion', `Session ouverte : ${u?.nomComplet} (${u?.role})`, 'auth');
    } else {
      setError('Identifiants non reconnus ou compte inactif. Vérifiez votre adresse email.');
    }
  };

  const handleSetupSuperAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSetupSuccess('');

    if (!setupNom.trim() || !setupEmail.trim()) {
      setError('Veuillez renseigner votre nom complet et votre adresse email.');
      return;
    }
    if (!setupEmail.includes('@')) {
      setError('Veuillez saisir une adresse email professionnelle valide.');
      return;
    }
    if (setupPassword.length < 6) {
      setError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }
    if (setupPassword !== setupConfirmPassword) {
      setError('Les mots de passe saisis ne correspondent pas.');
      return;
    }

    const res = createInitialSuperAdmin({
      nomComplet: setupNom.trim(),
      email: setupEmail.trim(),
      password: setupPassword
    });

    if (res.success) {
      setSetupSuccess(res.message);
      addLog('Initialisation Système', `Création du Super Administrateur : ${setupNom} (${setupEmail})`, 'auth');
    } else {
      setError(res.message);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        overflow: 'hidden',
        // Arrière-plan couvrant toute la page avec l'image officielle UBA
        backgroundImage: "url('/images/uba-app-background.png')",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: 'cover'
      }}
    >
      {/* Voile sombre & accent rouge UBA pour garantir une lisibilité et un contraste parfaits */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(16, 16, 16, 0.72) 0%, rgba(5, 5, 5, 0.92) 100%)',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* Carte centrale du portail */}
      <div
        style={{
          maxWidth: '460px',
          width: '100%',
          backgroundColor: 'rgba(16, 16, 16, 0.88)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(227, 30, 36, 0.18)',
          padding: '36px 32px',
          position: 'relative',
          zIndex: 2,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)'
        }}
      >
        {/* Logo officiel UBA */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img
            src="/images/uba-app-logo.png"
            alt="UBA Logo"
            style={{
              maxHeight: '54px',
              maxWidth: '240px',
              objectFit: 'contain',
              marginBottom: '14px'
            }}
          />
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--uba-white-cool)', margin: '0 0 6px 0' }}>
            Portail Archives UBA
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--uba-silver-metal)', margin: 0 }}>
            Supervision & Traitement (Sites Maya-Maya & Mazala)
          </p>
        </div>

        {/* CAS 1 : AUCUN SUPER ADMIN N'EXISTE ENCORE -> INITIALISATION UNIQUE */}
        {!hasSuperAdmin ? (
          <div>
            <div
              style={{
                backgroundColor: 'rgba(227, 30, 36, 0.12)',
                border: '1px solid var(--uba-red-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                marginBottom: '20px',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start'
              }}
            >
              <ShieldCheck size={22} color="var(--uba-red-bright)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.82rem', color: 'var(--uba-silver-light)', lineHeight: 1.45 }}>
                <strong style={{ color: 'var(--uba-white-pure)', display: 'block', marginBottom: '2px' }}>
                  Configuration Initiale requise (Étape unique)
                </strong>
                Aucun compte administrateur n'est encore configuré. Veuillez créer le compte <strong>Super Administrateur</strong>. Dès cette création, l'inscription publique sera <strong>automatiquement bloquée</strong>.
              </div>
            </div>

            {error && (
              <div
                style={{
                  backgroundColor: 'rgba(227, 30, 36, 0.15)',
                  border: '1px solid var(--uba-red)',
                  color: 'var(--uba-white-pure)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.86rem',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertTriangle size={18} color="var(--uba-red-bright)" />
                <span>{error}</span>
              </div>
            )}

            {setupSuccess && (
              <div
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid #10B981',
                  color: '#34D399',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.86rem',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <CheckCircle2 size={18} />
                <span>{setupSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSetupSuperAdmin}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '0.86rem', color: 'var(--uba-silver-light)' }}>
                  Nom complet du Super Administrateur *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Thony Obaki (Chef Archiviste)"
                  value={setupNom}
                  onChange={e => setSetupNom(e.target.value)}
                  required
                  style={{ height: '44px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '0.86rem', color: 'var(--uba-silver-light)' }}>
                  Adresse Email Professionnelle UBA *
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={17}
                    color="var(--uba-silver-dark)"
                    style={{ position: 'absolute', left: '12px', top: '13px' }}
                  />
                  <input
                    type="email"
                    className="form-input"
                    placeholder="thony.obaki@ubagroup.com"
                    value={setupEmail}
                    onChange={e => setSetupEmail(e.target.value)}
                    required
                    style={{ paddingLeft: '38px', height: '44px' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '0.86rem', color: 'var(--uba-silver-light)' }}>
                  Mot de passe principal *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={17}
                    color="var(--uba-silver-dark)"
                    style={{ position: 'absolute', left: '12px', top: '13px' }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Minimum 6 caractères"
                    value={setupPassword}
                    onChange={e => setSetupPassword(e.target.value)}
                    required
                    style={{ paddingLeft: '38px', paddingRight: '40px', height: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '12px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--uba-silver-dark)',
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '22px' }}>
                <label className="form-label" style={{ fontSize: '0.86rem', color: 'var(--uba-silver-light)' }}>
                  Confirmer le mot de passe *
                </label>
                <div style={{ position: 'relative' }}>
                  <KeyRound
                    size={17}
                    color="var(--uba-silver-dark)"
                    style={{ position: 'absolute', left: '12px', top: '13px' }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Confirmez votre mot de passe"
                    value={setupConfirmPassword}
                    onChange={e => setSetupConfirmPassword(e.target.value)}
                    required
                    style={{ paddingLeft: '38px', height: '44px' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  height: '46px',
                  fontSize: '0.96rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <UserPlus size={18} /> Créer le Super Administrateur & Verrouiller
              </button>
            </form>
          </div>
        ) : (
          /* CAS 2 : LE SUPER ADMIN EXISTE DÉJÀ -> ACCÈS CONNEXION UNIQUE (INSCRIPTION BLOQUÉE) */
          <div>
            {/* Badge de verrouillage d'inscription */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.78rem',
                color: 'var(--uba-silver-metal)'
              }}
            >
              <ShieldCheck size={16} color="var(--uba-red-bright)" />
              <span>Accès réservé. Les comptes sont délivrés par le Super Administrateur.</span>
            </div>

            {error && (
              <div
                style={{
                  backgroundColor: 'rgba(227, 30, 36, 0.15)',
                  border: '1px solid var(--uba-red)',
                  color: 'var(--uba-white-pure)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.86rem',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertTriangle size={18} color="var(--uba-red-bright)" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '0.88rem', color: 'var(--uba-silver-light)' }}>
                  Email Professionnel *
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={18}
                    color="var(--uba-silver-dark)"
                    style={{ position: 'absolute', left: '12px', top: '13px' }}
                  />
                  <input
                    type="email"
                    className="form-input"
                    placeholder="votre.nom@ubagroup.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    style={{ paddingLeft: '38px', height: '46px' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '22px' }}>
                <label className="form-label" style={{ fontSize: '0.88rem', color: 'var(--uba-silver-light)' }}>
                  Mot de passe *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={18}
                    color="var(--uba-silver-dark)"
                    style={{ position: 'absolute', left: '12px', top: '13px' }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Votre mot de passe"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{ paddingLeft: '38px', paddingRight: '40px', height: '46px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '13px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--uba-silver-dark)',
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  height: '46px',
                  fontSize: '0.98rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>Accéder à la plateforme</span>
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        )}

        {/* Footer officiel sécurisé */}
        <div
          style={{
            marginTop: '26px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
            fontSize: '0.74rem',
            color: 'var(--uba-silver-dark)'
          }}
        >
          <div>United Bank for Africa (UBA Congo) · Système d'Archivage Sécurisé</div>
          <div style={{ marginTop: '2px' }}>Direction des Opérations & Conformité Bancaire</div>
        </div>
      </div>
    </div>
  );
};
