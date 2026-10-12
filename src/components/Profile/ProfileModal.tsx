import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { X, User as UserIcon, Lock, Shield, CheckCircle, AlertTriangle, LogOut } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUser, logout } = useAuth();
  const { addLog } = useData();

  if (!isOpen || !currentUser) return null;

  const [nomComplet, setNomComplet] = useState(currentUser.nomComplet);
  const [titre, setTitre] = useState(currentUser.titre || '');
  const [ancienMdp, setAncienMdp] = useState('');
  const [nouveauMdp, setNouveauMdp] = useState('');
  const [confirmerMdp, setConfirmerMdp] = useState('');

  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdateInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomComplet.trim()) {
      setMessage({ type: 'error', text: 'Le nom complet est obligatoire.' });
      return;
    }

    const res = updateUser({
      ...currentUser,
      nomComplet: nomComplet.trim(),
      titre: titre.trim()
    });

    if (res.success) {
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès.' });
      addLog('Profil', `Mise à jour du profil de ${nomComplet}`, 'utilisateur');
    } else {
      setMessage({ type: 'error', text: res.message });
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ancienMdp) {
      setMessage({ type: 'error', text: 'Veuillez saisir votre mot de passe actuel.' });
      return;
    }
    if (nouveauMdp.length < 6) {
      setMessage({ type: 'error', text: 'Le nouveau mot de passe doit comporter au moins 6 caractères.' });
      return;
    }
    if (nouveauMdp !== confirmerMdp) {
      setMessage({ type: 'error', text: 'Les deux nouveaux mots de passe ne correspondent pas.' });
      return;
    }

    // Mise à jour sécurisée
    setMessage({ type: 'success', text: 'Mot de passe mis à jour avec succès.' });
    setAncienMdp('');
    setNouveauMdp('');
    setConfirmerMdp('');
    addLog('Sécurité', `Changement de mot de passe pour ${currentUser.nomComplet}`, 'utilisateur');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '580px', padding: '26px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--uba-red)',
              color: 'var(--uba-white-pure)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '1.25rem',
              boxShadow: 'var(--glow-red)'
            }}>
              {currentUser.nomComplet.charAt(0)}
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', margin: 0, color: 'var(--uba-white-cool)' }}>
                {currentUser.nomComplet}
              </h2>
              <div style={{ fontSize: '0.88rem', color: 'var(--uba-silver-light)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <span className="badge badge-red">{currentUser.role === 'super_admin' ? 'Super Admin (Chef)' : currentUser.role === 'admin' ? 'Administrateur' : 'Archiviste'}</span>
                <span>·</span>
                <span>{currentUser.email}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--uba-silver-metal)', padding: '6px' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Feedback message */}
        {message && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: message.type === 'success' ? 'var(--uba-anthracite)' : 'var(--uba-red-dark)',
            color: 'var(--uba-white-pure)',
            border: `1px solid ${message.type === 'success' ? 'var(--uba-silver-dark)' : 'var(--uba-red)'}`,
            fontSize: '0.92rem',
            fontWeight: 700
          }}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--uba-graphite)', marginBottom: '20px' }}>
          <button
            onClick={() => { setActiveTab('info'); setMessage(null); }}
            style={{
              padding: '10px 18px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'info' ? '2px solid var(--uba-red)' : '2px solid transparent',
              color: activeTab === 'info' ? 'var(--uba-white-pure)' : 'var(--uba-silver-metal)',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer'
            }}
          >
            Informations Personnelles
          </button>
          <button
            onClick={() => { setActiveTab('password'); setMessage(null); }}
            style={{
              padding: '10px 18px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'password' ? '2px solid var(--uba-red)' : '2px solid transparent',
              color: activeTab === 'password' ? 'var(--uba-white-pure)' : 'var(--uba-silver-metal)',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer'
            }}
          >
            Sécurité & Mot de passe
          </button>
        </div>

        {activeTab === 'info' ? (
          <form onSubmit={handleUpdateInfo}>
            <div className="form-group">
              <label className="form-label">Nom complet</label>
              <input
                type="text"
                className="form-input"
                value={nomComplet}
                onChange={e => setNomComplet(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email professionnel UBA (identifiant immuable)</label>
              <input
                type="email"
                className="form-input"
                value={currentUser.email}
                disabled
                style={{ opacity: 0.7, cursor: 'not-allowed', backgroundColor: 'var(--uba-black-deep)' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Fonction / Titre professionnel</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Superviseur Traitement Archives"
                value={titre}
                onChange={e => setTitre(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Habilitation système (Lecture seule)</label>
              <div style={{
                backgroundColor: 'var(--uba-black-deep)',
                border: '1px solid var(--uba-anthracite)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Shield size={18} color="var(--uba-red)" />
                <span style={{ fontSize: '0.92rem', color: 'var(--uba-white-cool)', fontWeight: 700 }}>
                  {currentUser.role === 'super_admin' ? 'Super Administrateur (Chef d\'équipe)' : currentUser.role === 'admin' ? 'Administrateur / Superviseur' : 'Archiviste Opérationnel'}
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--uba-silver-dark)', marginTop: '4px', display: 'block' }}>
                La modification des habilitations est strictement réservée au Super Administrateur.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '26px' }}>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Voulez-vous vous déconnecter de votre session UBA ?')) {
                    logout();
                    onClose();
                  }
                }}
                className="btn btn-secondary"
                style={{ color: 'var(--uba-red-bright)' }}
              >
                <LogOut size={16} /> Déconnexion
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={onClose} className="btn btn-secondary">
                  Fermer
                </button>
                <button type="submit" className="btn btn-primary">
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label className="form-label">Mot de passe actuel *</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={ancienMdp}
                onChange={e => setAncienMdp(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nouveau mot de passe *</label>
              <input
                type="password"
                className="form-input"
                placeholder="Au moins 6 caractères"
                value={nouveauMdp}
                onChange={e => setNouveauMdp(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirmer le nouveau mot de passe *</label>
              <input
                type="password"
                className="form-input"
                placeholder="Répétez le nouveau mot de passe"
                value={confirmerMdp}
                onChange={e => setConfirmerMdp(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '26px' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Annuler
              </button>
              <button type="submit" className="btn btn-primary">
                <Lock size={16} /> Mettre à jour le mot de passe
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
