"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import LotCard from '@/components/LotCard';
import FilterSidebar from '@/components/FilterSidebar';
import { Lot, LotsResponse } from '@/types';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const itemsPerPage = 20;

  const [filters, setFilters] = useState({
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
    limit: itemsPerPage,
    sort: '-createdAt'
  });

  const fetchLots = async (page = filters.page) => {
    setLoading(true);
    try {
      const response = await api.get<LotsResponse>('/lots', {
        params: { ...filters, page }
      });
      setLots(response.data.data.lots);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching lots:', error);
    } finally {
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    fetchLots();
  }, [filters.page, filters.sort]); // Refetch when page or sort changes

  const handleApplyFilters = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    fetchLots(1);
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <FilterSidebar
          filters={filters}
          setFilters={setFilters}
          onApply={handleApplyFilters}
        />

        {/* Main Content */}
        <div className="flex-1">
          <div className="mb-6 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="z-10">
              <h1 className="text-2xl font-bold text-gray-900">
                Resultados da Busca
              </h1>
              <span className="text-sm text-gray-500">
                {loading ? 'Carregando...' : `${pagination.total} resultados encontrados`}
              </span>
            </div>

            {/* Seletor de visualização centralizado */}
            <div className="sm:absolute sm:left-1/2 sm:-translate-x-1/2 flex items-center gap-2 bg-gray-100 p-1 rounded-lg z-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                title="Visualização em Grade"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                title="Visualização em Lista"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="6" y2="6" /><line x1="3" x2="21" y1="12" y2="12" /><line x1="3" x2="21" y1="18" y2="18" /></svg>
              </button>
            </div>

            <div className="flex items-center gap-4 self-end sm:self-auto z-10">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ordenar por</label>
                <select
                  value={filters.sort}
                  onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value, page: 1 }))}
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 hover:border-emerald-500 transition-colors cursor-pointer"
                >
                  <option value="relevant">Mais Relevantes</option>
                  <option value="date_desc">Mais Recentes</option>
                  <option value="price_asc">Menor Preço</option>
                  <option value="price_desc">Maior Preço</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <>
              <div className={viewMode === 'grid'
                ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "flex flex-col gap-4"
              }>
                {lots.map((lot) => (
                  <LotCard key={lot._id} lot={lot} viewMode={viewMode} />
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination.pages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>

                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                      let pageNum = pagination.page;
                      if (pagination.page <= 3) pageNum = i + 1;
                      else if (pagination.page >= pagination.pages - 2) pageNum = pagination.pages - 4 + i;
                      else pageNum = pagination.page - 2 + i;

                      if (pageNum <= 0 || pageNum > pagination.pages) return null;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${pagination.page === pageNum ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'hover:bg-gray-50 text-gray-600 border border-gray-100'}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}

          {!loading && lots.length === 0 && (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <p className="text-lg font-medium text-gray-900">Nenhum veículo encontrado</p>
              <p className="mt-1 text-sm text-gray-500">Tente ajustar seus filtros para encontrar o que procura.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
