import { useState, useEffect } from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';
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

    // 1. Fetch Marcas, Cores, Localidades e Leiloeiros iniciais
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

    // 2. Fetch Modelos quando Marca muda
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

    return (
        <aside className="w-full lg:w-72 flex-shrink-0 space-y-6 lg:block bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit sticky top-24">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-emerald-600" />
                    <h2 className="text-base font-black text-gray-900 uppercase tracking-tighter">Filtros</h2>
                </div>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-emerald-600 transition-colors uppercase tracking-widest"
                >
                    <RotateCcw className="h-3 w-3" /> Limpar
                </button>
            </div>

            <div className="space-y-4">
                {/* Busca Textual */}
                <div className="relative">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Pesquisa livre</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Ex: Hilux 2022..."
                            className="w-full rounded-xl border border-gray-200 py-2.5 pl-3 pr-10 text-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                            value={filters.search || ''}
                            onChange={(e) => handleChange('search', e.target.value)}
                        />
                        <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <SearchableSelect
                        label="Organização"
                        options={distinctValues.leiloeiros}
                        value={filters.sourceName}
                        onChange={(val) => handleChange('sourceName', val)}
                        placeholder="Todas as organizações"
                        disabled={loading.leiloeiros}
                    />

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
                        placeholder={filters.marca ? "Todos os modelos" : "Escolha uma marca"}
                        disabled={!filters.marca || loading.modelos}
                    />

                    <SearchableSelect
                        label="Localidade"
                        options={distinctValues.localidades}
                        value={filters.location}
                        onChange={(val) => handleChange('location', val)}
                        placeholder="Em todo o Brasil"
                        disabled={loading.localidades}
                    />

                    <SearchableSelect
                        label="Cor"
                        options={distinctValues.cores}
                        value={filters.cor}
                        onChange={(val) => handleChange('cor', val)}
                        placeholder="Todas as cores"
                        disabled={loading.cores}
                    />
                </div>

                {/* Ano e Preço */}
                <div className="space-y-4 pt-2">
                    <div>
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Ano de Fabricação</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="number"
                                placeholder="De"
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                value={filters.anoMin || ''}
                                onChange={(e) => handleChange('anoMin', e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="Até"
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                value={filters.anoMax || ''}
                                onChange={(e) => handleChange('anoMax', e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Faixa de Preço</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="number"
                                placeholder="Mínimo"
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                value={filters.precoMin || ''}
                                onChange={(e) => handleChange('precoMin', e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="Máximo"
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                value={filters.precoMax || ''}
                                onChange={(e) => handleChange('precoMax', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={onApply}
                className="w-full rounded-2xl bg-emerald-600 px-4 py-4 text-sm font-black text-white shadow-lg shadow-emerald-100 hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all active:scale-[0.98] uppercase tracking-tight"
            >
                Aplicar Filtros
            </button>
        </aside>
    );
}
