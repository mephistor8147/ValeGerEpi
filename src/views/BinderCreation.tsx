import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  Search,
  FileText,
  Printer,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Eye,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";

interface BinderCreationProps {
  onBack: () => void;
}

interface Employee {
  id: string;
  matricula: string;
  nome: string;
  cargo: string;
  obra: string;
  camisa?: string;
  calca?: string;
  bota?: string;
}

interface BinderEntry {
  id: string;
  employeeId: string;
  codigo: string;
  uni: string;
  ca: string;
  dataEntrega: string;
  dataDevolucao: string;
}

export function BinderCreation({ onBack }: BinderCreationProps) {
  const [viewMode, setViewMode] = useState<"select" | "manage" | "preview">(
    "select",
  );
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cargos, setCargos] = useState<{ id: string; titulo: string }[]>([]);
  const [obras, setObras] = useState<{ id: string; nome: string }[]>([]);
  const [binderEntries, setBinderEntries] = useState<BinderEntry[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<BinderEntry>>({});

  useEffect(() => {
    const unsubCargos = onSnapshot(
      collection(db, "cargos"),
      (snapshot) => {
        setCargos(
          snapshot.docs.map((d) => ({ id: d.id, titulo: d.data().titulo })),
        );
      },
      (error) => handleFirestoreError(error, OperationType.GET, "cargos"),
    );

    const unsubObras = onSnapshot(
      collection(db, "obras"),
      (snapshot) => {
        setObras(snapshot.docs.map((d) => ({ id: d.id, nome: d.data().nome })));
      },
      (error) => handleFirestoreError(error, OperationType.GET, "obras"),
    );

    return () => {
      unsubCargos();
      unsubObras();
    };
  }, []);

  useEffect(() => {
    if (cargos.length === 0 && obras.length === 0) return;

    const unsubEmp = onSnapshot(
      collection(db, "funcionarios"),
      (snapshot) => {
        const emps = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            matricula: data.matricula || "-",
            nome: data.nome || "-",
            cargo: cargos.find((c) => c.id === data.cargoId)?.titulo || "N/A",
            obra: obras.find((o) => o.id === data.obraId)?.nome || "N/A",
            camisa: data.camisa || "-",
            calca: data.calca || "-",
            bota: data.bota || "-",
          };
        });
        setEmployees(emps);
      },
      (error) => handleFirestoreError(error, OperationType.GET, "funcionarios"),
    );

    return () => unsubEmp();
  }, [cargos, obras]);

  useEffect(() => {
    if (!selectedEmployee) {
      setBinderEntries([]);
      return;
    }

    const q = query(
      collection(db, "entregas"),
      where("funcionarioId", "==", selectedEmployee.id),
      orderBy("createdAt", "desc"),
    );
    const unsubEnt = onSnapshot(
      q,
      (snapshot) => {
        const entries = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            employeeId: data.funcionarioId,
            codigo: data.codigoEpi,
            uni: String(data.quantidade || 1),
            ca: data.ca || "",
            dataEntrega: data.dataEntrega || "",
            dataDevolucao: data.dataDevolucao || "",
          } as BinderEntry;
        });
        setBinderEntries(entries);
      },
      (error) => handleFirestoreError(error, OperationType.GET, "entregas"),
    );

    return () => unsubEnt();
  }, [selectedEmployee]);

  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setViewMode("manage");
  };

  const handleBackToSelect = () => {
    setViewMode("select");
    setSelectedEmployee(null);
    setShowForm(false);
  };

  const handleCreateNew = () => {
    setEditingEntryId(null);
    setFormData({
      employeeId: selectedEmployee?.id,
      dataEntrega: new Date().toLocaleDateString("pt-BR"),
    });
    setShowForm(true);
  };

  const handleEdit = (entry: BinderEntry) => {
    setEditingEntryId(entry.id);
    setFormData(entry);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este EPI do fichário?")) {
      try {
        await deleteDoc(doc(db, "entregas", id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, "entregas");
      }
    }
  };
  const handleSave = async () => {
    if (!formData.codigo) {
      console.warn("Preencha os campos obrigatórios.");
      return;
    }

    try {
      if (editingEntryId) {
        await updateDoc(doc(db, "entregas", editingEntryId), {
          codigoEpi: formData.codigo,
          quantidade: formData.uni,
          ca: formData.ca,
          dataEntrega: formData.dataEntrega,
          dataDevolucao: formData.dataDevolucao,
        });
      } else {
        await addDoc(collection(db, "entregas"), {
          funcionarioId: selectedEmployee?.id,
          codigoEpi: formData.codigo,
          quantidade: formData.uni || "1",
          ca: formData.ca || "",
          dataEntrega: formData.dataEntrega || "",
          dataDevolucao: formData.dataDevolucao || "",
          createdAt: Date.now(),
        });
      }
      setShowForm(false);
    } catch (err) {
      handleFirestoreError(
        err,
        editingEntryId ? OperationType.UPDATE : OperationType.CREATE,
        "entregas",
      );
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getTitle = () => {
    if (viewMode === "select") return "Criar Fichário";
    if (viewMode === "manage") return "Gerenciar Entregas de EPI";
    return "Visualização do Fichário";
  };

  const getBackHandler = () => {
    if (viewMode === "preview") return () => setViewMode("manage");
    if (viewMode === "manage") return handleBackToSelect;
    return onBack;
  };

  const employeeEntries = selectedEmployee
    ? binderEntries.filter((e) => e.employeeId === selectedEmployee.id)
    : [];

  return (
    <div className="flex flex-col flex-1 bg-[#0D2027] h-full">
      {/* Header */}
      <div className="bg-[#152A32] px-6 pt-16 md:pt-12 pb-10 rounded-b-[40px] md:rounded-b-[50px] relative overflow-hidden bg-cover bg-center bg-no-repeat flex items-center justify-between text-white shrink-0 shadow-md"
        style={{ backgroundImage: 'linear-gradient(to bottom right, rgba(13, 32, 39, 0.95) 0%, rgba(13, 32, 39, 0.7) 100%), url("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200&q=80")' }}>
        <button
          onClick={getBackHandler()}
          className="p-2 -ml-2 hover:bg-[#0D2027] hover:text-[#FFA767] rounded-full transition-colors md:hidden"
        >
          <ChevronLeft size={24} />
        </button>
        <div
          className="hidden md:block p-2 cursor-pointer"
          onClick={getBackHandler()}
        >
          <ChevronLeft size={24} className="hover:text-gray-200" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[#FFA767] tracking-tight drop-shadow-sm">{getTitle()}</h1>
        <div className="w-8 md:hidden"></div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col w-full max-w-5xl mx-auto md:px-8">
        {viewMode === "select" && (
          <div className="flex flex-col flex-1 p-4 md:p-6 overflow-hidden">
            <h2 className="text-lg md:text-xl font-bold text-[#E2E8F0] mb-4">
              Selecione o Funcionário
            </h2>
            <div className="relative mb-6 shrink-0">
              <Search
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]"
              />
              <input
                type="text"
                placeholder="Buscar funcionário por nome ou matrícula..."
                className="w-full border border-[#2C4550] rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#FFA767] outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pb-safe">
              {employees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => handleSelectEmployee(emp)}
                  className="w-full bg-[#152A32] p-4 rounded-2xl shadow-sm border border-[#253B44] flex items-center gap-4 group hover:border-[#FFA767] transition-colors text-left"
                >
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[#E2E8F0] truncate text-base">
                      {emp.nome}
                    </h4>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Matrícula: {emp.matricula} | {emp.cargo}
                    </p>
                  </div>
                  <ChevronLeft
                    size={20}
                    className="text-gray-300 group-hover:text-[#FFA767] rotate-180 transition-colors"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {viewMode === "manage" && (
          <div className="flex flex-col flex-1 p-4 md:p-6 overflow-hidden">
            <div className="bg-[#152A32] p-4 rounded-2xl shadow-sm border border-[#253B44] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 shrink-0">
              <div>
                <h2 className="font-bold text-[#E2E8F0] text-lg">
                  {selectedEmployee?.nome}
                </h2>
                <div className="text-sm text-[#64748B] mt-1 flex gap-3 flex-wrap">
                  <span>Mat.: {selectedEmployee?.matricula}</span>
                  <span>Cargo: {selectedEmployee?.cargo}</span>
                  <span>Obra: {selectedEmployee?.obra}</span>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setViewMode("preview")}
                  className="flex-1 sm:flex-none bg-blue-50 text-blue-600 px-4 py-2 rounded-xl flex items-center justify-center font-bold hover:bg-blue-100 transition-colors text-sm"
                >
                  <Eye size={18} className="mr-2" />
                  Imprimir
                </button>
                <button
                  onClick={handleCreateNew}
                  className="flex-1 sm:flex-none bg-[#FFA767] text-white px-4 py-2 rounded-xl flex items-center justify-center font-bold hover:bg-[#E08E55] transition-colors text-sm"
                >
                  <Plus size={18} className="mr-2" />
                  Novo EPI
                </button>
              </div>
            </div>

            {showForm ? (
              <div className="bg-[#152A32] rounded-2xl shadow-sm border border-[#253B44] p-5 mb-6 shrink-0">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-[#E2E8F0]">
                    {editingEntryId ? "Editar EPI" : "Adicionar EPI"}
                  </h3>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-[#475569] hover:text-[#94A3B8]"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#CBD5E1]">
                      Código do EPI
                    </label>
                    <input
                      type="text"
                      name="codigo"
                      value={formData.codigo || ""}
                      onChange={handleChange}
                      className="w-full border border-[#2C4550] rounded-lg p-2 focus:ring-2 focus:ring-[#FFA767] outline-none text-sm"
                      placeholder="Ex: 05"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#CBD5E1]">
                      Unidade (Qtd)
                    </label>
                    <input
                      type="text"
                      name="uni"
                      value={formData.uni || ""}
                      onChange={handleChange}
                      className="w-full border border-[#2C4550] rounded-lg p-2 focus:ring-2 focus:ring-[#FFA767] outline-none text-sm"
                      placeholder="Ex: 1"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#CBD5E1]">
                      C.A.
                    </label>
                    <input
                      type="text"
                      name="ca"
                      value={formData.ca || ""}
                      onChange={handleChange}
                      className="w-full border border-[#2C4550] rounded-lg p-2 focus:ring-2 focus:ring-[#FFA767] outline-none text-sm"
                      placeholder="Ex: 12345"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#CBD5E1]">
                      Data de Entrega
                    </label>
                    <input
                      type="text"
                      name="dataEntrega"
                      value={formData.dataEntrega || ""}
                      onChange={handleChange}
                      className="w-full border border-[#2C4550] rounded-lg p-2 focus:ring-2 focus:ring-[#FFA767] outline-none text-sm"
                      placeholder="DD/MM/AAAA"
                    />
                  </div>
                  <div className="space-y-1 md:col-start-3">
                    <label className="text-xs font-semibold text-[#CBD5E1]">
                      Data de Devolução
                    </label>
                    <input
                      type="text"
                      name="dataDevolucao"
                      value={formData.dataDevolucao || ""}
                      onChange={handleChange}
                      className="w-full border border-[#2C4550] rounded-lg p-2 focus:ring-2 focus:ring-[#FFA767] outline-none text-sm"
                      placeholder="DD/MM/AAAA (Opcional)"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleSave}
                    className="bg-[#FFA767] text-white px-5 py-2 rounded-lg font-bold flex items-center shadow-sm hover:bg-[#E08E55] transition-colors text-sm"
                  >
                    <Save size={16} className="mr-2" />
                    Salvar
                  </button>
                </div>
              </div>
            ) : null}

            <div className="flex-1 bg-[#152A32] rounded-2xl shadow-sm border border-[#253B44] overflow-hidden flex flex-col">
              <div className="bg-[#0D2027] border-b border-[#253B44] p-4 shrink-0">
                <h3 className="font-bold text-[#E2E8F0] text-sm">
                  Registro de Entregas
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {employeeEntries.length === 0 ? (
                  <div className="text-center text-[#64748B] py-10 text-sm">
                    Nenhum EPI registrado no fichário deste funcionário.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {employeeEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="border border-[#253B44] rounded-xl p-3 flex items-center hover:bg-[#0D2027] transition-colors"
                      >
                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 text-sm gap-2">
                          <div>
                            <span className="text-xs text-[#475569] block sm:hidden">
                              Cód:
                            </span>
                            <span className="font-bold">{entry.codigo}</span>
                          </div>
                          <div>
                            <span className="text-xs text-[#475569] block sm:hidden">
                              Qtd:
                            </span>
                            {entry.uni} un
                          </div>
                          <div>
                            <span className="text-xs text-[#475569] block sm:hidden">
                              CA:
                            </span>
                            {entry.ca}
                          </div>
                          <div>
                            <span className="text-xs text-[#475569] block sm:hidden">
                              Entrega:
                            </span>
                            {entry.dataEntrega}
                          </div>
                          <div>
                            <span className="text-xs text-[#475569] block sm:hidden">
                              Devol.:
                            </span>
                            {entry.dataDevolucao || "-"}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0 ml-2">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {viewMode === "preview" && (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6 max-w-[800px] mx-auto">
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
            <div className="bg-[#152A32] w-full max-w-[800px] mx-auto shadow-xl border border-[#2C4550] p-6 sm:p-10 text-[10px] sm:text-xs text-black font-sans relative">
              {/* Doc Header */}
              <div className="flex border-2 border-black w-full mb-4">
                <div className="w-1/3 border-r-2 border-black p-4 flex items-center justify-center font-bold text-xl uppercase tracking-tighter text-center">
                  Logo Empresa
                </div>
                <div className="w-2/3 p-4 flex items-center justify-center font-bold text-sm sm:text-lg text-center uppercase">
                  Controle de Equipamento de Proteção Individual
                </div>
              </div>

              {/* Employee Info */}
              <div className="border-2 border-black border-b-0 w-full flex flex-col">
                <div className="flex border-b-2 border-black min-h-[32px]">
                  <div className="w-3/4 border-r-2 border-black px-2 py-1 flex items-start">
                    <span className="font-bold mr-2">Nome do Colaborador:</span>
                    <span className="font-medium">
                      {selectedEmployee?.nome}
                    </span>
                  </div>
                  <div className="w-1/4 px-2 py-1 flex items-start">
                    <span className="font-bold mr-2">Matrícula Nº:</span>
                    <span className="font-medium">
                      {selectedEmployee?.matricula}
                    </span>
                  </div>
                </div>

                <div className="flex border-b-2 border-black min-h-[32px]">
                  <div className="w-1/3 border-r-2 border-black px-2 py-1 flex items-start">
                    <span className="font-bold mr-2">Função inicial:</span>
                    <span className="font-medium">
                      {selectedEmployee?.cargo}
                    </span>
                  </div>
                  <div className="w-1/4 border-r-2 border-black px-2 py-1 flex items-start">
                    <span className="font-bold mr-2">Calça Nº:</span>
                    <span className="font-medium">
                      {selectedEmployee?.calca}
                    </span>
                  </div>
                  <div className="w-1/4 border-r-2 border-black px-2 py-1 flex items-start">
                    <span className="font-bold mr-2">Camisa Nº:</span>
                    <span className="font-medium">
                      {selectedEmployee?.camisa}
                    </span>
                  </div>
                  <div className="w-1/6 px-2 py-1 flex items-start">
                    <span className="font-bold mr-2">Calçado Nº:</span>
                    <span className="font-medium">
                      {selectedEmployee?.bota}
                    </span>
                  </div>
                </div>

                <div className="flex border-b-2 border-black min-h-[32px]">
                  <div className="w-2/3 border-r-2 border-black px-2 py-1 flex items-start">
                    <span className="font-bold mr-2">
                      Função pós promoção (quando aplicável):
                    </span>
                  </div>
                  <div className="w-1/3 px-2 py-1 flex items-start">
                    <span className="font-bold mr-2">Data da promoção:</span>
                  </div>
                </div>
              </div>

              {/* Termo */}
              <div className="border-2 border-t-0 border-black p-3 mb-4 text-justify leading-relaxed">
                <p className="mb-2">
                  Declaro para os devidos efeitos legais, que recebi o
                  equipamentos de proteção individual relacionados no abaixo e
                  no verso, como também treinamento para o uso adequado e está
                  ciente das obrigações constantes na NR - 06 da portaria
                  3.214/78, sub-item 6.7 a saber:
                  <br />
                  A) Usá-lo apenas para a finalidade que se destina; B)
                  Responsabilizar-se pela sua guarda e conservação;
                  <br />
                  C) Comunicar quaisquer alterações que o torne impróprio para o
                  uso.
                </p>
                <p className="mb-6 mt-4">
                  Declara, também, que se encontra ciente e coloca sua anuência
                  as disposições do Art. 462 e 1º da CLT autorizando o desconto
                  salarial proporcional ao custo da reparação do dano que
                  eventualmente vier provocar no EPI em questão, uma vez que
                  atesta tê-lo recebido em perfeitas condições, como também é
                  conhecedor da disposição legal constante da NR - 01, Sub-item
                  1.8.1 de que constitui ato faltoso recusa de usar EPI, ora
                  fornecido pela empresa, incorrendo nas penalidades previstas
                  na lei.
                </p>

                <div className="flex justify-around items-end pt-4 pb-2 mt-8">
                  <div className="flex flex-col items-center w-1/3">
                    <div className="w-full border-b border-black text-center pb-1 h-6 text-[10px]">
                      {new Date().toLocaleDateString("pt-BR")}
                    </div>
                    <span className="mt-1 font-medium">
                      Data de abertura da ficha
                    </span>
                  </div>
                  <div className="flex flex-col items-center w-1/2">
                    <div className="w-full border-b border-black h-6"></div>
                    <span className="mt-1 font-medium">
                      Assinatura do Colaborador
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabela de Códigos (Mock) */}
              <div className="border-2 border-black mb-4 flex flex-col">
                <div className="border-b-2 border-black text-center font-bold py-1 bg-gray-100 uppercase">
                  Código dos EPI's
                </div>
                <div className="grid grid-cols-3 gap-x-2 gap-y-1 p-2 font-medium text-[9px] sm:text-[10px]">
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
                  <div className="w-1/4 border-r-2 border-black p-2 flex items-center justify-center font-bold text-center bg-gray-100">
                    Logo Empresa
                  </div>
                  <div className="w-3/4 p-2 flex items-center justify-center font-bold text-center uppercase bg-gray-100 text-xs text-black">
                    Controle de Equipamento de Proteção Individual
                  </div>
                </div>

                {/* Headers */}
                <div className="flex border-b-2 border-black bg-[#0D2027] font-bold items-center text-center">
                  <div className="w-[12%] py-2 border-r border-black">
                    CÓDIGO
                  </div>
                  <div className="w-[12%] py-2 border-r border-black">UNI</div>
                  <div className="w-[15%] py-2 border-r border-black">CA</div>
                  <div className="w-[31%] flex flex-col border-r border-black">
                    <div className="border-b border-black py-0.5">DATA</div>
                    <div className="flex w-full">
                      <div className="w-1/2 border-r border-black py-0.5 text-[10px]">
                        ENTREGA
                      </div>
                      <div className="w-1/2 py-0.5 text-[10px]">DEVOLUÇÃO</div>
                    </div>
                  </div>
                  <div className="w-[30%] py-2">ASSINATURA</div>
                </div>

                {/* Linhas  - Preencher com as entries reais + linhas vazias até completar 12 */}
                {Array.from({
                  length: Math.max(employeeEntries.length + 3, 12),
                }).map((_, i) => {
                  const entry = employeeEntries[i];
                  return (
                    <div
                      key={i}
                      className="flex border-b border-black last:border-b-0 min-h-[28px]"
                    >
                      <div className="w-[12%] border-r border-black flex items-center justify-center font-medium">
                        {entry?.codigo || ""}
                      </div>
                      <div className="w-[12%] border-r border-black flex items-center justify-center font-medium">
                        {entry?.uni || ""}
                      </div>
                      <div className="w-[15%] border-r border-black flex items-center justify-center font-medium">
                        {entry?.ca || ""}
                      </div>
                      <div className="w-[15.5%] border-r border-black flex items-center justify-center font-medium">
                        {entry?.dataEntrega || ""}
                      </div>
                      <div className="w-[15.5%] border-r border-black flex items-center justify-center font-medium">
                        {entry?.dataDevolucao || ""}
                      </div>
                      <div className="w-[30%] flex items-center justify-center"></div>
                    </div>
                  );
                })}
              </div>

              {/* Botao invisível p/ impressao não mostrar toolbar, usar midia print em css global (opcional) */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
