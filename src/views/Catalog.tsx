import React, { useState, useEffect } from "react";
import { ChevronLeft, Search, Tag, HardHat, Glasses, Ear, Shirt, Hand, Footprints, Layers, Shield } from "lucide-react";
import { cn } from "../lib/utils";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";

const getCategoryIcon = (categoryName: string) => {
  const norm = categoryName.toLowerCase();
  if (norm === "todas as categorias") return Layers;
  if (norm.includes("cabeça") || norm.includes("capacete")) return HardHat;
  if (norm.includes("visual") || norm.includes("óculos") || norm.includes("oculos") || norm.includes("face")) return Glasses;
  if (norm.includes("auditiva") || norm.includes("auricular") || norm.includes("ouvido")) return Ear;
  if (norm.includes("mão") || norm.includes("mao") || norm.includes("luva")) return Hand;
  if (norm.includes("pé") || norm.includes("pe") || norm.includes("calçado") || norm.includes("bota")) return Footprints;
  if (norm.includes("corpo") || norm.includes("vestimenta") || norm.includes("uniforme") || norm.includes("tronco")) return Shirt;
  if (norm.includes("queda") || norm.includes("cinto")) return Shield; // Fallback for some categories
  if (norm.includes("respiratória") || norm.includes("respirador") || norm.includes("máscara")) return Shield;
  return Tag;
};

interface CatalogProps {
  onBack: () => void;
}

interface EpiItem {
  id: string;
  nome: string;
  ca: string;
  categoria: string;
  quantidade: number;
  fotoUrl?: string;
}

export function Catalog({ onBack }: CatalogProps) {
  const [activeCategory, setActiveCategory] = useState("Todas as categorias");
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<EpiItem[]>([]);

  useEffect(() => {
    const q = query(collection(db, "epis"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setItems(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as EpiItem,
          ),
        );
      },
      (error) => handleFirestoreError(error, OperationType.GET, "epis"),
    );

    return () => unsub();
  }, []);

  const categories = [
    "Todas as categorias",
    ...Array.from(
      new Set(items.map((item) => item.categoria).filter(Boolean)),
    ).sort(),
  ];

  const filteredItems = items.filter((item) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      item.nome?.toLowerCase().includes(searchLower) ||
      item.ca?.includes(searchLower);
    const matchesCategory =
      activeCategory === "Todas as categorias" ||
      item.categoria === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col flex-1 bg-[#0D2027] h-full">
      {/* Header */}
      <div className="bg-[#152A32] px-6 pt-16 md:pt-12 pb-10 rounded-b-[40px] md:rounded-b-[50px] relative overflow-hidden bg-cover bg-center bg-no-repeat flex items-center md:justify-between text-white shrink-0 shadow-md"
        style={{ backgroundImage: 'linear-gradient(to bottom right, rgba(13, 32, 39, 0.95) 0%, rgba(13, 32, 39, 0.7) 100%), url("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200&q=80")' }}>
        <button onClick={onBack} className="p-2 -ml-2 md:hidden">
          <ChevronLeft size={24} />
        </button>
        <div className="hidden md:block p-2 cursor-pointer" onClick={onBack}>
          <ChevronLeft
            size={24}
            className="hover:text-gray-200 transition-colors"
          />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[#FFA767] tracking-tight drop-shadow-sm flex-1 text-center md:flex-none">
          Catálogo de EPIs
        </h1>
        <div className="w-8 md:hidden"></div>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden max-w-7xl mx-auto w-full border-x border-[#253B44] bg-[#152A32]">
        {/* Search */}
        <div className="p-4 md:p-6 shrink-0 bg-[#152A32] border-b border-[#253B44]">
          <div className="relative max-w-lg mx-auto md:mx-0 w-full">
            <Search
              size={22}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar EPI..."
              className="w-full bg-[#0D2027] border border-[#2C4550] rounded-full py-3.5 pl-12 pr-4 text-base focus:ring-2 focus:ring-[#FFA767] outline-none transition-colors focus:bg-[#152A32]"
            />
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden flex-col">
          {/* Categories Menu */}
          <div className="bg-[#0D2027] overflow-x-auto border-b border-[#253B44] shrink-0 scrollbar-hide">
            <div className="flex gap-4 md:gap-6 px-4 md:px-6 py-5 md:py-6 w-max">
              {categories.map((cat) => {
                const CatIcon = getCategoryIcon(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className="flex flex-col items-center justify-start gap-2 md:gap-3 group shrink-0 w-[72px] md:w-[88px]"
                  >
                    <div className={cn(
                      "w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl shadow-sm border transition-all flex items-center justify-center mb-1 group-hover:scale-105",
                      activeCategory === cat
                        ? "bg-[#FFA767] border-[#FFA767] text-[#152A32] shadow-md"
                        : "bg-[#152A32] border-[#253B44] text-[#FFA767] hover:bg-[#1A333E] hover:shadow-md"
                    )}>
                      <CatIcon className="w-7 h-7 md:w-8 md:h-8" strokeWidth={activeCategory === cat ? 2 : 1.5} />
                    </div>
                    <span className={cn(
                      "text-xs md:text-sm font-bold text-center leading-tight px-1 transition-colors w-full whitespace-normal line-clamp-2",
                      activeCategory === cat ? "text-[#FFA767]" : "text-[#E2E8F0] group-hover:text-[#FFA767]"
                    )}>
                      {cat}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* List Items */}
          <div className="flex-1 bg-[#152A32] overflow-y-auto p-4 md:p-8 pb-safe pb-24">
            <h2 className="text-xl font-bold text-[#E2E8F0] mb-6 hidden md:block">
              {activeCategory}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="flex flex-row md:flex-col gap-4 items-center md:items-start border border-[#253B44] md:border-[#2C4550] bg-[#152A32] p-4 rounded-xl md:rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-16 h-16 md:w-full md:h-48 rounded-lg md:rounded-xl bg-[#0D2027] flex items-center justify-center p-2 shrink-0 border border-[#253B44] overflow-hidden">
                    {item.fotoUrl ? (
                      <img
                        src={item.fotoUrl}
                        alt={item.nome}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-3xl md:text-6xl">🧰</span>
                    )}
                  </div>
                  <div className="flex-1 w-full flex flex-col justify-center">
                    <h4
                      className="font-bold text-[#E2E8F0] text-base md:text-lg mb-1 line-clamp-2 md:line-clamp-1"
                      title={item.nome}
                    >
                      {item.nome}
                    </h4>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start md:items-center gap-1 mt-1 md:mt-2">
                      <p className="text-sm text-[#64748B] font-medium">
                        CA: {item.ca || "N/A"}
                      </p>
                      <p
                        className={cn(
                          "text-xs md:text-sm font-bold px-2 py-1 rounded-md max-w-fit md:-ml-1",
                          item.quantidade > 0
                            ? "bg-[#152A32] text-green-700"
                            : "bg-red-50 text-red-700",
                        )}
                      >
                        {item.quantidade > 0
                          ? `Estoque: ${item.quantidade}`
                          : "Sem Estoque"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {filteredItems.length === 0 && (
                <div className="col-span-full py-12 text-center flex flex-col items-center justify-center text-[#475569]">
                  <span className="text-4xl mb-4">📭</span>
                  <p className="text-sm md:text-base">
                    Nenhum EPI encontrado nesta categoria.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
