import React from 'react';
import { LayoutDashboard, FileText, CheckCircle2, Package, Menu, type LucideIcon } from 'lucide-react';
import type { NavigationTab } from './Sidebar';

interface BottomNavProps {
  current: NavigationTab;
  onSelect: (t: NavigationTab) => void;
  onMore: () => void;
}

const ITEMS: { id: NavigationTab; label: string; Icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Bord', Icon: LayoutDashboard },
  { id: 'daily-reports', label: 'Rapports', Icon: FileText },
  { id: 'attendance', label: 'Pointage', Icon: CheckCircle2 },
  { id: 'cartons', label: 'Cartons', Icon: Package }
];

export const BottomNav: React.FC<BottomNavProps> = ({ current, onSelect, onMore }) => {
  return (
    <nav className="bottom-nav mobile-only" aria-label="Navigation principale">
      {ITEMS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          aria-current={current === id ? 'page' : undefined}
        >
          <Icon size={20} />
          <span>{label}</span>
        </button>
      ))}
      <button type="button" onClick={onMore}>
        <Menu size={20} />
        <span>Menu</span>
      </button>
    </nav>
  );
};
