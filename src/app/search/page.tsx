"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FilterSidebar, { Filters } from '@/components/search/FilterSidebar';
import GridCard from '@/components/search/GridCard';
import ListRow from '@/components/search/ListRow';
import SkeletonCard from '@/components/search/SkeletonCard';
import ActiveFilterChips from '@/components/search/ActiveFilterChips';
import ResultsHeader from '@/components/search/ResultsHeader';
import api from '@/lib/api';
import { Search as SearchIcon, AlertCircle } from 'lucide-react';

// ─── Default filter state ────────────────────────────────────────────────────
const DEFAULT_FILTERS: Filters = {
  search: '',
  marca: [],
  modelo: [],
  location: [],
  cor: [],
  sourceName: [],
  tipo: [],
  tipoDeMonta: [],
  anoMin: '',
  anoMax: '',
  precoMin: '',
  precoMax: '',
  sort: '-createdAt',
  page: 1,
  limit: 20,
};

// ─── Helpers: URL ↔ Filters ──────────────────────────────────────────────────
function filtersToParams(f: Filters): Record<string, string> {
  const p: Record<string, string> = {};
  if (f.search) p.search = f.search;
  if (f.marca.length) p.marca = f.marca.join(',');
  if (f.modelo.length) p.modelo = f.modelo.join(',');
  if (f.location.length) p.location = f.location.join(',');
  if (f.cor.length) p.cor = f.cor.join(',');
  if (f.sourceName.length) p.sourceName = f.sourceName.join(',');
  if (f.tipo.length) p.tipo = f.tipo.join(',');
  if (f.tipoDeMonta.length) p.tipoDeMonta = f.tipoDeMonta.join(',');
  if (f.anoMin) p.anoMin = f.anoMin;
  if (f.anoMax) p.anoMax = f.anoMax;
  if (f.precoMin) p.precoMin = f.precoMin;
  if (f.precoMax) p.precoMax = f.precoMax;
  if (f.sort !== '-createdAt') p.sort = f.sort;
  if (f.page > 1) p.page = String(f.page);
  return p;
}

function paramsToFilters(params: URLSearchParams): Filters {
  return {
    search: params.get('search') || '',
    marca: params.get('marca') ? params.get('marca')!.split(',') : [],
    modelo: params.get('modelo') ? params.get('modelo')!.split(',') : [],
    location: params.get('location') ? params.get('location')!.split(',') : [],
    cor: params.get('cor') ? params.get('cor')!.split(',') : [],
    sourceName: params.get('sourceName') ? params.get('sourceName')!.split(',') : [],
    tipo: params.get('tipo') ? params.get('tipo')!.split(',') : [],
    tipoDeMonta: params.get('tipoDeMonta') ? params.get('tipoDeMonta')!.split(',') : [],
    anoMin: params.get('anoMin') || '',
    anoMax: params.get('anoMax') || '',
    precoMin: params.get('precoMin') || '',
    precoMax: params.get('precoMax') || '',
    sort: params.get('sort') || '-createdAt',
    page: Number(params.get('page') || 1),
    limit: 20,
  };
}

// ─── Grid columns class ───────────────────────────────────────────────────────
// Mobile: 1 col | Tablet (md): 3 cols | Large (lg, ~1280): 4 cols | Widescreen (2xl, ~1536): 5 cols
const GRID_COLS = 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5';

