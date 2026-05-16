import React, { useState } from 'react';
import { ChevronLeft, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

interface DeliveryProps {
  onBack: () => void;
}

export function Delivery({ onBack }: DeliveryProps) {
  const [step, setStep] = useState(1);

  return (
    <div className="flex flex-col flex-1 bg-gray-50 h-full">
      {/* Header */}
      <div className="bg-[#0B5C36] px-4 pt-12 md:pt-8 pb-6 flex items-center justify-between text-white shrink-0 shadow-md">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors md:hidden"><ChevronLeft size={24} /></button>
        <div className="hidden md:block p-2"><ChevronLeft size={24} className="opacity-0" /></div>
        <h1 className="text-xl md:text-2xl font-bold">Entrega de EPI</h1>
        <div className="w-8"></div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden max-w-3xl mx-auto w-full">
        {/* Stepper */}
        <div className="bg-white px-6 md:px-12 py-8 border-b border-gray-200 shrink-0 shadow-sm md:rounded-b-3xl">
          <div className="flex justify-between relative max-w-lg mx-auto w-full">
            <div className="absolute top-5 left-0 w-full h-[2px] bg-gray-200 -z-10"></div>
            
            <div className="flex flex-col items-center gap-3">
              <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm md:text-base font-bold bg-[#0B5C36] text-white shadow-md ring-4 ring-green-50")}>
                1
              </div>
              <span className="text-xs md:text-sm font-bold text-[#0B5C36]">Funcionário</span>
            </div>
            
            <div className="flex flex-col items-center gap-3">
              <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm md:text-base font-bold transition-colors", step >= 2 ? "bg-[#0B5C36] text-white shadow-md ring-4 ring-green-50" : "bg-white border-2 border-gray-200 text-gray-400")}>
                2
              </div>
              <span className={cn("text-xs md:text-sm font-bold transition-colors", step >= 2 ? "text-[#0B5C36]" : "text-gray-400")}>EPI</span>
            </div>
            
            <div className="flex flex-col items-center gap-3">
              <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm md:text-base font-bold transition-colors", step >= 3 ? "bg-[#0B5C36] text-white shadow-md ring-4 ring-green-50" : "bg-white border-2 border-gray-200 text-gray-400")}>
                3
              </div>
              <span className={cn("text-xs md:text-sm font-bold transition-colors", step >= 3 ? "text-[#0B5C36]" : "text-gray-400")}>Resumo</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 md:p-8 pb-safe items-center flex flex-col">
          <div className="w-full max-w-lg">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-8 mt-4">Selecionar Funcionário</h2>
            
            <div className="space-y-6">
              <div className="space-y-2.5">
                <label className="text-sm md:text-base font-semibold text-gray-700">Selecione o funcionário</label>
                <select defaultValue="" className="w-full bg-white border border-gray-200 rounded-2xl p-4 md:p-5 text-base md:text-lg text-gray-800 outline-none focus:ring-2 focus:ring-[#0B5C36] focus:border-transparent appearance-none shadow-sm hover:border-gray-300 transition-colors cursor-pointer">
                  <option value="" disabled className="text-gray-400">Clique para selecionar</option>
                  <option>Carlos Alberto</option>
                  <option>Mariana Silva</option>
                </select>
              </div>

              <div className="space-y-2.5">
                <label className="text-sm md:text-base font-semibold text-gray-700">Data da entrega</label>
                <div className="relative">
                  <input type="date" className="w-full bg-white border border-gray-200 rounded-2xl p-4 md:p-5 text-base md:text-lg text-gray-800 outline-none focus:ring-2 focus:ring-[#0B5C36] focus:border-transparent appearance-none shadow-sm hover:border-gray-300 transition-colors" defaultValue="2024-05-18" />
                  <Calendar size={24} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-sm md:text-base font-semibold text-gray-700">Observações</label>
                <textarea 
                  rows={4}
                  placeholder="Digite uma observação (opcional)" 
                  className="w-full bg-white border border-gray-200 rounded-2xl p-4 md:p-5 text-base text-gray-800 outline-none focus:ring-2 focus:ring-[#0B5C36] focus:border-transparent resize-none shadow-sm hover:border-gray-300 transition-colors"
                ></textarea>
                <p className="text-right text-xs md:text-sm font-medium text-gray-400">0/200 caracteres</p>
              </div>
            </div>

            <button 
              onClick={() => setStep(prev => Math.min(prev + 1, 3))}
              className="w-full bg-[#0B5C36] text-white font-bold text-lg rounded-2xl py-4 md:py-5 mt-10 shadow-lg hover:bg-[#094d2d] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
            >
              Avançar para Seleção de EPI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
