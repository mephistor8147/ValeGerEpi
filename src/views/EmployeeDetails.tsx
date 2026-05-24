import React, { useState, useEffect } from "react";
import { ChevronLeft, Plus, Edit2, Trash2, ArrowDownLeft, X } from "lucide-react";
import { cn } from "../lib/utils";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";

interface EmployeeDetailsProps {
  employeeId: string;
  onBack: () => void;
  onViewBinder?: () => void;
}

export function EmployeeDetails({
  employeeId,
  onBack,
  onViewBinder,
}: EmployeeDetailsProps) {
  const [activeTab, setActiveTab] = useState("EPIs");
  const [employee, setEmployee] = useState<any>(null);
  const [cargo, setCargo] = useState<any>(null);
  const [assignedEpis, setAssignedEpis] = useState<any[]>([]);
  const [entregasHistory, setEntregasHistory] = useState<any[]>([]);
  const [obra, setObra] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [refreshKey, setRefreshKey] = useState(0);
  const [availableEpis, setAvailableEpis] = useState<any[]>([]);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedEntrega, setSelectedEntrega] = useState<any>(null);

  const [deliveryForm, setDeliveryForm] = useState({
    codigoEpi: "",
    dataEntrega: new Date().toISOString().split("T")[0],
    ca: "",
    quantidade: 1,
    observacoes: "",
  });

  const [editForm, setEditForm] = useState({
    dataEntrega: "",
    ca: "",
    quantidade: 1,
    observacoes: "",
  });

  const [returnForm, setReturnForm] = useState({
    dataDevolucao: new Date().toISOString().split("T")[0],
    motivoDevolucao: "",
  });

  const handleCreateDelivery = async () => {
    if (!deliveryForm.codigoEpi || !deliveryForm.dataEntrega) return;
    try {
      const adminUserStr = localStorage.getItem("adminUser");
      const adminUser = adminUserStr ? JSON.parse(adminUserStr) : null;
      await addDoc(collection(db, "entregas"), {
        funcionarioId: employeeId,
        codigoEpi: deliveryForm.codigoEpi,
        quantidade: deliveryForm.quantidade || 1,
        ca: deliveryForm.ca || "N/A",
        dataEntrega: deliveryForm.dataEntrega,
        observacoes: deliveryForm.observacoes,
        createdAt: Date.now(),
        adminResponsavelId: adminUser?.id || null,
        adminResponsavelNome: adminUser?.nomeFuncionario || "Desconhecido",
      });
      setShowDeliveryModal(false);
      setRefreshKey(k => k + 1);
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar entrega.");
    }
  };

  const handleEditDelivery = async () => {
    if (!selectedEntrega || !editForm.dataEntrega) return;
    try {
      await updateDoc(doc(db, "entregas", selectedEntrega.id), {
        dataEntrega: editForm.dataEntrega,
        ca: editForm.ca,
        quantidade: editForm.quantidade,
        observacoes: editForm.observacoes,
      });
      setShowEditModal(false);
      setRefreshKey(k => k + 1);
    } catch (e) {
      console.error(e);
      alert("Erro ao editar.");
    }
  };

  const handleReturnDelivery = async () => {
    if (!selectedEntrega || !returnForm.dataDevolucao) return;
    try {
      const adminUserStr = localStorage.getItem("adminUser");
      const adminUser = adminUserStr ? JSON.parse(adminUserStr) : null;
      await updateDoc(doc(db, "entregas", selectedEntrega.id), {
        dataDevolucao: returnForm.dataDevolucao,
        motivoDevolucao: returnForm.motivoDevolucao,
        adminResponsavelDevolucaoId: adminUser?.id || null,
        adminResponsavelNomeDevolucao: adminUser?.nomeFuncionario || "Desconhecido",
      });
      setShowReturnModal(false);
      setRefreshKey(k => k + 1);
    } catch (e) {
      console.error(e);
      alert("Erro ao devolver.");
    }
  };

  const handleDeleteDelivery = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;
    try {
      await deleteDoc(doc(db, "entregas", id));
      setRefreshKey(k => k + 1);
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir.");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch employee
        const empRef = doc(db, "funcionarios", employeeId);
        const empSnap = await getDoc(empRef);

        if (empSnap.exists()) {
          const empData = { id: empSnap.id, ...empSnap.data() } as any;
          setEmployee(empData);

          // Fetch cargo
          if (empData.cargoId) {
            const cargoRef = doc(db, "cargos", empData.cargoId);
            const cargoSnap = await getDoc(cargoRef);
            if (cargoSnap.exists()) {
              setCargo({ id: cargoSnap.id, ...cargoSnap.data() });
            }
          }

          // Fetch obra
          if (empData.obraId) {
            const obraRef = doc(db, "obras", empData.obraId);
            const obraSnap = await getDoc(obraRef);
            if (obraSnap.exists()) {
              setObra({ id: obraSnap.id, ...obraSnap.data() });
            }
          }

          // Fetch epis to get fotoUrls
          const episQ = query(collection(db, "epis"));
          const episSnap = await getDocs(episQ);
          const episMap = new Map();
          const episListFull: any[] = [];
          episSnap.docs.forEach((d) => {
            const data = d.data();
            episListFull.push({ id: d.id, ...data });
            if (data.nome) episMap.set(data.nome, data.fotoUrl);
          });
          setAvailableEpis(episListFull);

          // Fetch entregas for this employee
          const entregasQ = query(
            collection(db, "entregas"),
            where("funcionarioId", "==", employeeId),
          );
          const entregasSnap = await getDocs(entregasQ);
          const entregasData = entregasSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }));

          const historyList = entregasData
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((entrega) => ({
              ...entrega,
              fotoUrl: episMap.get(entrega.codigoEpi) || "",
            }));

          setEntregasHistory(historyList);

          const episList = entregasData
            .filter((entrega) => !entrega.dataDevolucao)
            .map((entrega) => ({
              id: entrega.id,
              name: entrega.codigoEpi || "EPI",
              ca: entrega.ca || "N/A",
              delivery: entrega.dataEntrega || "Desconhecida",
              valid: "Consultar validade",
              status: "valid",
              adminResponsavelNome: entrega.adminResponsavelNome || "N/A",
              fotoUrl: episMap.get(entrega.codigoEpi) || "",
            }));

          setAssignedEpis(episList);
        }
      } catch (err) {
        console.error("Error fetching employee details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [employeeId, refreshKey]);

  if (loading) {
    return (
      <div className="flex flex-col flex-1 bg-[#0D2027] h-full">
        <div className="bg-[#152A32] px-6 pt-16 md:pt-12 pb-10 rounded-b-[40px] md:rounded-b-[50px] relative overflow-hidden bg-cover bg-center bg-no-repeat flex items-center justify-between text-white shrink-0 shadow-md"
        style={{ backgroundImage: 'linear-gradient(to bottom right, rgba(13, 32, 39, 0.95) 0%, rgba(13, 32, 39, 0.7) 100%), url("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200&q=80")' }}>
          <button onClick={onBack} className="p-2 -ml-2">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Detalhes do Funcionário</h1>
          <div className="w-8"></div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#FFA767] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col flex-1 bg-[#0D2027] h-full">
        <div className="bg-[#152A32] px-6 pt-16 md:pt-12 pb-10 rounded-b-[40px] md:rounded-b-[50px] relative overflow-hidden bg-cover bg-center bg-no-repeat flex items-center justify-between text-white shrink-0 shadow-md"
        style={{ backgroundImage: 'linear-gradient(to bottom right, rgba(13, 32, 39, 0.95) 0%, rgba(13, 32, 39, 0.7) 100%), url("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200&q=80")' }}>
          <button onClick={onBack} className="p-2 -ml-2">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Detalhes do Funcionário</h1>
          <div className="w-8"></div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#64748B]">
          <p>Funcionário não encontrado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-[#0D2027] h-full">
      {/* Header */}
      <div className="bg-[#152A32] px-6 pt-16 md:pt-12 pb-10 rounded-b-[40px] md:rounded-b-[50px] relative overflow-hidden bg-cover bg-center bg-no-repeat flex items-center justify-between text-white shrink-0 shadow-md"
        style={{ backgroundImage: 'linear-gradient(to bottom right, rgba(13, 32, 39, 0.95) 0%, rgba(13, 32, 39, 0.7) 100%), url("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200&q=80")' }}>
        <button
          onClick={onBack}
          className="p-2 -ml-2 hover:bg-[#0D2027] hover:text-[#FFA767] rounded-full transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-3xl md:text-4xl font-bold text-[#FFA767] tracking-tight drop-shadow-sm">
          Detalhes do Funcionário
        </h1>
        <div className="w-8 -mr-2"></div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden max-w-5xl mx-auto w-full border-x border-[#253B44] bg-[#152A32]">
        {/* Profile Info */}
        <div className="bg-[#152A32] p-6 md:p-8 shrink-0 border-b border-[#253B44] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-5 md:gap-6">
            {employee.fotoUrl ? (
              <img
                src={employee.fotoUrl}
                alt={employee.nome}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-gray-50 shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-100 flex items-center justify-center text-3xl border-4 border-gray-50 shadow-sm">
                👤
              </div>
            )}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#E2E8F0] mb-1">
                {employee.nome}
              </h2>
              <div className="flex items-center gap-3">
                <p className="text-sm md:text-base text-[#64748B] font-medium">
                  Matrícula: {employee.matricula || "N/A"}
                </p>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                <p className="text-sm md:text-base text-[#64748B] font-medium">
                  {cargo?.titulo || "S/ Cargo"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:items-end gap-3 self-start sm:self-center">
            <span
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-semibold border inline-block text-center",
                (employee.status || "Ativo") === "Ativo"
                  ? "bg-[#152A32] text-green-700 border-[#253B44]"
                  : "bg-red-50 text-red-700 border-red-100",
              )}
            >
              Status: {employee.status || "Ativo"}
            </span>
            {onViewBinder && (
              <button
                onClick={onViewBinder}
                className="text-[#FFA767] bg-[#152A32] hover:bg-[#253B44] px-4 py-2 font-semibold text-sm rounded-xl border border-[#253B44] transition-colors whitespace-nowrap"
              >
                Visualizar Fichário
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#152A32] shrink-0 border-b border-[#253B44] px-4 md:px-8 overflow-x-auto scrollbar-hide">
          {["Dados", "EPIs", "Histórico"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-4 text-base md:text-lg font-bold border-b-4 transition-colors whitespace-nowrap",
                activeTab === tab
                  ? "text-[#FFA767] border-[#FFA767]"
                  : "text-[#64748B] border-transparent hover:text-[#CBD5E1] hover:border-[#2C4550]",
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 md:p-8 bg-[#0D2027]">
          {activeTab === "EPIs" && (
            <div className="max-w-3xl mx-auto w-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col gap-1">
                  <h3 className="font-bold text-[#E2E8F0] text-lg md:text-xl">
                    EPIs em uso
                  </h3>
                  <span className="text-sm text-[#64748B] font-medium">
                    {assignedEpis.length} itens
                  </span>
                </div>
                <button
                  onClick={() => setShowDeliveryModal(true)}
                  className="bg-[#FFA767] hover:bg-[#ffb580] text-[#0D2027] px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"
                >
                  <Plus size={20} />
                  Nova Entrega
                </button>
              </div>
              <div className="space-y-4">
                {assignedEpis.map((epi, idx) => (
                  <div
                    key={idx}
                    className="bg-[#152A32] p-4 md:p-6 rounded-2xl shadow-sm border border-[#253B44] flex flex-col gap-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start md:items-center gap-4">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-[#0D2027] flex items-center justify-center p-2 shrink-0 border border-[#253B44] overflow-hidden">
                        {epi.fotoUrl ? (
                          <img src={epi.fotoUrl} alt={epi.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <span className="text-3xl md:text-4xl">🧰</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pr-2">
                        <h4
                          className="font-bold text-[#E2E8F0] text-base md:text-lg mb-1 leading-tight"
                          style={{ wordBreak: "break-word" }}
                        >
                          {epi.name}
                        </h4>
                        <p className="text-sm text-[#64748B] font-medium">
                          CA: {epi.ca}
                        </p>
                        <p className="text-xs text-[#475569] mt-1 line-clamp-1">
                          Por: {epi.adminResponsavelNome}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#253B44]">
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-[11px] text-[#475569] uppercase font-bold tracking-wider mb-0.5">
                            Data de Entrega
                          </p>
                          <p className="text-sm text-[#CBD5E1] font-medium">
                            {epi.delivery}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-[#475569] uppercase font-bold tracking-wider mb-0.5">
                            Vencimento
                          </p>
                          <p className="text-sm text-[#FFA767] font-bold">
                            {epi.valid}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedEntrega(epi); setReturnForm({ ...returnForm, motivoDevolucao: "" }); setShowReturnModal(true); }} className="flex-1 sm:flex-none p-2 md:px-3 text-blue-400 bg-blue-400/10 hover:bg-blue-400/20 rounded-xl transition-colors flex items-center justify-center" title="Devolver" >
                          <ArrowDownLeft size={18} />
                        </button>
                        <button onClick={() => { setSelectedEntrega(epi); setEditForm({ dataEntrega: epi.delivery, ca: epi.ca, quantidade: epi.quantidade || 1, observacoes: epi.observacoes || "" }); setShowEditModal(true); }} className="flex-1 sm:flex-none p-2 md:px-3 text-[#CBD5E1] bg-[#0D2027] hover:bg-white/10 rounded-xl transition-colors flex items-center justify-center border border-[#253B44]" title="Editar" >
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDeleteDelivery(epi.id)} className="flex-1 sm:flex-none p-2 md:px-3 text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors flex items-center justify-center" title="Excluir" >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {assignedEpis.length === 0 && (
                  <div className="text-center py-10 bg-[#152A32] rounded-2xl border border-[#253B44]">
                    <span className="text-4xl">🤷‍♂️</span>
                    <p className="text-[#64748B] mt-4">
                      Nenhum EPI registrado para este funcionário.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "Dados" && (
            <div className="max-w-3xl mx-auto w-full bg-[#152A32] p-6 md:p-8 rounded-2xl border border-[#253B44] shadow-sm space-y-6">
              <div>
                <h3 className="font-bold text-lg text-[#E2E8F0] mb-4 border-b pb-2">
                  Informações Profissionais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Nome Completo</p>
                    <p className="font-semibold text-[#E2E8F0]">
                      {employee.nome}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Matrícula</p>
                    <p className="font-semibold text-[#E2E8F0]">
                      {employee.matricula || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Cargo</p>
                    <p className="font-semibold text-[#E2E8F0]">
                      {cargo?.titulo || "S/ Cargo"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">
                      Obra / Alocação
                    </p>
                    <p className="font-semibold text-[#E2E8F0]">
                      {obra?.nome || "Não alocado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Status</p>
                    <p className="font-semibold text-[#FFA767] font-medium">
                      {employee.status || "Ativo"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">
                      Data de Cadastro
                    </p>
                    <p className="font-semibold text-[#E2E8F0]">
                      {employee.createdAt
                        ? new Date(employee.createdAt).toLocaleDateString(
                            "pt-BR",
                          )
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Histórico" && (
            <div className="max-w-3xl mx-auto w-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col gap-1">
                  <h3 className="font-bold text-[#E2E8F0] text-lg md:text-xl">
                    Histórico de Movimentações
                  </h3>
                  <span className="text-sm text-[#64748B] font-medium">
                    {entregasHistory.length} registros
                  </span>
                </div>
                <button
                  onClick={() => setShowDeliveryModal(true)}
                  className="bg-[#FFA767] hover:bg-[#ffb580] text-[#0D2027] px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"
                >
                  <Plus size={20} />
                  Nova Entrega
                </button>
              </div>

              <div className="space-y-4">
                {entregasHistory.length > 0 ? (
                  entregasHistory.map((entrega) => (
                    <div
                      key={entrega.id}
                      className="bg-[#152A32] p-5 rounded-2xl shadow-sm border border-[#253B44]"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-3">
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-[#0D2027] flex items-center justify-center shrink-0 border border-[#253B44] overflow-hidden">
                            {entrega.fotoUrl ? (
                              <img src={entrega.fotoUrl} alt={entrega.codigoEpi} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl md:text-2xl">🧰</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pr-2">
                            <h4 className="font-bold text-[#E2E8F0] text-sm md:text-base leading-tight mb-0.5" style={{ wordBreak: "break-word" }}>
                              {entrega.codigoEpi}
                            </h4>
                            <p className="text-sm text-[#64748B]">
                              CA: {entrega.ca || "N/A"} • Qtd:{" "}
                              {entrega.quantidade || 1}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                          <span
                            className={cn(
                              "px-3 py-1 rounded-full text-xs font-bold",
                              entrega.dataDevolucao
                                ? "bg-[#253B44] text-[#94A3B8]"
                                : "bg-[#253B44] text-green-500",
                            )}
                          >
                            {entrega.dataDevolucao ? "Devolvido" : "Em uso"}
                          </span>
                          <div className="flex gap-2">
                            <button onClick={() => { setSelectedEntrega(entrega); setEditForm({ dataEntrega: entrega.dataEntrega, ca: entrega.ca, quantidade: entrega.quantidade || 1, observacoes: entrega.observacoes || "" }); setShowEditModal(true); }} className="flex-1 sm:flex-none p-2 md:px-3 text-[#CBD5E1] bg-[#0D2027] hover:bg-white/10 rounded-xl transition-colors flex items-center justify-center border border-[#253B44]" title="Editar" >
                              <Edit2 size={18} />
                            </button>
                            <button onClick={() => handleDeleteDelivery(entrega.id)} className="flex-1 sm:flex-none p-2 md:px-3 text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors flex items-center justify-center" title="Excluir" >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 pt-4 border-t border-[#253B44]">
                        <div>
                          <p className="text-[11px] text-[#475569] uppercase font-bold tracking-wider mb-1">
                            Entrega
                          </p>
                          <p className="text-sm text-[#CBD5E1] font-medium">
                            {new Date(entrega.dataEntrega).toLocaleDateString(
                              "pt-BR",
                            )}
                          </p>
                          <p className="text-xs text-[#94A3B8] mt-1">
                            Por: {entrega.adminResponsavelNome || "N/A"}
                          </p>
                          {entrega.observacoes && (
                            <p className="text-xs text-[#64748B] mt-1 italic">
                              Obs: {entrega.observacoes}
                            </p>
                          )}
                        </div>
                        {entrega.dataDevolucao && (
                          <div>
                            <p className="text-[11px] text-[#475569] uppercase font-bold tracking-wider mb-1">
                              Devolução
                            </p>
                            <p className="text-sm text-[#CBD5E1] font-medium">
                              {new Date(
                                entrega.dataDevolucao,
                              ).toLocaleDateString("pt-BR")}
                            </p>
                            <p className="text-xs text-[#94A3B8] mt-1">
                              Por:{" "}
                              {entrega.adminResponsavelNomeDevolucao || "N/A"}
                            </p>
                            <p className="text-xs text-[#64748B] mt-1">
                              Motivo: {entrega.motivoDevolucao}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 bg-[#152A32] rounded-2xl border border-[#253B44]">
                    <span className="text-4xl text-gray-300">📋</span>
                    <p className="text-[#64748B] mt-4">
                      Nenhum histórico encontrado para este funcionário.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ADD/EDIT/RETURN MODALS */}
      {showDeliveryModal && (
        <div className="fixed inset-0 bg-black/60 z-[99] flex items-center justify-center p-4">
          <div className="bg-[#152A32] rounded-2xl w-full max-w-md overflow-hidden flex flex-col border border-[#253B44]">
            <div className="p-4 border-b border-[#253B44] flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">Nova Entrega</h3>
              <button onClick={() => setShowDeliveryModal(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">EPI</label>
                <select className="w-full bg-[#0D2027] border border-[#253B44] rounded-lg p-3 text-white" value={deliveryForm.codigoEpi} onChange={e => {
                  const epi = availableEpis.find(ep => ep.nome === e.target.value);
                  setDeliveryForm({...deliveryForm, codigoEpi: e.target.value, ca: epi?.ca || ""});
                }}>
                  <option value="">Selecione um EPI</option>
                  {availableEpis.map(e => <option key={e.id} value={e.nome}>{e.nome}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Qtd</label>
                  <input type="number" min="1" className="w-full bg-[#0D2027] border border-[#253B44] rounded-lg p-3 text-white" value={deliveryForm.quantidade} onChange={e => setDeliveryForm({...deliveryForm, quantidade: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Data</label>
                  <input type="date" className="w-full bg-[#0D2027] border border-[#253B44] rounded-lg p-3 text-white" value={deliveryForm.dataEntrega} onChange={e => setDeliveryForm({...deliveryForm, dataEntrega: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">CA</label>
                <input type="text" className="w-full bg-[#0D2027] border border-[#253B44] rounded-lg p-3 text-white" value={deliveryForm.ca} onChange={e => setDeliveryForm({...deliveryForm, ca: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Observações</label>
                <textarea className="w-full bg-[#0D2027] border border-[#253B44] rounded-lg p-3 text-white h-20" value={deliveryForm.observacoes} onChange={e => setDeliveryForm({...deliveryForm, observacoes: e.target.value})}></textarea>
              </div>
              <button onClick={handleCreateDelivery} className="w-full bg-[#FFA767] text-[#0D2027] font-bold py-3 rounded-xl mt-4">Confirmar Entrega</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedEntrega && (
        <div className="fixed inset-0 bg-black/60 z-[99] flex items-center justify-center p-4">
          <div className="bg-[#152A32] rounded-2xl w-full max-w-md overflow-hidden flex flex-col border border-[#253B44]">
            <div className="p-4 border-b border-[#253B44] flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">Editar Registro</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Qtd</label>
                  <input type="number" min="1" className="w-full bg-[#0D2027] border border-[#253B44] rounded-lg p-3 text-white" value={editForm.quantidade} onChange={e => setEditForm({...editForm, quantidade: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Data</label>
                  <input type="date" className="w-full bg-[#0D2027] border border-[#253B44] rounded-lg p-3 text-white" value={editForm.dataEntrega} onChange={e => setEditForm({...editForm, dataEntrega: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">CA</label>
                <input type="text" className="w-full bg-[#0D2027] border border-[#253B44] rounded-lg p-3 text-white" value={editForm.ca} onChange={e => setEditForm({...editForm, ca: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Observações</label>
                <textarea className="w-full bg-[#0D2027] border border-[#253B44] rounded-lg p-3 text-white h-20" value={editForm.observacoes} onChange={e => setEditForm({...editForm, observacoes: e.target.value})}></textarea>
              </div>
              <button onClick={handleEditDelivery} className="w-full bg-[#FFA767] text-[#0D2027] font-bold py-3 rounded-xl mt-4">Salvar Alterações</button>
            </div>
          </div>
        </div>
      )}

      {showReturnModal && selectedEntrega && (
        <div className="fixed inset-0 bg-black/60 z-[99] flex items-center justify-center p-4">
          <div className="bg-[#152A32] rounded-2xl w-full max-w-md overflow-hidden flex flex-col border border-[#253B44]">
            <div className="p-4 border-b border-[#253B44] flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">Devolver EPI</h3>
              <button onClick={() => setShowReturnModal(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Data de Devolução</label>
                <input type="date" className="w-full bg-[#0D2027] border border-[#253B44] rounded-lg p-3 text-white" value={returnForm.dataDevolucao} onChange={e => setReturnForm({...returnForm, dataDevolucao: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Motivo / Condição</label>
                <select className="w-full bg-[#0D2027] border border-[#253B44] rounded-lg p-3 text-white" value={returnForm.motivoDevolucao} onChange={e => setReturnForm({...returnForm, motivoDevolucao: e.target.value})}>
                  <option value="">Selecione um motivo...</option>
                  <option value="Desligamento">Desligamento do funcionário</option>
                  <option value="Troca por desgaste">Troca por desgaste normal</option>
                  <option value="Troca por dano">Troca por dano / quebra</option>
                  <option value="Perda">Aviso de perda</option>
                  <option value="Fim de validade">Fim de validade do CA</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <button onClick={handleReturnDelivery} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl mt-4 transition-colors">Confirmar Devolução</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
