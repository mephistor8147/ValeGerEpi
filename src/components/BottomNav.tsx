import React from 'react';
import { Home, PackageCheck, Package, LayoutList, LayoutGrid } from 'lucide-react';
import { cn } from '../lib/utils';

interface BottomNavProps {
  currentView: string;
  onChangeView: (view: string) => void;
}

export function BottomNav({ currentView, onChangeView }: BottomNavProps) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Início' },
    { id: 'delivery', icon: PackageCheck, label: 'Entregas' },
    { id: 'catalog', icon: Package, label: 'EPIs' },
    { id: 'reports', icon: LayoutList, label: 'Relatórios' },
    { id: 'dashboard', icon: LayoutGrid, label: 'Mais' }, // "Mais" in the design uses a different icon, but mapped here
  ];

  return (
    <div className="flex justify-between items-center bg-white border-t border-gray-100 px-6 py-3 pb-safe">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1",
              isActive ? "text-[#0B5C36]" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
