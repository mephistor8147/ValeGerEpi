import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  PackagePlus,
  UserPlus,
  Building2,
  Briefcase,
  FolderPlus,
  ShieldCheck,
  Construction,
  LogOut,
  Sun,
  Moon,
  Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "../lib/utils";
import { auth } from "../lib/firebase";

interface SettingsProps {
  onBack: () => void;
  onNavigate: (view: string) => void;
}

export function Settings({ onBack, onNavigate }: SettingsProps) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(!document.documentElement.classList.contains("light"));
  }, []);

  const toggleTheme = () => {
    const isNowLight = isDark;
    if (isNowLight) {
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    }
    setIsDark(!isNowLight);
  };

  const settingsItems = [
    {
      id: "themeToggle",
      title: isDark ? "Modo Claro" : "Modo Escuro",
      desc: "Alternar tema do aplicativo",
      icon: isDark ? Sun : Moon,
      color: "text-amber-500",
      bg: "bg-amber-100",
      construction: false,
      action: toggleTheme,
    },
    {
      id: "appSettings",
      title: "Configurações do APP",
      desc: "Ajustes gerais do aplicativo",
      icon: SettingsIcon,
      color: "text-slate-500",
      bg: "bg-slate-100",
      construction: true,
    },
    {
      id: "epiManagement",
      title: "Cadastrar EPI",
      desc: "Adicionar novo equipamento ao catálogo",
      icon: PackagePlus,
      color: "text-blue-500",
      bg: "bg-blue-100",
      construction: false,
    },
    {
      id: "employeeManagement",
      title: "Cadastrar Funcionário",
      desc: "Registrar novo colaborador no sistema",
      icon: UserPlus,
      color: "text-[#FFA767]",
      bg: "bg-[#253B44]",
      construction: false,
    },
    {
      id: "siteManagement",
      title: "Cadastrar Obra",
      desc: "Adicionar novo local de trabalho",
      icon: Building2,
      color: "text-amber-500",
      bg: "bg-amber-100",
      construction: false,
    },
    {
      id: "roleManagement",
      title: "Cadastrar Cargo",
      desc: "Gerenciar cargos e funções",
      icon: Briefcase,
      color: "text-purple-500",
      bg: "bg-purple-100",
      construction: false,
    },
    {
      id: "binderCreation",
      title: "Criar Fichário",
      desc: "Organizar documentos e registros",
      icon: FolderPlus,
      color: "text-rose-500",
      bg: "bg-rose-100",
      construction: false,
    },
    {
      id: "adminManagement",
      title: "Gerenciar Administradores",
      desc: "Controle de acesso e permissões",
      icon: ShieldCheck,
      color: "text-indigo-500",
      bg: "bg-indigo-100",
      construction: false,
    },
  ];

  const handleLogout = () => {
    if (confirm("Deseja realmente sair do sistema?")) {
      auth.signOut();
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-[#0D2027] h-full">
      {/* Header */}
      <div className="bg-[#152A32] px-6 pt-16 md:pt-12 pb-10 rounded-b-[40px] md:rounded-b-[50px] relative overflow-hidden bg-cover bg-center bg-no-repeat flex items-center md:justify-between text-white shrink-0 shadow-md"
        style={{ backgroundImage: 'linear-gradient(to bottom right, rgba(13, 32, 39, 0.95) 0%, rgba(13, 32, 39, 0.7) 100%), url("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200&q=80")' }}>
        <button
          onClick={onBack}
          className="p-2 -ml-2 md:hidden hover:bg-[#0D2027] hover:text-[#FFA767] rounded-full transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="hidden md:block p-2">
          <ChevronLeft size={24} className="opacity-0" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[#FFA767] tracking-tight drop-shadow-sm flex-1 text-center md:flex-none">
          Configurações
        </h1>
        <div className="w-8 md:hidden"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 md:p-8 bg-[#0D2027] pb-safe pb-24">
        <div className="max-w-5xl mx-auto w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {settingsItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else if (!item.construction) {
                    onNavigate(item.id);
                  }
                }}
                className={cn(
                  "w-full bg-[#152A32] p-4 rounded-xl shadow-sm border border-[#253B44] flex flex-row items-center gap-4 text-left transition-all relative overflow-hidden",
                  item.construction
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:shadow-md hover:border-[#FFA767]/20 group hover:opacity-100",
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform",
                    !item.construction && "group-hover:scale-105",
                    item.bg,
                    item.color,
                  )}
                >
                  <item.icon size={24} />
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-[#F1F5F9] text-lg leading-tight truncate">
                      {item.title}
                    </h3>
                    {item.construction && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 rounded border border-amber-100 shrink-0">
                        <Construction size={10} className="text-amber-500" />
                        <span className="text-[10px] font-bold text-amber-600 uppercase hidden sm:inline">
                          Em constr.
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-[#64748B] leading-snug line-clamp-2">
                    {item.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-10 border-t border-[#2C4550] pt-8 flex justify-center">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              <LogOut size={20} />
              Sair do Sistema
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
