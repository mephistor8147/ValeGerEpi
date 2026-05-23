import React, { useState, useEffect } from "react";
import { ChevronLeft, Printer, CheckCircle2 } from "lucide-react";
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { db } from "../lib/firebase";

interface BinderViewerProps {
  employeeId: string;
  onBack: () => void;
}

interface BinderEntry {
  id: string;
  codigo: string;
  uni: string;
  ca: string;
  dataEntrega: string;
  dataDevolucao: string;
}

export function BinderViewer({ employeeId, onBack }: BinderViewerProps) {
  const [employee, setEmployee] = useState<any>(null);
  const [entries, setEntries] = useState<BinderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubEmployee: () => void;
    let unsubEntries: () => void;

    const loadData = async () => {
      setLoading(true);
      try {
        // Obter cargos e obras
        const cargosSnap = await getDocs(collection(db, "cargos"));
        const cargos = cargosSnap.docs.reduce(
          (acc, d) => ({ ...acc, [d.id]: d.data().titulo }),
          {} as Record<string, string>,
        );

        const obrasSnap = await getDocs(collection(db, "obras"));
        const obras = obrasSnap.docs.reduce(
          (acc, d) => ({ ...acc, [d.id]: d.data().nome }),
          {} as Record<string, string>,
        );

        unsubEmployee = onSnapshot(
          doc(db, "funcionarios", employeeId),
          (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              setEmployee({
                nome: data.nome || "-",
                matricula: data.matricula || "-",
                cargo: cargos[data.cargoId] || "N/A",
                obra: obras[data.obraId] || "N/A",
                camisa: data.camisa || "-",
                calca: data.calca || "-",
                bota: data.bota || "-",
              });
            }
            setLoading(false);
          },
        );

        const q = query(
          collection(db, "entregas"),
          where("funcionarioId", "==", employeeId),
          orderBy("createdAt", "desc"),
        );

        unsubEntries = onSnapshot(q, (snap) => {
          const data = snap.docs.map((d) => {
            const ent = d.data();
            return {
              id: d.id,
              codigo: ent.codigoEpi || "",
              uni: String(ent.quantidade || 1),
              ca: ent.ca || "",
              dataEntrega: ent.dataEntrega || "",
              dataDevolucao: ent.dataDevolucao || "",
            };
          });
          setEntries(data);
        });
      } catch (err) {
        console.error("Erro ao carregar fichário:", err);
        setLoading(false);
      }
    };

    loadData();

    return () => {
      if (unsubEmployee) unsubEmployee();
      if (unsubEntries) unsubEntries();
    };
  }, [employeeId]);

  if (loading) {
    return (
      <div className="flex flex-col flex-1 bg-[#0D2027] h-full">
        <div className="bg-[#152A32] px-6 pt-16 md:pt-12 pb-10 rounded-b-[40px] md:rounded-b-[50px] relative overflow-hidden bg-cover bg-center bg-no-repeat flex items-center justify-between text-white shrink-0 shadow-md"
        style={{ backgroundImage: 'linear-gradient(to bottom right, rgba(13, 32, 39, 0.95) 0%, rgba(13, 32, 39, 0.7) 100%), url("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200&q=80")' }}>
          <button onClick={onBack} className="p-2 -ml-2">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Visualizar Fichário</h1>
          <div className="w-8"></div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#FFA767] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-[#0D2027] h-full">
      {/* Header */}
      <div className="bg-[#152A32] px-6 pt-16 md:pt-12 pb-10 rounded-b-[40px] md:rounded-b-[50px] relative overflow-hidden bg-cover bg-center bg-no-repeat flex items-center justify-between text-white shrink-0 shadow-md print:hidden"
        style={{ backgroundImage: 'linear-gradient(to bottom right, rgba(13, 32, 39, 0.95) 0%, rgba(13, 32, 39, 0.7) 100%), url("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200&q=80")' }}>
        <button
          onClick={onBack}
          className="p-2 -ml-2 hover:bg-[#0D2027] hover:text-[#FFA767] rounded-full transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-3xl md:text-4xl font-bold text-[#FFA767] tracking-tight drop-shadow-sm">Visualizar Fichário</h1>
        <div className="w-8"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 print:p-0 print:overflow-visible">
        {/* Toolbar */}
        <div className="flex justify-between items-center mb-6 max-w-[800px] mx-auto print:hidden">
          <div className="flex items-center gap-2 text-[#FFA767] font-semibold text-sm">
            <CheckCircle2 size={18} />
            Pronto para impressão
          </div>
          <button
            onClick={() => window.print()}
            className="bg-[#152A32] border border-[#2C4550] text-[#CBD5E1] px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-[#0D2027] flex items-center gap-2"
          >
            <Printer size={18} />
            <span className="hidden sm:inline">Imprimir Fichário</span>
          </button>
        </div>

        {/* A4 Document Preview */}
        <div className="bg-[#152A32] w-full max-w-[800px] mx-auto shadow-xl border border-[#2C4550] p-6 sm:p-10 text-[10px] sm:text-xs text-black font-sans relative print:shadow-none print:border-none print:m-0 print:max-w-none print:w-full print:p-0">
          {/* Doc Header */}
          <div className="flex flex-col sm:flex-row border-2 border-black w-full mb-4">
            <div className="sm:w-1/3 border-b-2 sm:border-b-0 sm:border-r-2 border-black p-4 flex items-center justify-center font-bold text-lg sm:text-xl uppercase tracking-tighter text-center">
              Logo Empresa
            </div>
            <div className="sm:w-2/3 p-4 flex items-center justify-center font-bold text-sm sm:text-lg text-center uppercase">
              Controle de Equipamento de Proteção Individual
            </div>
          </div>

          {/* Employee Info */}
          <div className="border-2 border-black border-b-0 w-full flex flex-col">
            <div className="flex border-b-2 border-black min-h-[32px]">
              <div className="w-2/3 sm:w-3/4 border-r-2 border-black px-2 py-1 flex items-start">
                <span className="font-bold mr-2">Nome do Colaborador:</span>
                <span className="font-medium">{employee?.nome}</span>
              </div>
              <div className="w-1/3 sm:w-1/4 px-2 py-1 flex items-start">
                <span className="font-bold mr-2">Matrícula Nº:</span>
                <span className="font-medium">{employee?.matricula}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row border-b-2 border-black">
              <div className="flex border-b-2 sm:border-b-0 border-black sm:w-2/3 sm:border-r-2">
                <div className="w-1/2 border-r-2 border-black px-2 py-1 flex items-start min-h-[32px]">
                  <span className="font-bold mr-2">Função inicial:</span>
                  <span className="font-medium">{employee?.cargo}</span>
                </div>
                <div className="w-1/2 px-2 py-1 flex items-start min-h-[32px]">
                  <span className="font-bold mr-2">Calça Nº:</span>
                  <span className="font-medium">{employee?.calca}</span>
                </div>
              </div>
              <div className="flex w-full sm:w-1/3">
                <div className="w-1/2 border-r-2 border-black px-2 py-1 flex items-start min-h-[32px]">
                  <span className="font-bold mr-2">Camisa Nº:</span>
                  <span className="font-medium">{employee?.camisa}</span>
                </div>
                <div className="w-1/2 px-2 py-1 flex items-start min-h-[32px]">
                  <span className="font-bold mr-2">Calçado Nº:</span>
                  <span className="font-medium">{employee?.bota}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row border-b-2 border-black min-h-[32px]">
              <div className="sm:w-2/3 border-b-2 sm:border-b-0 sm:border-r-2 border-black px-2 py-1 flex items-start">
                <span className="font-bold mr-2">
                  Função pós promoção (quando aplicável):
                </span>
              </div>
              <div className="sm:w-1/3 px-2 py-1 flex items-start">
                <span className="font-bold mr-2">Data da promoção:</span>
              </div>
            </div>
          </div>

          {/* Termo */}
          <div className="border-2 border-t-0 border-black p-3 mb-4 text-justify leading-relaxed">
            <p className="mb-2">
              Declaro para os devidos efeitos legais, que recebi o equipamentos
              de proteção individual relacionados no abaixo e no verso, como
              também treinamento para o uso adequado e está ciente das
              obrigações constantes na NR - 06 da portaria 3.214/78, sub-item
              6.7 a saber:
              <br />
              A) Usá-lo apenas para a finalidade que se destina; B)
              Responsabilizar-se pela sua guarda e conservação;
              <br />
              C) Comunicar quaisquer alterações que o torne impróprio para o
              uso.
            </p>
            <p className="mb-6 mt-4">
              Declara, também, que se encontra ciente e coloca sua anuência as
              disposições do Art. 462 e 1º da CLT autorizando o desconto
              salarial proporcional ao custo da reparação do dano que
              eventualmente vier provocar no EPI em questão, uma vez que atesta
              tê-lo recebido em perfeitas condições, como também é conhecedor da
              disposição legal constante da NR - 01, Sub-item 1.8.1 de que
              constitui ato faltoso recusa de usar EPI, ora fornecido pela
              empresa, incorrendo nas penalidades previstas na lei.
            </p>

            <div className="flex flex-col sm:flex-row justify-around items-center sm:items-end pt-4 pb-2 mt-8 gap-8 sm:gap-0">
              <div className="flex flex-col items-center w-full sm:w-1/3">
                <div className="w-full border-b border-black text-center pb-1 h-6 text-[10px]">
                  {new Date().toLocaleDateString("pt-BR")}
                </div>
                <span className="mt-1 font-medium">
                  Data de abertura da ficha
                </span>
              </div>
              <div className="flex flex-col items-center w-full sm:w-1/2">
                <div className="w-full border-b border-black h-6"></div>
                <span className="mt-1 font-medium text-center">
                  Assinatura do Colaborador
                </span>
              </div>
            </div>
          </div>

          {/* Tabela de Códigos (Mock) */}
          <div className="border-2 border-black mb-4 flex flex-col hidden sm:flex">
            <div className="border-b-2 border-black text-center font-bold py-1 bg-gray-100 uppercase">
              Código dos EPI's
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-2 gap-y-1 p-2 font-medium text-[9px] sm:text-[10px]">
              <div>01 – Avental R. Couro</div>
              <div>10 – Luva de Vaqueta</div>
              <div>19 – Óculos Seg Escuro</div>
              <div>02 – Avental PVC</div>
              <div>11 – Luva borracha</div>
              <div>20 – P. Auric. Concha</div>
              <div>03 – Bota Borracha</div>
              <div>12 – Luva de Malha</div>
              <div>21 – P. Auricular Plug</div>
              <div>04 – Bota de Couro</div>
              <div>13 – Luva P.V.C</div>
              <div>22 – Protetor Facial</div>
              <div>05 – Capacete</div>
              <div>14 – Luva Nitrilon</div>
              <div>23 – Respirador Descartável</div>
              <div>06 – Capa de Chuva</div>
              <div>15 – Luva Raspa C.C</div>
              <div>24 – Respirador Filtro</div>
              <div>07 – Cinto de Seg.</div>
              <div>16 – Luva R. Couro C.L</div>
              <div>25 – Touca Arábe</div>
              <div>08 – Calça</div>
              <div>17 – Máscara Solda</div>
              <div>26 – Trava-Queda</div>
              <div>09 – Camisa</div>
              <div>18 – Óculos Seg Incolor</div>
              <div>27 – Talabarte</div>
            </div>
          </div>

          {/* Tabela de Registros */}
          <div className="border-2 border-black w-full flex flex-col">
            <div className="flex border-b-2 border-black">
              <div className="w-1/3 sm:w-1/4 border-r-2 border-black p-2 flex items-center justify-center font-bold text-center bg-gray-100 uppercase text-[10px] sm:text-xs">
                Logo Empresa
              </div>
              <div className="w-2/3 sm:w-3/4 p-2 flex items-center justify-center font-bold text-center uppercase bg-gray-100 text-[10px] sm:text-xs text-black">
                Controle de Equipamento de Proteção Individual
              </div>
            </div>

            {/* Headers */}
            <div className="flex border-b-2 border-black bg-[#0D2027] font-bold items-center text-center">
              <div className="w-[15%] sm:w-[12%] py-2 border-r border-black text-[9px] sm:text-[10px]">
                CÓDIGO
              </div>
              <div className="hidden sm:block w-[12%] py-2 border-r border-black">
                UNI
              </div>
              <div className="w-[20%] sm:w-[15%] py-2 border-r border-black text-[9px] sm:text-[10px]">
                CA
              </div>
              <div className="w-[35%] sm:w-[31%] flex flex-col border-r border-black">
                <div className="border-b border-black py-0.5 text-[9px] sm:text-[10px]">
                  DATA
                </div>
                <div className="flex w-full">
                  <div className="w-1/2 border-r border-black py-0.5 text-[8px] sm:text-[10px]">
                    ENTREGA
                  </div>
                  <div className="w-1/2 py-0.5 text-[8px] sm:text-[10px]">
                    DEVOLUÇÃO
                  </div>
                </div>
              </div>
              <div className="w-[30%] py-2 text-[9px] sm:text-[10px]">
                ASSINATURA
              </div>
            </div>

            {/* Linhas */}
            {Array.from({ length: Math.max(entries.length + 3, 12) }).map(
              (_, i) => {
                const entry = entries[i];
                return (
                  <div
                    key={i}
                    className="flex border-b border-black last:border-b-0 min-h-[28px]"
                  >
                    <div className="w-[15%] sm:w-[12%] border-r border-black flex items-center justify-center font-medium overflow-hidden px-1">
                      {entry?.codigo || ""}
                    </div>
                    <div className="hidden sm:flex w-[12%] border-r border-black items-center justify-center font-medium">
                      {entry?.uni || ""}
                    </div>
                    <div className="w-[20%] sm:w-[15%] border-r border-black flex items-center justify-center font-medium px-1">
                      {entry?.ca || ""}
                    </div>
                    <div className="w-[17.5%] sm:w-[15.5%] border-r border-black flex items-center justify-center font-medium">
                      {entry?.dataEntrega || ""}
                    </div>
                    <div className="w-[17.5%] sm:w-[15.5%] border-r border-black flex items-center justify-center font-medium">
                      {entry?.dataDevolucao || ""}
                    </div>
                    <div className="w-[30%] flex items-center justify-center"></div>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
