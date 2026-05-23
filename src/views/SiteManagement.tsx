import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  Plus,
  Search,
  Edit2,
  Trash2,
  Save,
  Building2,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";

interface SiteManagementProps {
  onBack: () => void;
}

interface SiteItem {
  id: string;
  codigo: string;
  nome: string;
  status: string;
  dataInicio?: string;
  numFuncionarios?: number;
  createdAt: number;
}

export function SiteManagement({ onBack }: SiteManagementProps) {
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SiteItem>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "obras"),
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as SiteItem,
        );
        setSites(data);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "obras");
      },
    );

    return () => unsubscribe();
  }, []);

  const handleCreateNew = () => {
    setEditingId(null);
    setFormData({
      status: "Ativa",
      codigo: "",
      nome: "",
    });
    setViewMode("form");
  };

  const handleEdit = (site: SiteItem) => {
    setEditingId(site.id);
    setFormData(site);
    setViewMode("form");
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "obras", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "obras");
    }
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.codigo || !formData.status) {
      setSubmitError("Preencha os campos obrigatórios (Código, Nome, Status).");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const siteData = {
        codigo: formData.codigo,
        nome: formData.nome,
        status: formData.status,
        dataInicio: formData.dataInicio || "",
        numFuncionarios: Number(formData.numFuncionarios) || 0,
      };

      if (editingId) {
        await updateDoc(doc(db, "obras", editingId), siteData);
      } else {
        await addDoc(collection(db, "obras"), {
          ...siteData,
          createdAt: Date.now(),
        });
      }
      setViewMode("list");
    } catch (error) {
      handleFirestoreError(
        error,
        editingId ? OperationType.UPDATE : OperationType.CREATE,
        "obras",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex flex-col flex-1 bg-[#0D2027] h-full">
      {/* Header */}
      <div className="bg-[#152A32] px-6 pt-16 md:pt-12 pb-10 rounded-b-[40px] md:rounded-b-[50px] relative overflow-hidden bg-cover bg-center bg-no-repeat flex items-center justify-between text-white shrink-0 shadow-md"
        style={{ backgroundImage: 'linear-gradient(to bottom right, rgba(13, 32, 39, 0.95) 0%, rgba(13, 32, 39, 0.7) 100%), url("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200&q=80")' }}>
        <button
          onClick={viewMode === "form" ? () => setViewMode("list") : onBack}
          className="p-2 -ml-2 hover:bg-[#0D2027] hover:text-[#FFA767] rounded-full transition-colors md:hidden"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="hidden md:block p-2">
          <ChevronLeft size={24} className="opacity-0" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[#FFA767] tracking-tight drop-shadow-sm">
          {viewMode === "form"
            ? editingId
              ? "Editar Obra"
              : "Cadastrar Obra"
            : "Gerenciar Obras"}
        </h1>
        <div className="w-8 md:hidden"></div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col w-full max-w-5xl mx-auto md:px-8">
        {viewMode === "list" ? (
          <div className="flex flex-col flex-1 p-4 md:p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <div className="relative flex-1 mr-4">
                <Search
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]"
                />
                <input
                  type="text"
                  placeholder="Buscar obra..."
                  className="w-full border border-[#2C4550] rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#FFA767] outline-none"
                />
              </div>
              <button
                onClick={handleCreateNew}
                className="bg-[#FFA767] text-white p-3 rounded-xl flex items-center justify-center shadow-sm hover:bg-[#E08E55] transition-colors whitespace-nowrap"
              >
                <Plus size={20} className="md:mr-2" />
                <span className="hidden md:inline font-semibold">
                  Nova Obra
                </span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pb-safe">
              {sites.map((site) => (
                <div
                  key={site.id}
                  className="bg-[#152A32] p-4 rounded-2xl shadow-sm border border-[#253B44] flex items-center gap-4 group"
                >
                  <div className="w-14 h-14 bg-[#0D2027] rounded-xl flex items-center justify-center shrink-0 border border-[#253B44] overflow-hidden">
                    <Building2 size={24} className="text-[#475569]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[#E2E8F0] truncate">
                      {site.nome}
                    </h4>
                    <p className="text-xs text-[#64748B]">
                      Código: {site.codigo}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={cn(
                          "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase",
                          site.status === "Ativa"
                            ? "bg-[#152A32] text-[#FFA767]"
                            : "bg-gray-100 text-[#64748B]",
                        )}
                      >
                        {site.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleEdit(site)}
                      className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(site.id)}
                      className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {sites.length === 0 && (
                <div className="text-center text-[#64748B] mt-10">
                  Nenhuma obra cadastrada.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-safe">
            <div className="bg-[#152A32] rounded-3xl shadow-sm border border-[#253B44] p-5 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#CBD5E1]">
                    Código da Obra
                  </label>
                  <input
                    type="text"
                    name="codigo"
                    value={formData.codigo || ""}
                    onChange={handleChange}
                    className="w-full border border-[#2C4550] rounded-xl p-3 focus:ring-2 focus:ring-[#FFA767] outline-none"
                    placeholder="Ex: OB-001"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#CBD5E1]">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status || ""}
                    onChange={handleChange}
                    className="w-full border border-[#2C4550] rounded-xl p-3 focus:ring-2 focus:ring-[#FFA767] outline-none appearance-none cursor-pointer"
                  >
                    <option value="" disabled>
                      Selecione o status
                    </option>
                    <option value="Ativa">Ativa</option>
                    <option value="Concluída">Concluída</option>
                    <option value="Pausada">Pausada</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-[#CBD5E1]">
                    Nome da Obra
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome || ""}
                    onChange={handleChange}
                    className="w-full border border-[#2C4550] rounded-xl p-3 focus:ring-2 focus:ring-[#FFA767] outline-none"
                    placeholder="Ex: Obra Central"
                  />
                </div>
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mt-4">
                  {submitError}
                </div>
              )}

              <button
                disabled={isSubmitting}
                onClick={handleSave}
                className="w-full bg-[#FFA767] text-white font-bold rounded-xl py-4 flex items-center justify-center gap-2 shadow-md hover:bg-[#E08E55] transition-colors mt-4 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Salvar Obra
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
