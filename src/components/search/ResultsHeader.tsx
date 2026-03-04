"use client";

import { LayoutGrid, List, Filter } from 'lucide-react';

interface ResultsHeaderProps {
    total: number;
    sort: string;
    viewMode: 'grid' | 'list';
    onSortChange: (sort: string) => void;
    onViewModeChange: (mode: 'grid' | 'list') => void;
    onOpenFilters?: () => void; // for mobile drawer
    title?: string;
    hideFilterButton?: boolean;
    extraActions?: React.ReactNode;
}

export default function ResultsHeader({
    total,
    sort,
    viewMode,
    onSortChange,
    onViewModeChange,
    onOpenFilters,
    title = "Resultados da busca",
    hideFilterButton = false,
    extraActions,
}: ResultsHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left */}
            <div className="flex items-center gap-3">
                {/* Mobile filter button */}
                {(onOpenFilters && !hideFilterButton) && (
                    <button
                        onClick={onOpenFilters}
                        className="lg:hidden flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold px-3 py-2 rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                    >
                        <Filter className="h-4 w-4" />
                        Filtrar
                    </button>
                )}
                <div>
                    <h1 className="text-lg font-bold text-gray-900 leading-tight uppercase tracking-tight">{title}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        <span className="font-semibold text-gray-700">{total.toLocaleString('pt-BR')}</span> anúncios encontrados
                    </p>
                </div>
            </div>

            {/* Right: Sort + View toggle */}
            <div className="flex items-center gap-2 shrink-0">
                {extraActions}
                <select
                    aria-label="Ordenar por"
                    value={sort}
                    onChange={(e) => onSortChange(e.target.value)}
                    className="bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2 outline-none cursor-pointer hover:border-gray-300 transition-colors"
                >
                    <option value="-createdAt">Mais recentes</option>
                    <option value="price_asc">Menor preço</option>
                    <option value="price_desc">Maior preço</option>
                    <option value="relevant">Mais relevantes</option>
                </select>

                {/* Grid/List toggle */}
                <div className="flex bg-gray-50 border border-gray-200 rounded-lg p-0.5">
                    <button
                        onClick={() => onViewModeChange('grid')}
                        aria-label="Modo grade"
                        aria-pressed={viewMode === 'grid'}
                        className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => onViewModeChange('list')}
                        aria-label="Modo lista"
                        aria-pressed={viewMode === 'list'}
                        className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <List className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
