"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Search, RotateCcw, Filter, ChevronDown, Check, X
} from 'lucide-react';
import api from '@/lib/api';

// ─── Brazilian States ────────────────────────────────────────────────────────
const UF_LIST = [
    'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN',
    'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'
];

// ─── Types ───────────────────────────────────────────────────────────────────
export interface Filters {
    search: string;
    marca: string;
    modelo: string;
    location: string;
    cor: string[];
    sourceName: string[];
    anoMin: string;
    anoMax: string;
    precoMin: string;
    precoMax: string;
    sort: string;
    page: number;
    limit: number;
}

interface FilterSidebarProps {
    filters: Filters;
    onChange: (key: keyof Filters, value: any) => void;
    onApply: () => void;
    onReset: () => void;
    horizontal?: boolean; // mobile inline bar mode
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 px-0.5">
            {children}
        </span>
    );
}

/** Single-value searchable select */
function SingleSelect({
    label, options, value, onChange, placeholder, disabled,
}: {
    label: string; options: string[]; value: string;
    onChange: (v: string) => void; placeholder?: string; disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = options.filter(o => o.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => {
            const qs = q.toLowerCase();
            return (b.toLowerCase().startsWith(qs) ? 1 : 0) - (a.toLowerCase().startsWith(qs) ? 1 : 0);
        });

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

    return (
        <div className="relative" ref={ref}>
            <SectionLabel>{label}</SectionLabel>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen(o => !o)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg border transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-100' : 'cursor-pointer bg-white border-gray-200 hover:border-emerald-500'}
          ${open ? 'border-emerald-500 ring-1 ring-emerald-500/20' : ''}`}
            >
                <span className={`truncate ${!value ? 'text-gray-400' : 'text-gray-700 font-semibold'}`}>
                    {value || placeholder || 'Todos'}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform shrink-0 ml-1 ${open ? 'rotate-180 text-emerald-500' : ''}`} />
            </button>

            {open && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg overflow-hidden">
                    <div className="flex items-center gap-1.5 px-2.5 py-2 border-b border-gray-50 bg-gray-50/50">
                        <Search className="h-3 w-3 text-gray-400 shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Buscar..."
                            value={q}
                            onChange={e => setQ(e.target.value)}
                            className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
                        />
                        {q && <button onClick={() => setQ('')}><X className="h-3 w-3 text-gray-400" /></button>}
                    </div>
                    <div className="max-h-52 overflow-y-auto p-1">
                        {value && (
                            <button
                                onClick={() => { onChange(''); setOpen(false); setQ(''); }}
                                className="w-full text-left px-2.5 py-1.5 text-[11px] font-semibold text-red-500 hover:bg-red-50 rounded-md flex items-center gap-1.5"
                            >
                                <X className="h-3 w-3" /> Limpar seleção
                            </button>
                        )}
                        {filtered.length === 0 ? (
                            <p className="text-center text-[11px] text-gray-400 py-4">Nenhum resultado</p>
                        ) : filtered.map(opt => (
                            <button
                                key={opt}
                                onClick={() => { onChange(opt); setOpen(false); setQ(''); }}
                                className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md flex items-center justify-between transition-colors
                  ${value === opt ? 'bg-emerald-500 text-white font-semibold' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'}`}
                            >
                                <span className="truncate">{opt}</span>
                                {value === opt && <Check className="h-3 w-3 shrink-0" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/** Multi-value searchable select */
function MultiSelect({
    label, options, values, onChange, placeholder, disabled,
}: {
    label: string; options: string[]; values: string[];
    onChange: (v: string[]) => void; placeholder?: string; disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = options.filter(o => o.toLowerCase().includes(q.toLowerCase()));

    const toggle = (opt: string) => {
        const next = values.includes(opt)
            ? values.filter(v => v !== opt)
            : [...values, opt];
        onChange(next);
    };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

    const display = values.length === 0 ? (placeholder || 'Todas')
        : values.length === 1 ? values[0]
            : `${values[0]} +${values.length - 1}`;

    return (
        <div className="relative" ref={ref}>
            <SectionLabel>{label}</SectionLabel>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen(o => !o)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg border transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-100' : 'cursor-pointer bg-white border-gray-200 hover:border-emerald-500'}
          ${open ? 'border-emerald-500 ring-1 ring-emerald-500/20' : ''}`}
            >
                <span className={`truncate ${values.length === 0 ? 'text-gray-400' : 'text-gray-700 font-semibold'}`}>
                    {display}
                </span>
                <div className="flex items-center gap-1 shrink-0 ml-1">
                    {values.length > 0 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onChange([]); }}
                            className="p-0.5 rounded-full hover:bg-gray-100"
                            aria-label="Limpar"
                        >
                            <X className="h-3 w-3 text-gray-400" />
                        </button>
                    )}
                    <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? 'rotate-180 text-emerald-500' : ''}`} />
                </div>
            </button>

            {open && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg overflow-hidden">
                    <div className="flex items-center gap-1.5 px-2.5 py-2 border-b border-gray-50 bg-gray-50/50">
                        <Search className="h-3 w-3 text-gray-400 shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Buscar..."
                            value={q}
                            onChange={e => setQ(e.target.value)}
                            className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
                        />
                        {q && <button onClick={() => setQ('')}><X className="h-3 w-3 text-gray-400" /></button>}
                    </div>
                    <div className="max-h-52 overflow-y-auto p-1">
                        {filtered.length === 0 ? (
                            <p className="text-center text-[11px] text-gray-400 py-4">Nenhum resultado</p>
                        ) : filtered.map(opt => (
                            <button
                                key={opt}
                                onClick={() => toggle(opt)}
                                className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md flex items-center justify-between transition-colors
                  ${values.includes(opt) ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'}`}
                            >
                                <span className="truncate">{opt}</span>
                                {values.includes(opt) && <Check className="h-3 w-3 text-emerald-500 shrink-0" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
export default function FilterSidebar({ filters, onChange, onApply, onReset, horizontal = false }: FilterSidebarProps) {
    const [distinctValues, setDistinctValues] = useState({
        marcas: [] as string[],
        modelos: [] as string[],
        localidades: [] as string[],
        leiloeiros: [] as string[],
        cores: [] as string[],
    });
    const [loading, setLoading] = useState({
        marcas: true, modelos: false, cores: true, localidades: true, leiloeiros: true,
    });

    // Fetch initial filter values
    useEffect(() => {
        async function fetchInitial() {
            try {
                const resp = await api.get('/lots/distinct-values');
                if (resp.data.success) {
                    const d = resp.data.data;
                    setDistinctValues(prev => ({
                        ...prev,
                        marcas: d.marcas || [],
                        cores: d.cores || [],
                        localidades: d.localidades || [],
                        leiloeiros: d.leiloeiros || [],
                    }));
                }
            } catch (err) {
                console.error('Failed to load filter values:', err);
            } finally {
                setLoading(prev => ({ ...prev, marcas: false, cores: false, localidades: false, leiloeiros: false }));
            }
        }
        fetchInitial();
    }, []);

    // Fetch models when brand changes
    useEffect(() => {
        if (!filters.marca) {
            setDistinctValues(prev => ({ ...prev, modelos: [] }));
            return;
        }
        async function fetchModels() {
            setLoading(prev => ({ ...prev, modelos: true }));
            try {
                const resp = await api.get('/lots/distinct-values', { params: { marca: filters.marca } });
                if (resp.data.success) {
                    setDistinctValues(prev => ({ ...prev, modelos: resp.data.data.modelos || [] }));
                }
            } catch (err) {
                console.error('Failed to load models:', err);
            } finally {
                setLoading(prev => ({ ...prev, modelos: false }));
            }
        }
        fetchModels();
    }, [filters.marca]);
    const hasActive = Object.entries(filters).some(([k, v]) => {
        if (['page', 'limit', 'sort'].includes(k)) return false;
        if (Array.isArray(v)) return v.length > 0;
        return v !== '' && v !== null && v !== undefined;
    });

    // Combine API localidades + static UF list (deduplicated)
    const allUFs = Array.from(new Set([
        ...UF_LIST,
        ...(distinctValues.localidades || [])
            .map(l => {
                // Se a string contiver '/', tenta pegar o que vem depois (ex: 'Jacarei / SP')
                // Se não, tenta ver se a própria string é uma UF de 2 letras
                const parts = l.split('/');
                const potUF = (parts.length > 1 ? parts[parts.length - 1] : l).trim().toUpperCase();
                return (potUF.length === 2 && UF_LIST.includes(potUF)) ? potUF : null;
            })
            .filter((v): v is string => !!v)
    ])).sort();

    // ── Horizontal (mobile) mode ─────────────────────────────────────────
    if (horizontal) {
        return (
            <div className="w-full flex flex-col gap-3">
                {/* Row 1: Marca + Modelo + Location */}
                <div className="flex flex-wrap gap-2 items-end">
                    <div className="flex-1 min-w-[120px]">
                        <SingleSelect
                            label="Marca"
                            options={distinctValues.marcas}
                            value={filters.marca}
                            onChange={val => { onChange('marca', val); onChange('modelo', ''); }}
                            placeholder={loading.marcas ? 'Carregando...' : 'Marca'}
                            disabled={loading.marcas}
                        />
                    </div>
                    <div className="flex-1 min-w-[120px]">
                        <SingleSelect
                            label="Modelo"
                            options={distinctValues.modelos}
                            value={filters.modelo}
                            onChange={val => onChange('modelo', val)}
                            placeholder={!filters.marca ? 'Escolha marca' : 'Modelo'}
                            disabled={!filters.marca || loading.modelos}
                        />
                    </div>
                    <div className="flex-1 min-w-[100px]">
                        <SingleSelect
                            label="Estado"
                            options={allUFs}
                            value={filters.location}
                            onChange={val => onChange('location', val)}
                            placeholder="UF"
                        />
                    </div>
                    <div className="flex-1 min-w-[120px]">
                        <MultiSelect
                            label="Cor"
                            options={distinctValues.cores}
                            values={filters.cor}
                            onChange={vals => onChange('cor', vals)}
                            placeholder="Cor"
                            disabled={loading.cores}
                        />
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <MultiSelect
                            label="Organização"
                            options={distinctValues.leiloeiros}
                            values={filters.sourceName}
                            onChange={vals => onChange('sourceName', vals)}
                            placeholder="Organização"
                            disabled={loading.leiloeiros}
                        />
                    </div>
                </div>
                {/* Row 2: Year + Price + Buttons */}
                <div className="flex flex-wrap gap-2 items-end">
                    <div className="flex items-end gap-1 min-w-[160px]">
                        <div className="flex-1">
                            <SectionLabel>Ano de</SectionLabel>
                            <input type="number" placeholder="De" value={filters.anoMin} onChange={e => onChange('anoMin', e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-gray-700 focus:border-emerald-500 focus:outline-none" />
                        </div>
                        <span className="text-gray-300 mb-2">–</span>
                        <div className="flex-1">
                            <SectionLabel>até</SectionLabel>
                            <input type="number" placeholder="Até" value={filters.anoMax} onChange={e => onChange('anoMax', e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-gray-700 focus:border-emerald-500 focus:outline-none" />
                        </div>
                    </div>
                    <div className="flex items-end gap-1 min-w-[180px]">
                        <div className="flex-1">
                            <SectionLabel>Preço mín.</SectionLabel>
                            <input type="number" placeholder="Min" value={filters.precoMin} onChange={e => onChange('precoMin', e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-gray-700 focus:border-emerald-500 focus:outline-none" />
                        </div>
                        <span className="text-gray-300 mb-2">–</span>
                        <div className="flex-1">
                            <SectionLabel>máx.</SectionLabel>
                            <input type="number" placeholder="Max" value={filters.precoMax} onChange={e => onChange('precoMax', e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-gray-700 focus:border-emerald-500 focus:outline-none" />
                        </div>
                    </div>
                    <div className="flex items-end gap-2 ml-auto">
                        {hasActive && (
                            <button onClick={onReset}
                                className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors">
                                Limpar
                            </button>
                        )}
                        <button onClick={onApply}
                            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors">
                            Filtrar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Vertical (desktop) mode ───────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5 text-emerald-600" />
                    <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Filtros</h2>
                </div>
                {hasActive && (
                    <button
                        onClick={onReset}
                        className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 hover:text-emerald-600 transition-colors uppercase tracking-widest"
                    >
                        <RotateCcw className="h-3 w-3" /> Limpar
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4">
                <SingleSelect
                    label="Marca"
                    options={distinctValues.marcas}
                    value={filters.marca}
                    onChange={val => {
                        onChange('marca', val);
                        onChange('modelo', '');
                    }}
                    placeholder={loading.marcas ? 'Carregando...' : 'Todas as marcas'}
                    disabled={loading.marcas}
                />

                <SingleSelect
                    label="Modelo"
                    options={distinctValues.modelos}
                    value={filters.modelo}
                    onChange={val => onChange('modelo', val)}
                    placeholder={!filters.marca ? 'Escolha a marca primeiro' : loading.modelos ? 'Carregando...' : 'Todos os modelos'}
                    disabled={!filters.marca || loading.modelos}
                />

                <SingleSelect
                    label="Estado (UF)"
                    options={allUFs}
                    value={filters.location}
                    onChange={val => onChange('location', val)}
                    placeholder="Qualquer estado"
                />

                <MultiSelect
                    label="Cor"
                    options={distinctValues.cores}
                    values={filters.cor}
                    onChange={vals => onChange('cor', vals)}
                    placeholder={loading.cores ? 'Carregando...' : 'Todas as cores'}
                    disabled={loading.cores}
                />

                <MultiSelect
                    label="Organização"
                    options={distinctValues.leiloeiros}
                    values={filters.sourceName}
                    onChange={vals => onChange('sourceName', vals)}
                    placeholder={loading.leiloeiros ? 'Carregando...' : 'Todas'}
                    disabled={loading.leiloeiros}
                />
            </div>

            {/* Separator */}
            <div className="border-t border-gray-100" />

            {/* Year range */}
            <div>
                <SectionLabel>Ano</SectionLabel>
                <div className="grid grid-cols-2 gap-2">
                    <input
                        type="number"
                        placeholder="De"
                        aria-label="Ano mínimo"
                        min="1950"
                        max="2030"
                        value={filters.anoMin}
                        onChange={e => onChange('anoMin', e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all"
                    />
                    <input
                        type="number"
                        placeholder="Até"
                        aria-label="Ano máximo"
                        min="1950"
                        max="2030"
                        value={filters.anoMax}
                        onChange={e => onChange('anoMax', e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all"
                    />
                </div>
            </div>

            {/* Price range */}
            <div>
                <SectionLabel>Preço (R$)</SectionLabel>
                <div className="grid grid-cols-2 gap-2">
                    <input
                        type="number"
                        placeholder="Mínimo"
                        aria-label="Preço mínimo"
                        min="0"
                        value={filters.precoMin}
                        onChange={e => onChange('precoMin', e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all"
                    />
                    <input
                        type="number"
                        placeholder="Máximo"
                        aria-label="Preço máximo"
                        min="0"
                        value={filters.precoMax}
                        onChange={e => onChange('precoMax', e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all"
                    />
                </div>
            </div>

            {/* Apply button */}
            <button
                onClick={onApply}
                className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-xs font-bold text-white hover:bg-emerald-700 transition-all active:scale-[0.98] uppercase tracking-wide shadow-sm"
            >
                Filtrar resultados
            </button>
        </div>
    );
}
