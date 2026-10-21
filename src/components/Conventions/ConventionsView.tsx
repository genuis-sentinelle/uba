import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { formatNumber } from '../../utils/formatters';
import { selectMatrix, MatrixRow } from '../../domain/selectors';

const MATRIX_YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];

export const ConventionsView: React.FC = () => {
  const { agencies, dailyReports, cartons, synthesisReports } = useData();

  // Matrice calculée en temps réel d'après les données d'exploitation (ou repli sur la synthèse archivée)
  const matrixRows: MatrixRow[] = useMemo(() => {
    if (agencies.length === 0) {
      if (synthesisReports[0]?.matrice && synthesisReports[0].matrice.length > 0) {
        return synthesisReports[0].matrice;
      }
      return [];
    }
    return selectMatrix(agencies, dailyReports, MATRIX_YEARS, cartons);
  }, [agencies, dailyReports, cartons, synthesisReports]);

  // Calcul dynamique des indicateurs
  const { countT, countA, countO } = useMemo(() => {
    let t = 0;
    let a = 0;
    let o = 0;
    matrixRows.forEach(row => {
      MATRIX_YEARS.forEach(yr => {
        const val = row.annees[yr];
        if (val === 'T') t += 1;
        else if (val === 'A') a += 1;
        else if (val === 'O') o += 1;
      });
    });
    return { countT: t, countA: a, countO: o };
  }, [matrixRows]);

  if (matrixRows.length === 0) {
    return (
      <div style={{ padding: '28px 32px', maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '16px' }}>
          Conventions & Matrice de Suivi
        </h1>
        <div className="card" style={{ padding: '36px', textAlign: 'center', color: '#D9D9D9' }}>
          Aucune agence ou donnée d'inventaire enregistrée.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            Conventions & Matrice de Suivi
          </h1>
          <div style={{ fontSize: '0.92rem', color: '#D9D9D9', marginTop: '4px' }}>
            Exercices 2015 à 2024 · Traitement certifié UBA Congo · Synchronisation en direct
          </div>
        </div>

        {/* Legend — Noir Verre, Rouge, Blanc */}
        <div style={{
          display: 'flex',
          gap: '14px',
          alignItems: 'center',
          backgroundColor: 'rgba(14, 14, 14, 0.85)',
          padding: '8px 16px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--uba-red)' }}></span>
            T (Traité)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#D9D9D9' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--uba-anthracite)' }}></span>
            A (En attente)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--uba-red-bright)' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#8F1015' }}></span>
            O (Oublié)
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--uba-red)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#D9D9D9', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Exercices Traités (T)
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--uba-red-bright)', marginTop: '4px' }}>
            {formatNumber(countT)}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--uba-silver-dark)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#D9D9D9', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            En Attente (A)
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#FFFFFF', marginTop: '4px' }}>
            {formatNumber(countA)}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--uba-red-dark)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#D9D9D9', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Oubliés Probables (O)
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--uba-red-bright)', marginTop: '4px' }}>
            {countO} alerte{countO > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="uba-table-container">
        <table className="uba-table" style={{ textAlign: 'center' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', width: '180px' }}>Agence</th>
              {MATRIX_YEARS.map(y => (
                <th key={y} style={{ textAlign: 'center' }}>{y}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrixRows.map((row, idx) => (
              <tr key={idx}>
                <td style={{ textAlign: 'left', fontWeight: 700 }}>
                  <div style={{ color: '#FFFFFF', fontSize: '0.95rem' }}>{row.agenceNom}</div>
                  <div style={{ fontSize: '0.8rem', color: '#D9D9D9' }}>Code {row.code}</div>
                </td>
                {MATRIX_YEARS.map(y => {
                  const val = row.annees[y] || '—';

                  let bg = 'transparent';
                  let col = '#A6A6A6';
                  let border = 'transparent';

                  if (val === 'T') {
                    bg = 'var(--uba-red)';
                    col = '#FFFFFF';
                    border = 'var(--uba-red-bright)';
                  } else if (val === 'A') {
                    bg = 'var(--uba-anthracite)';
                    col = '#D9D9D9';
                    border = 'var(--uba-graphite)';
                  } else if (val === 'O') {
                    bg = 'rgba(227, 30, 36, 0.25)';
                    col = 'var(--uba-red-bright)';
                    border = 'var(--uba-red)';
                  }

                  return (
                    <td key={y}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '26px',
                        height: '26px',
                        borderRadius: '4px',
                        backgroundColor: bg,
                        color: col,
                        border: `1px solid ${border}`,
                        fontWeight: 900,
                        fontSize: '0.82rem'
                      }}>
                        {val}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