// ─── Inner Component ─────────────────────────────────────────────────────────
function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Filters>(() => paramsToFilters(searchParams));
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const isFirstRender = useRef(true);

  // Build API params
  const buildApiParams = useCallback((f: Filters) => {
    const p: Record<string, any> = { page: f.page, limit: f.limit, sort: f.sort };
    if (f.search) p.search = f.search;
    if (f.marca.length) p.marca = f.marca.join(',');
    if (f.modelo.length) p.modelo = f.modelo.join(',');
    if (f.location.length) p.location = f.location.join(',');
    if (f.cor.length) p.cor = f.cor.join(',');
    if (f.sourceName.length) p.sourceName = f.sourceName.join(',');
    if (f.tipo.length) p.tipo = f.tipo.join(',');
    if (f.tipoDeMonta.length) p.tipoDeMonta = f.tipoDeMonta.join(',');
    if (f.anoMin) p.anoMin = f.anoMin;
    if (f.anoMax) p.anoMax = f.anoMax;
    if (f.precoMin) p.precoMin = f.precoMin;
    if (f.precoMax) p.precoMax = f.precoMax;
    return p;
  }, []);

  // Fetch lots
  const fetchLots = useCallback(async (f: Filters) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.get('/lots', { params: buildApiParams(f) });
      if (resp.data.success) {
        let fetchedLots = resp.data.data.lots;

        setLots(fetchedLots);
        setPagination(resp.data.data.pagination);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Não foi possível carregar os lotes.');
    } finally {
      setLoading(false);
    }
  }, [buildApiParams]);

  useEffect(() => { fetchLots(filters); }, [filters, fetchLots]);

  // Sync state from URL (important for Header search or browser back/forward)
  useEffect(() => {
    const fromUrl = paramsToFilters(searchParams);
    // Simple check to see if we really need to update state
    // We compare key values that affect the search
    const hasChanged =
      fromUrl.search !== filters.search ||
      fromUrl.marca.join(',') !== filters.marca.join(',') ||
      fromUrl.modelo.join(',') !== filters.modelo.join(',') ||
      fromUrl.location.join(',') !== filters.location.join(',') ||
      fromUrl.cor.join(',') !== filters.cor.join(',') ||
      fromUrl.sourceName.join(',') !== filters.sourceName.join(',') ||
      fromUrl.tipo.join(',') !== filters.tipo.join(',') ||
      fromUrl.tipoDeMonta.join(',') !== filters.tipoDeMonta.join(',') ||
      fromUrl.page !== filters.page ||
      fromUrl.sort !== filters.sort ||
      fromUrl.anoMin !== filters.anoMin ||
      fromUrl.anoMax !== filters.anoMax ||
      fromUrl.precoMin !== filters.precoMin ||
      fromUrl.precoMax !== filters.precoMax;

    if (hasChanged) {
      setFilters(fromUrl);
    }
  }, [searchParams]);

  // Sync URL from state (skip first render)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const params = new URLSearchParams(filtersToParams(filters));
    const currentPath = `/search?${params.toString()}`;

    // Only push if the URL actually changed to avoid history spam
    if (window.location.search !== `?${params.toString()}`) {
      router.push(currentPath, { scroll: false });
    }
  }, [filters, router]);

  const handleFilterChange = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const handleApply = useCallback(() => {
    setFilters(prev => ({ ...prev, page: 1 }));
    setMobileFiltersOpen(false);
  }, []);

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const handleRemoveFilter = useCallback((key: string, value?: string) => {
    setFilters(prev => {
      const f = { ...prev } as any;
      if (Array.isArray(f[key]) && value !== undefined) {
        f[key] = (f[key] as string[]).filter((v: string) => v !== value);
      } else {
        f[key] = Array.isArray(f[key]) ? [] : '';
      }
      f.page = 1;
      return f;
    });
  }, []);

  const setPage = (p: number) => setFilters(prev => ({ ...prev, page: p }));

  const totalPages = pagination.pages;
  const currentPage = pagination.page;

  const pageNumbers = (() => {
    const range: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  })();

  const hasActiveFilters = Object.entries(filters).some(([k, v]) => {
    if (['page', 'limit', 'sort'].includes(k)) return false;
    return Array.isArray(v) ? v.length > 0 : v !== '';
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── Desktop layout: Sidebar left + Results right ─────────────────── */}
        <div className="flex gap-6 items-start">

          {/* Desktop Sidebar — hidden on mobile/tablet */}
          <aside className="hidden lg:block w-64 xl:w-72 shrink-0 sticky top-24 self-start">
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
              <FilterSidebar
                filters={filters}
                onChange={handleFilterChange}
                onApply={handleApply}
                onReset={handleReset}
              />
            </div>
          </aside>

          {/* Results Area */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">

            {/* Results Header (sort + grid/list toggle + mobile filter button) */}
            <div className="px-1 py-2">
              <ResultsHeader
                total={pagination.total}
                sort={filters.sort}
                viewMode={viewMode}
                onSortChange={(s) => handleFilterChange('sort', s as any)}
                onViewModeChange={setViewMode}
                onOpenFilters={() => setMobileFiltersOpen(o => !o)}
              />

              {/* Active filter chips */}
              {hasActiveFilters && (
                <div className="mt-4">
                  <ActiveFilterChips
                    filters={filters}
                    onRemove={handleRemoveFilter}
                    onClearAll={handleReset}
                  />
                </div>
              )}
            </div>

            {/* ── Mobile/Tablet filter panel (horizontal collapsible) ─────── */}
            <div className="lg:hidden">
              {mobileFiltersOpen && (
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
                  {/* Horizontal filter bar — quick fields in a row */}
                  <div className="flex flex-wrap gap-3">
                    <FilterSidebar
                      filters={filters}
                      onChange={handleFilterChange}
                      onApply={handleApply}
                      onReset={handleReset}
                      horizontal
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Cards Grid or List */}
            {loading ? (
              <div className={viewMode === 'grid' ? `grid gap-4 ${GRID_COLS}` : 'flex flex-col gap-3'}>
                {[...Array(10)].map((_, i) => (
                  <SkeletonCard key={i} viewMode={viewMode} />
                ))}
              </div>
            ) : error ? (
              <div className="bg-white border border-red-100 rounded-xl p-10 text-center flex flex-col items-center gap-4">
                <AlertCircle className="h-10 w-10 text-red-400" />
                <div>
                  <h3 className="text-base font-bold text-gray-900">Ops! Algo deu errado.</h3>
                  <p className="text-sm text-gray-500 mt-1 max-w-sm">{error}</p>
                </div>
                <button
                  onClick={() => fetchLots(filters)}
                  className="bg-red-50 text-red-600 border border-red-100 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            ) : lots.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-xl p-16 text-center flex flex-col items-center gap-5">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                  <SearchIcon className="h-9 w-9 text-gray-200" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Nenhum lote encontrado</h3>
                  <p className="text-sm text-gray-400 mt-1.5 max-w-sm mx-auto">
                    Tente remover alguns filtros para ver mais opções.
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Ver todos os lotes
                </button>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? `grid gap-4 ${GRID_COLS}` : 'flex flex-col gap-3'}>
                {lots.map(lot =>
                  viewMode === 'grid'
                    ? <GridCard key={lot._id} lot={lot} />
                    : <ListRow key={lot._id} lot={lot} />
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-gray-500 font-medium">
                  Página <span className="font-bold text-gray-700">{currentPage}</span> de{' '}
                  <span className="font-bold text-gray-700">{totalPages}</span>
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-700 transition-colors bg-white"
                  >
                    Anterior
                  </button>
                  {pageNumbers.map(n => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`w-9 h-9 rounded-lg text-xs font-semibold transition-colors ${n === currentPage
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-500 hover:text-emerald-600'
                        }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-700 transition-colors bg-white"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Exported page wrapped in Suspense (required for useSearchParams in Next.js)
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Carregando...</div>
      </div>
    }>
      <SearchPageInner />
    </Suspense>
  );
}
