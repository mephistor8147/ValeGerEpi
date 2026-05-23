import React from "react";
import {
  ChevronLeft,
  PackageCheck,
  Clock,
  AlertTriangle,
  PackageMinus,
  Users,
  FileBarChart,
  ChevronRight,
} from "lucide-react";
import { cn } from "../lib/utils";

interface ReportsProps {
  onBack: () => void;
  onNavigateReport: (reportId: string) => void;
}

export function Reports({ onBack, onNavigateReport }: ReportsProps) {
  const reports = [
    {
      id: "entregas",
      title: "Relatório de Entregas",
      desc: "Veja todas as entregas realizadas",
      icon: PackageCheck,
      color: "text-[#FFA767]",
      bg: "bg-[#253B44]",
    },
    {
      id: "vencer",
      title: "EPIs a Vencer",
      desc: "EPIs que vencem em breve",
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-100",
    },
    {
      id: "vencidos",
      title: "EPIs Vencidos",
      desc: "EPIs com validade expirada",
      icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-100",
    },
    {
      id: "devolucoes",
      title: "Relatório de Devoluções",
      desc: "Veja todas as devoluções",
      icon: PackageMinus,
      color: "text-blue-500",
      bg: "bg-blue-100",
    },
    {
      id: "funcionario",
      title: "Relatório por Funcionário",
      desc: "Histórico de EPIs por funcionário",
      icon: Users,
      color: "text-purple-500",
      bg: "bg-purple-100",
    },
    {
      id: "estoque",
      title: "Relatório de Estoque",
      desc: "Estoque atual de EPIs",
      icon: FileBarChart,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
  ];

  return (
    <div className="flex flex-col flex-1 bg-[#0D2027] h-full">
      {/* Header */}
      <div className="bg-[#152A32] px-6 pt-16 md:pt-12 pb-10 rounded-b-[40px] md:rounded-b-[50px] relative overflow-hidden bg-cover bg-center bg-no-repeat flex items-center md:justify-between text-white shrink-0 shadow-md"
        style={{ backgroundImage: 'linear-gradient(to bottom right, rgba(13, 32, 39, 0.95) 0%, rgba(13, 32, 39, 0.7) 100%), url("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200&q=80")' }}>
        <button onClick={onBack} className="p-2 -ml-2 md:hidden">
          <ChevronLeft size={24} />
        </button>
        <div className="hidden md:block p-2 cursor-pointer" onClick={onBack}>
          <ChevronLeft size={24} />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[#FFA767] tracking-tight drop-shadow-sm flex-1 text-center md:flex-none md:ml-4">
          Relatórios
        </h1>
        <div className="w-8 md:hidden"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 md:p-8 bg-[#0D2027] pb-safe pb-24">
        <div className="max-w-5xl mx-auto w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => onNavigateReport(report.id)}
                className="w-full bg-[#152A32] p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm hover:shadow-md border border-[#253B44] flex flex-col items-start gap-4 text-left transition-all hover:border-[#FFA767]/20 group"
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className={cn(
                      "w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                      report.bg,
                      report.color,
                    )}
                  >
                    <report.icon size={28} />
                  </div>
                  <ChevronRight
                    size={24}
                    className="text-gray-300 group-hover:text-[#FFA767] transition-colors"
                  />
                </div>
                <div className="mt-2">
                  <h3 className="font-bold text-[#E2E8F0] text-lg md:text-xl mb-1">
                    {report.title}
                  </h3>
                  <p className="text-sm text-[#64748B] leading-snug">
                    {report.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
