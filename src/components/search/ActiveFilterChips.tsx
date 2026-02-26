"use client";

import { X } from 'lucide-react';

const LABEL_MAP: Record<string, string> = {
    search: 'Busca',
    marca: 'Marca',
    modelo: 'Modelo',
    location: 'Estado',
    cor: 'Cor',
    sourceName: 'Organização',
    anoMin: 'Ano mín.',
    anoMax: 'Ano máx.',
    precoMin: 'Preço mín.',
    precoMax: 'Preço máx.',
};

interface ActiveFilterChipsProps {
    filters: Record<string, any>;
    onRemove: (key: string, value?: string) => void;
    onClearAll: () => void;
}

export default function ActiveFilterChips({ filters, onRemove, onClearAll }: ActiveFilterChipsProps) {
    // Build list of active chips
    const chips: { key: string; label: string; value: string; removeVal?: string }[] = [];

    Object.entries(filters).forEach(([key, val]) => {
        if (['page', 'limit', 'sort'].includes(key)) return;
        if (!val || val === '') return;

        const label = LABEL_MAP[key] || key;

        if (Array.isArray(val)) {
            val.forEach((v: string) => {
                if (v) chips.push({ key, label, value: v, removeVal: v });
            });
        } else {
            chips.push({ key, label, value: String(val) });
        }
    });

    if (chips.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-2">
            {chips.map(({ key, label, value, removeVal }) => (
                <button
                    key={`${key}-${value}`}
                    onClick={() => onRemove(key, removeVal)}
                    className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-emerald-100 transition-colors"
                >
                    <span className="text-emerald-500 text-[10px] font-bold uppercase">{label}:</span>
                    {value}
                    <X className="h-3 w-3 ml-0.5 text-emerald-500" />
                </button>
            ))}
            <button
                onClick={onClearAll}
                className="text-xs font-semibold text-gray-400 hover:text-red-500 px-2 py-1.5 transition-colors"
            >
                Limpar tudo
            </button>
        </div>
    );
}
