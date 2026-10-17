import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { vault } from '../../utils/vault';
import { Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, KeyRound, UserPlus, Check, User as UserIcon } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, users, hasSuperAdmin, createInitialSuperAdmin } = useAuth();
  const { addLog } = useData();

  // Login states with browser credential vault support
  const [email, setEmail] = useState(() => {
    const saved = vault.getSavedEmails();
    return saved.length > 0 ? saved[0] : '';
  });
  const [password, setPassword] = useState(() => {
    const saved = vault.getSavedEmails();
    return saved.length > 0 ? (vault.getPassword(saved[0]) || '') : '';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isPasswordAutofilled, setIsPasswordAutofilled] = useState(() => {
    const saved = vault.getSavedEmails();
    return saved.length > 0 && Boolean(vault.getPassword(saved[0]));
  });
  const [error, setError] = useState('');

  // When email changes, check if vault has a remembered password
  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail);
    const savedPass = vault.getPassword(newEmail);
    if (savedPass) {
      setPassword(savedPass);
      setIsPasswordAutofilled(true);
    } else {
      setIsPasswordAutofilled(false);
    }
  };

  // Initial Super Admin setup states (si aucun compte n'existe)
  const [setupNom, setSetupNom] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupSuccess, setSetupSuccess] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Veuillez saisir votre nom d\'utilisateur ou adresse email.');
      return;
    }
    const success = login(email.trim(), password);
    if (success) {
      if (rememberMe && password) {
        vault.savePassword(email.trim(), password, true);
      } else if (!rememberMe) {
        vault.removePassword(email.trim());
      }
      const u = users.find(usr => 
        usr.email.toLowerCase() === email.trim().toLowerCase() ||
        usr.nomComplet.toLowerCase() === email.trim().toLowerCase()
      );
      addLog('Connexion', `Session ouverte : ${u?.nomComplet} (${u?.role})`, 'auth');
    } else {
      setError('Identifiants non reconnus ou compte inactif. Vérifiez vos identifiants.');
    }
  };

  const handleSetupSuperAdmin = (e: React.FormEvent) => {
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

    const res = createInitialSuperAdmin({
      nomUtilisateur: setupNom.trim(),
      motDePasse: setupPassword
    });

    if (res.success) {
      if (setupPassword) {
        vault.savePassword(setupNom.trim(), setupPassword, true);
      }
      setSetupSuccess(res.message);
      addLog('Initialisation Système', `Création du Super Administrateur : ${setupNom}`, 'auth');
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
            src="/images/uba-app-badge.png"
            alt="UBA ARCHIVA Logo"
            style={{
              height: '72px',
              width: '72px',
              borderRadius: '16px',
              objectFit: 'cover',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7), 0 0 20px rgba(227, 30, 36, 0.25)',
              marginBottom: '16px'
            }}
          />
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Portail Archives UBA
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#D9D9D9', margin: 0 }}>
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
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '0.86rem', color: '#FFFFFF', fontWeight: 600 }}>
                  Nom d'utilisateur du Super Administrateur *
                </label>
                <div style={{ position: 'relative' }}>
                  <UserIcon
                    size={17}
                    color="var(--uba-silver-dark)"
                    style={{ position: 'absolute', left: '12px', top: '13px' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Créer votre nom d'utilisateur"
                    value={setupNom}
                    onChange={e => setSetupNom(e.target.value)}
                    required
                    style={{ paddingLeft: '38px', height: '44px' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '22px' }}>
                <label className="form-label" style={{ fontSize: '0.86rem', color: '#FFFFFF', fontWeight: 600 }}>
                  Mot de passe *
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
                    placeholder="Créer votre mot de passe"
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
                <UserPlus size={18} /> Créer le compte Super Administrateur
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

            <form onSubmit={handleLoginSubmit} autoComplete="on">
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '0.86rem', color: '#FFFFFF', fontWeight: 600 }}>
                  Nom d'utilisateur ou Email *
                </label>
                <div style={{ position: 'relative' }}>
                  <UserIcon
                    size={17}
                    color="var(--uba-silver-dark)"
                    style={{ position: 'absolute', left: '12px', top: '13px' }}
                  />
                  <input
                    type="text"
                    name="username"
                    autoComplete="username"
                    className="form-input"
                    placeholder="Entrez votre nom d'utilisateur ou email"
                    value={email}
                    onChange={e => handleEmailChange(e.target.value)}
                    required
                    style={{ paddingLeft: '38px', height: '44px' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ fontSize: '0.86rem', color: '#FFFFFF', fontWeight: 600, margin: 0 }}>
                    Mot de passe *
                  </label>
                  {isPasswordAutofilled && (
                    <span style={{ fontSize: '0.74rem', color: '#34D399', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <Check size={12} /> Mémorisé sur cet appareil
                    </span>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={17}
                    color="var(--uba-silver-dark)"
                    style={{ position: 'absolute', left: '12px', top: '13px' }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    className="form-input"
                    placeholder="Votre mot de passe"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      setIsPasswordAutofilled(false);
                    }}
                    required
                    style={{ paddingLeft: '38px', paddingRight: '40px', height: '44px' }}
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
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Option Se Souvenir de Moi / Mémoriser le mot de passe */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--uba-silver-light)', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={{ accentColor: 'var(--uba-red)', width: '15px', height: '15px', cursor: 'pointer' }}
                  />
                  <span>Mémoriser le mot de passe sur cet appareil</span>
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  height: '44px',
                  fontSize: '0.94rem',
                  fontWeight: 700,
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
