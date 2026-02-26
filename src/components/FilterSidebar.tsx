"use client";

import { useState, useEffect } from 'react';
import { Search, RotateCcw, Filter, Sparkles } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import api from '@/lib/api';

interface FilterSidebarProps {
    filters: any;
    setFilters: (filters: any) => void;
    onApply: () => void;
}

export default function FilterSidebar({ filters, setFilters, onApply }: FilterSidebarProps) {
    const [distinctValues, setDistinctValues] = useState<{
        marcas: string[];
        modelos: string[];
        localidades: string[];
        leiloeiros: string[];
        cores: string[];
    }>({
        marcas: [],
        modelos: [],
        localidades: [],
        leiloeiros: [],
        cores: []
    });

    const [loading, setLoading] = useState({
        marcas: true,
        modelos: false,
        localidades: true,
        leiloeiros: true,
        cores: true
    });

    useEffect(() => {
        async function fetchInitialValues() {
            setLoading(prev => ({ ...prev, marcas: true, cores: true, localidades: true, leiloeiros: true }));
            try {
                const response = await api.get('/lots/distinct-values');
                if (response.data.success) {
                    setDistinctValues(prev => ({
                        ...prev,
                        marcas: response.data.data.marcas,
                        cores: response.data.data.cores,
                        localidades: response.data.data.localidades,
                        leiloeiros: response.data.data.leiloeiros
                    }));
                }
            } catch (error) {
                console.error('Error fetching initial values:', error);
            } finally {
                setLoading(prev => ({ ...prev, marcas: false, cores: false, localidades: false, leiloeiros: false }));
            }
        }
        fetchInitialValues();
    }, []);

    useEffect(() => {
        if (!filters.marca) {
            setDistinctValues(prev => ({ ...prev, modelos: [] }));
            return;
        }

        async function fetchModels() {
            setLoading(prev => ({ ...prev, modelos: true }));
            try {
                const response = await api.get('/lots/distinct-values', {
                    params: { marca: filters.marca }
                });
                if (response.data.success) {
                    setDistinctValues(prev => ({ ...prev, modelos: response.data.data.modelos }));
                }
            } catch (error) {
                console.error('Error fetching models:', error);
            } finally {
                setLoading(prev => ({ ...prev, modelos: false }));
            }
        }
        fetchModels();
    }, [filters.marca]);

    const handleMarcaChange = (val: string) => {
        setFilters((prev: any) => ({
            ...prev,
            marca: val,
            modelo: '',
            page: 1
        }));
    };

    const handleModeloChange = (val: string) => {
        setFilters((prev: any) => ({
            ...prev,
            modelo: val,
            page: 1
        }));
    };

    const handleChange = (name: string, value: any) => {
        setFilters((prev: any) => ({ ...prev, [name]: value, page: 1 }));
    };

    const handleReset = () => {
        setFilters({
            marca: '',
            modelo: '',
            sourceName: '',
            location: '',
            cor: '',
            anoMin: '',
            anoMax: '',
            precoMin: '',
            precoMax: '',
            search: '',
            page: 1,
            limit: 20,
            sort: '-createdAt'
        });
    };

    const hasActiveFilters = Object.entries(filters).some(([key, val]) => {
        if (['page', 'limit', 'sort'].includes(key)) return false;
        return val !== '' && val !== null && val !== undefined;
    });

    return (
        <aside className="w-full lg:w-64 flex-shrink-0 space-y-4 lg:block bg-white p-4 rounded-lg border border-gray-100 shadow-sm h-fit sticky top-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5 text-emerald-600" />
                    <h2 className="text-[11px] font-bold text-gray-900 uppercase tracking-wider">Filtros</h2>
                </div>
                {hasActiveFilters && (
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-emerald-600 transition-colors uppercase tracking-widest"
                    >
                        <RotateCcw className="h-3 w-3" /> Limpar
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {/* Global Search */}
                <div className="relative">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block px-1">Busca Rápida</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Marca, modelo..."
                            className="w-full rounded-md border border-gray-200 bg-gray-50/50 py-2 pl-3 pr-8 text-sm font-medium text-gray-700 placeholder:text-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
                            value={filters.search || ''}
                            onChange={(e) => handleChange('search', e.target.value)}
                        />
                        <Search className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <SearchableSelect
                        label="Marca"
                        options={distinctValues.marcas}
                        value={filters.marca}
                        onChange={handleMarcaChange}
                        placeholder="Todas as marcas"
                        disabled={loading.marcas}
                    />

                    <SearchableSelect
                        label="Modelo"
                        options={distinctValues.modelos}
                        value={filters.modelo}
                        onChange={handleModeloChange}
                        placeholder={filters.marca ? "Todos os modelos" : "Escolha a marca"}
                        disabled={!filters.marca || loading.modelos}
                    />

                    <SearchableSelect
                        label="Localidade"
                        options={distinctValues.localidades}
                        value={filters.location}
                        onChange={(val) => handleChange('location', val)}
                        placeholder="Quaisquer"
                        disabled={loading.localidades}
                    />

                    <SearchableSelect
                        label="Cor"
                        options={distinctValues.cores}
                        value={filters.cor}
                        onChange={(val) => handleChange('cor', val)}
                        placeholder="Quaisquer"
                        disabled={loading.cores}
                    />

                    <SearchableSelect
                        label="Organização"
                        options={distinctValues.leiloeiros}
                        value={filters.sourceName}
                        onChange={(val) => handleChange('sourceName', val)}
                        placeholder="Todas"
                        disabled={loading.leiloeiros}
                    />
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="space-y-1.5">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Ano</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="number"
                                placeholder="De"
                                className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-700 focus:border-emerald-500 focus:outline-none transition-all"
                                value={filters.anoMin || ''}
                                onChange={(e) => handleChange('anoMin', e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="Até"
                                className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-700 focus:border-emerald-500 focus:outline-none transition-all"
                                value={filters.anoMax || ''}
                                onChange={(e) => handleChange('anoMax', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Preço</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="number"
                                placeholder="Min"
                                className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-700 focus:border-emerald-500 focus:outline-none transition-all"
                                value={filters.precoMin || ''}
                                onChange={(e) => handleChange('precoMin', e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="Max"
                                className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-700 focus:border-emerald-500 focus:outline-none transition-all"
                                value={filters.precoMax || ''}
                                onChange={(e) => handleChange('precoMax', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={onApply}
                className="w-full rounded-lg bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all active:scale-[0.98] uppercase tracking-wide"
            >
                Filtrar Resultados
            </button>
        </aside>
    );
}
