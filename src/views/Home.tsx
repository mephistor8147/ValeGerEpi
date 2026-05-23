import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  PackageCheck,
  PackageMinus,
  Package,
  LayoutList,
  Settings,
  GraduationCap,
  BellRing,
  Bell,
  ChevronRight,
  Clock,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";

interface HomeProps {
  onNavigate: (view: string) => void;
  adminUser?: any;
}

export function Home({ onNavigate, adminUser }: HomeProps) {
  const [stats, setStats] = useState({
    entregasEmDia: 0,
    aVencer: 0,
    vencidos: 0,
    funcionariosAtivos: 0,
  });

  const [alertas, setAlertas] = useState<
    { id: string; tipo: string; mensagem: string }[]
  >([]);

  useEffect(() => {
    // Listen to employees
    const unsubscribeFunc = onSnapshot(
      collection(db, "funcionarios"),
      (snapshot) => {
        setStats((prev) => ({ ...prev, funcionariosAtivos: snapshot.size }));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "funcionarios");
      },
    );

    // Listen to alertas
    const unsubscribeAlertas = onSnapshot(
      collection(db, "alertas"),
      (snapshot) => {
        const allAlerts = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as any,
        );
        const notResolved = allAlerts.filter((a) => !a.resolvido);

        setAlertas(notResolved);

        // Derive metrics from alertas if needed, or deliveries
        // For this MVP, we map aVencer and vencidos based on those alerts if they exist
        const vencidos = notResolved.filter((a) => a.tipo === "error").length;
        const aVencer = notResolved.filter((a) => a.tipo === "warning").length;

        setStats((prev) => ({
          ...prev,
          vencidos: vencidos || 0,
          aVencer: aVencer || 0,
        }));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "alertas");
      },
    );

    // Listen to entregas
    const unsubscribeEntregas = onSnapshot(
      collection(db, "entregas"),
      (snapshot) => {
        // Just a simple metric for delivered
        setStats((prev) => ({ ...prev, entregasEmDia: snapshot.size }));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "entregas");
      },
    );

    return () => {
      unsubscribeFunc();
      unsubscribeAlertas();
      unsubscribeEntregas();
    };
  }, []);

  return (
    <div className="flex flex-col flex-1 overflow-y-auto bg-[#0D2027] pb-6 w-full">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header Profile Section */}
        <div
          className="bg-[#152A32] md:rounded-3xl md:mt-8 md:mx-6 md:shadow-lg rounded-b-[40px] px-6 md:px-10 pt-12 md:pt-10 pb-10 flex flex-col relative overflow-hidden bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              'linear-gradient(to bottom right, rgba(13, 32, 39, 0.95) 0%, rgba(13, 32, 39, 0.7) 100%), url("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200&q=80")',
          }}
        >
          <div className="z-10 flex items-start justify-between">
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[#FFA767] border border-[#FFA767] rounded-full p-1">
                  <CheckCircle2 size={12} />
                </span>
                <span className="text-[#FFA767] text-xs font-bold tracking-widest uppercase">
                  Sistema de Gerenciamento
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-2 tracking-tight">
                Olá,
                <br />
                <span className="text-[#FFA767] uppercase">
                  {adminUser?.nomeFuncionario?.split(" ")[0] || "Carlos"}
                </span>
              </h1>
              <p className="text-gray-300 text-sm md:text-base font-medium mt-1">
                Bem-vindo ao sistema de gerenciamento de EPIs.
              </p>
            </div>
            {/* Mobile Admin Profile & Logout */}
            <div className="md:hidden flex items-center gap-2 bg-[#152A32]/80 rounded-full p-1.5 backdrop-blur-md border border-[#253B44]">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                {adminUser?.fotoUrl ? (
                  <img
                    src={adminUser.fotoUrl}
                    alt="Admin"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg">👤</span>
                )}
              </div>
              <button
                onClick={() => auth.signOut()}
                className="p-2 text-white hover:text-[#FFA767] hover:bg-[#0D2027] rounded-full transition-colors mr-1"
                title="Sair"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Resumo Geral */}
        <div className="px-5 md:px-6 mt-6 md:mt-8">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-lg md:text-xl font-bold text-[#E2E8F0]">
              Resumo geral
            </h2>
          </div>

          <div className="bg-[#152A32] rounded-xl md:rounded-2xl p-3 md:p-4 shadow-sm border border-[#253B44] grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="flex items-center text-left p-2 gap-3 bg-[#0D2027] rounded-xl border border-[#253B44]">
              <div className="bg-[#152A32] p-2 rounded-lg shrink-0">
                <CheckCircle2 size={24} className="text-[#FFA767]" />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-[10px] md:text-xs text-[#64748B] font-medium leading-tight mb-0.5">
                  Entregas em dia
                </p>
                <p className="text-lg md:text-xl font-bold text-[#FFA767] leading-none">
                  {stats.entregasEmDia}
                </p>
              </div>
            </div>

            <div className="flex items-center text-left p-2 gap-3 bg-[#0D2027] rounded-xl border border-[#253B44]">
              <div className="bg-amber-50 p-2 rounded-lg shrink-0">
                <AlertTriangle size={24} className="text-amber-500" />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-[10px] md:text-xs text-[#64748B] font-medium leading-tight mb-0.5">
                  A vencer
                </p>
                <p className="text-lg md:text-xl font-bold text-amber-500 leading-none">
                  {stats.aVencer}
                </p>
              </div>
            </div>

            <div className="flex items-center text-left p-2 gap-3 bg-[#0D2027] rounded-xl border border-[#253B44]">
              <div className="bg-red-50 p-2 rounded-lg shrink-0">
                <XCircle size={24} className="text-red-500" />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-[10px] md:text-xs text-[#64748B] font-medium leading-tight mb-0.5">
                  EPIs Vencidos
                </p>
                <p className="text-lg md:text-xl font-bold text-red-500 leading-none">
                  {stats.vencidos}
                </p>
              </div>
            </div>

            <div className="flex items-center text-left p-2 gap-3 bg-[#0D2027] rounded-xl border border-[#253B44]">
              <div className="bg-blue-50 p-2 rounded-lg shrink-0">
                <Users size={24} className="text-blue-500" />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-[10px] md:text-xs text-[#64748B] font-medium leading-tight mb-0.5">
                  Funcionários ativos
                </p>
                <p className="text-lg md:text-xl font-bold text-blue-600 leading-none">
                  {stats.funcionariosAtivos}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="px-5 md:px-6 mt-8 md:mt-10">
          <h2 className="text-lg md:text-xl font-bold text-[#E2E8F0] mb-4 md:mb-6">
            Ações rápidas
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-y-6 gap-x-2 md:gap-x-4">
            <ActionButton
              icon={PackageCheck}
              label="Entregar EPI"
              onClick={() => onNavigate("delivery")}
            />
            <ActionButton
              icon={PackageMinus}
              label="Devolver EPI"
              onClick={() => onNavigate("return")}
            />
            <ActionButton
              icon={RefreshCw}
              label="Trocar EPI"
              onClick={() => onNavigate("exchange")}
            />
            <ActionButton
              icon={Users}
              label="Funcionários"
              onClick={() => onNavigate("employees")}
            />
            <ActionButton
              icon={Package}
              label="EPIs"
              onClick={() => onNavigate("catalog")}
            />
            <ActionButton
              icon={LayoutList}
              label="Relatórios"
              onClick={() => onNavigate("reports")}
            />
            <ActionButton
              icon={BellRing}
              label="Alertas"
              onClick={() => onNavigate("alerts")}
            />
            <ActionButton
              icon={GraduationCap}
              label="Treinamentos"
              onClick={() => {}}
            />
            <ActionButton
              icon={Settings}
              label="Configurações"
              onClick={() => onNavigate("settings")}
            />
          </div>
        </div>

        {/* Alertas Recentes */}
        <div className="px-5 md:px-6 mt-8 md:mt-12 mb-8">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-lg md:text-xl font-bold text-[#E2E8F0]">
              Alertas recentes
            </h2>
            <button
              onClick={() => onNavigate("alerts")}
              className="text-sm md:text-base font-medium text-[#FFC27A] hover:text-[#FFA767]"
            >
              Ver todos
            </button>
          </div>

          <div className="bg-[#152A32] rounded-2xl md:rounded-3xl shadow-sm overflow-hidden border border-[#253B44]">
            {alertas.length === 0 ? (
              <div className="p-8 text-center text-[#64748B]">
                <CheckCircle2
                  size={48}
                  className="mx-auto text-[#FFA767] mb-4 opacity-50"
                />
                <p>Nenhum alerta no momento.</p>
              </div>
            ) : (
              alertas.map((alerta) => (
                <div
                  key={alerta.id}
                  onClick={() => onNavigate("alerts")}
                  className="p-5 md:p-6 flex items-center justify-between border-b border-gray-50 hover:bg-[#0D2027] cursor-pointer transition-colors last:border-b-0"
                >
                  <div className="flex items-center gap-4">
                    {alerta.tipo === "error" ? (
                      <AlertTriangle size={28} className="text-red-500" />
                    ) : alerta.tipo === "warning" ? (
                      <Clock size={28} className="text-amber-500" />
                    ) : (
                      <Bell size={28} className="text-blue-500" />
                    )}
                    <div>
                      <p className="font-bold text-[#E2E8F0] md:text-lg">
                        {alerta.mensagem}
                      </p>
                      <p className="text-xs md:text-sm text-[#64748B]">
                        {alerta.tipo === "error"
                          ? "Requer atenção imediata"
                          : "Verifique quando possível"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={24} className="text-[#475569]" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: any;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-start gap-2 md:gap-3 group"
    >
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-[#152A32] shadow-sm hover:shadow-md border border-[#253B44] flex items-center justify-center text-[#FFA767] mb-1 transition-all group-hover:scale-105 group-hover:bg-[#152A32]">
        <Icon className="w-7 h-7 md:w-8 md:h-8" strokeWidth={1.5} />
      </div>
      <span className="text-xs md:text-sm font-bold text-[#E2E8F0] text-center leading-tight px-1 group-hover:text-[#FFA767] transition-colors">
        {label}
      </span>
    </button>
  );
}
