"use client";

import { useState, useEffect } from "react";
import { Loader2, ChevronDown } from "lucide-react";

interface FipeBrand {
    codigo: string;
    nome: string;
}

interface FipeModel {
    codigo: number;
    nome: string;
}

interface Props {
    vehicleType?: "carros" | "motos" | "caminhoes";
    onBrandChange: (brand: string) => void;
    onModelChange: (model: string) => void;
    brandValue: string;
    modelValue: string;
}

const FIPE_BASE = "https://parallelum.com.br/fipe/api/v1";

export default function FipeSelector({
    vehicleType = "carros",
    onBrandChange,
    onModelChange,
    brandValue,
    modelValue,
}: Props) {
    const [brands, setBrands] = useState<FipeBrand[]>([]);
    const [models, setModels] = useState<FipeModel[]>([]);
    const [loadingBrands, setLoadingBrands] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);
    const [selectedBrandCode, setSelectedBrandCode] = useState<string>("");

    // Fetch brands on mount or when vehicleType changes
    useEffect(() => {
        setLoadingBrands(true);
        setBrands([]);
        setModels([]);
        setSelectedBrandCode("");
        fetch(`${FIPE_BASE}/${vehicleType}/marcas`)
            .then(r => r.json())
            .then((data: FipeBrand[]) => setBrands(data))
            .catch(() => setBrands([]))
            .finally(() => setLoadingBrands(false));
    }, [vehicleType]);

    // Fetch models when brand is selected
    useEffect(() => {
        if (!selectedBrandCode) { setModels([]); return; }
        setLoadingModels(true);
        setModels([]);
        fetch(`${FIPE_BASE}/${vehicleType}/marcas/${selectedBrandCode}/modelos`)
            .then(r => r.json())
            .then((data: { modelos: FipeModel[] }) => setModels(data.modelos || []))
            .catch(() => setModels([]))
            .finally(() => setLoadingModels(false));
    }, [selectedBrandCode, vehicleType]);

    const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = brands.find(b => b.codigo === e.target.value);
        setSelectedBrandCode(e.target.value);
        onBrandChange(selected?.nome || "");
        onModelChange(""); // reset model when brand changes
    };

    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onModelChange(e.target.value);
    };

    const selectClass = (disabled?: boolean) =>
        `w-full px-3 py-3 bg-white border rounded-xl text-sm appearance-none focus:outline-none transition-all pr-8 ${disabled
            ? "border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50"
            : "border-slate-200 focus:border-emerald-500 text-slate-800 cursor-pointer hover:border-slate-300"
        }`;

    return (
        <div className="grid grid-cols-2 gap-2">
            {/* Marca */}
            <div className="relative">
                <select
                    value={selectedBrandCode}
                    onChange={handleBrandChange}
                    disabled={loadingBrands}
                    className={selectClass(loadingBrands)}
                >
                    <option value="">
                        {loadingBrands ? "Carregando marcas..." : "Marca"}
                    </option>
                    {brands.map(b => (
                        <option key={b.codigo} value={b.codigo}>{b.nome}</option>
                    ))}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    {loadingBrands
                        ? <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                        : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                </div>
            </div>

            {/* Modelo — disabled until brand is selected */}
            <div className="relative">
                <select
                    value={modelValue}
                    onChange={handleModelChange}
                    disabled={!selectedBrandCode || loadingModels}
                    className={selectClass(!selectedBrandCode || loadingModels)}
                >
                    <option value="">
                        {!selectedBrandCode
                            ? "Selecione a marca primeiro"
                            : loadingModels
                                ? "Carregando modelos..."
                                : "Modelo"}
                    </option>
                    {models.map(m => (
                        <option key={m.codigo} value={m.nome}>{m.nome}</option>
                    ))}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    {loadingModels
                        ? <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                        : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                </div>
            </div>
        </div>
    );
}
