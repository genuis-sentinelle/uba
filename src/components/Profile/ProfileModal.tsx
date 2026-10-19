import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { X, Lock, CheckCircle, AlertTriangle, LogOut } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUser, changePassword, logout } = useAuth();
  const { addLog } = useData();

  if (!isOpen || !currentUser) return null;

  const [nomComplet, setNomComplet] = useState(currentUser.nomComplet);
  const [titre, setTitre] = useState(currentUser.titre || '');
  const [ancienMdp, setAncienMdp] = useState('');
  const [nouveauMdp, setNouveauMdp] = useState('');
  const [confirmerMdp, setConfirmerMdp] = useState('');

  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomComplet.trim()) {
      setMessage({ type: 'error', text: 'Le nom complet est obligatoire.' });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Mise à jour via procédure stockée sécurisée sur profiles
      if (isSupabaseConfigured && supabase) {
        const { error: rpcErr } = await supabase.rpc('update_my_profile', {
          p_nom_complet: nomComplet.trim(),
          p_titre: titre.trim()
        });

        if (rpcErr) {
          setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du profil : ' + rpcErr.message });
          return;
        }
      }

      // 2. Mise à jour du state AuthContext
      await updateUser({
        ...currentUser,
        nomComplet: nomComplet.trim(),
        titre: titre.trim()
      });

      setMessage({ type: 'success', text: 'Profil mis à jour avec succès sur le serveur.' });
      addLog('Profil', `Mise à jour du profil de ${nomComplet.trim()}`, 'utilisateur');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de la mise à jour.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
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

    setIsSubmitting(true);
    try {
      // Vérification serveur de l'ancien mot de passe via Supabase Auth
      if (isSupabaseConfigured && supabase) {
        const { error: verifyErr } = await supabase.auth.signInWithPassword({
          email: currentUser.email,
          password: ancienMdp
        });

        if (verifyErr) {
          setMessage({ type: 'error', text: 'L\'ancien mot de passe saisi est incorrect.' });
          return;
        }
      }

      const res = await changePassword(nouveauMdp);
      if (res.success) {
        setMessage({ type: 'success', text: 'Mot de passe mis à jour avec succès sur le serveur.' });
        setAncienMdp('');
        setNouveauMdp('');
        setConfirmerMdp('');
        addLog('Sécurité', `Changement de mot de passe pour ${currentUser.nomComplet}`, 'utilisateur');
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de la mise à jour du mot de passe.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--r-md)',
              backgroundColor: 'var(--brand)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.2rem'
            }}>
              {currentUser.nomComplet.charAt(0)}
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>
                {currentUser.nomComplet}
              </h2>
              <div className="text-muted text-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <span className="badge badge-red">
                  {currentUser.role === 'super_admin' ? 'Super Admin (Chef)' : currentUser.role === 'admin' ? 'Administrateur' : 'Archiviste'}
                </span>
                <span>·</span>
                <span>{currentUser.email}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Feedback message */}
        {message && (
          <div
            className="card"
            style={{
              padding: '10px 14px',
              marginBottom: '16px',
              backgroundColor: message.type === 'success' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 69, 58, 0.1)',
              borderColor: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {message.type === 'success' ? <CheckCircle size={16} color="var(--success)" /> : <AlertTriangle size={16} color="var(--danger)" />}
            <span style={{ fontSize: '0.875rem' }}>{message.text}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="row" style={{ borderBottom: '1px solid var(--line)', marginBottom: '18px', paddingBottom: '6px' }}>
          <button
            onClick={() => { setActiveTab('info'); setMessage(null); }}
            className={`btn btn-sm ${activeTab === 'info' ? 'btn-primary' : 'btn-ghost'}`}
          >
            Profil & Identité
          </button>
          <button
            onClick={() => { setActiveTab('password'); setMessage(null); }}
            className={`btn btn-sm ${activeTab === 'password' ? 'btn-primary' : 'btn-ghost'}`}
          >
            Sécurité & Mot de passe
          </button>
        </div>

        {/* Tab 1: Informations */}
        {activeTab === 'info' && (
          <form onSubmit={handleUpdateInfo}>
            <div className="form-group">
              <label className="form-label">Nom complet de l'agent</label>
              <input
                type="text"
                className="form-input"
                value={nomComplet}
                onChange={e => setNomComplet(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email professionnel (identifiant fixe)</label>
              <input
                type="text"
                className="form-input num"
                value={currentUser.email}
                readOnly
                style={{ backgroundColor: 'var(--surface-2)', opacity: 0.8 }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Fonction / Titre opérationnel</label>
              <input
                type="text"
                className="form-input"
                value={titre}
                onChange={e => setTitre(e.target.value)}
              />
            </div>

            <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => { logout(); onClose(); }}
                className="btn btn-ghost"
                style={{ color: 'var(--danger)' }}
              >
                <LogOut size={16} /> Déconnexion
              </button>
              <button type="submit" className="btn btn-primary">
                Enregistrer les modifications
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Mot de passe */}
        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label className="form-label">Mot de passe actuel</label>
              <input
                type="password"
                className="form-input"
                placeholder="Votre mot de passe actuel"
                value={ancienMdp}
                onChange={e => setAncienMdp(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nouveau mot de passe</label>
              <input
                type="password"
                className="form-input"
                placeholder="Au moins 4 caractères"
                value={nouveauMdp}
                onChange={e => setNouveauMdp(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                className="form-input"
                placeholder="Répétez le nouveau mot de passe"
                value={confirmerMdp}
                onChange={e => setConfirmerMdp(e.target.value)}
                required
              />
            </div>

            <div className="modal-actions">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Annuler
              </button>
              <button type="submit" className="btn btn-primary">
                <Lock size={15} /> Mettre à jour le mot de passe
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
