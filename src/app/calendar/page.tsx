"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, Filter, Search, Calendar as CalendarIcon, MapPin, Tag, Car, Home, Truck, Building2, Gavel, RefreshCw, Loader2, Heart, Share2, Eye, LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { Lot } from "@/types";
import { useSession } from "next-auth/react";
import FilterSidebar, { Filters } from "@/components/search/FilterSidebar";
import GridCard from "@/components/search/GridCard";
import ListRow from "@/components/search/ListRow";
import SkeletonCard from "@/components/search/SkeletonCard";
import ActiveFilterChips from "@/components/search/ActiveFilterChips";
import ResultsHeader from "@/components/search/ResultsHeader";

// ─── Default filter state matching search page ───────────────────────────────
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
    limit: 50,
};

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
        limit: 50,
    };
}

export default function CalendarPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [lots, setLots] = useState<Lot[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingCalendar, setLoadingCalendar] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    // Filters
    const [filters, setFilters] = useState<Filters>(() => paramsToFilters(searchParams));

    // Sync state from URL
    useEffect(() => {
        const fromUrl = paramsToFilters(searchParams);
        const hasChanged =
            fromUrl.search !== filters.search ||
            fromUrl.marca.join(',') !== filters.marca.join(',') ||
            fromUrl.modelo.join(',') !== filters.modelo.join(',') ||
            fromUrl.location.join(',') !== filters.location.join(',') ||
            fromUrl.cor.join(',') !== filters.cor.join(',') ||
            fromUrl.sourceName.join(',') !== filters.sourceName.join(',') ||
            fromUrl.tipo.join(',') !== filters.tipo.join(',') ||
            fromUrl.tipoDeMonta.join(',') !== filters.tipoDeMonta.join(',') ||
            fromUrl.anoMin !== filters.anoMin ||
            fromUrl.anoMax !== filters.anoMax ||
            fromUrl.precoMin !== filters.precoMin ||
            fromUrl.precoMax !== filters.precoMax;

        if (hasChanged) {
            setFilters(fromUrl);
        }
    }, [searchParams]);

    // Sync URL from state
    useEffect(() => {
        const params = new URLSearchParams(filtersToParams(filters));
        if (selectedDate) {
            params.set('date', selectedDate.toISOString().split('T')[0]);
        }
        const currentPath = `/calendar?${params.toString()}`;
        if (window.location.search !== `?${params.toString()}`) {
            router.push(currentPath, { scroll: false });
        }
    }, [filters, selectedDate, router]);

    // Calculate calendar days
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Days from previous month to fill the first week
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        const prevMonthDays = [];
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            prevMonthDays.push({
                day: prevMonthLastDay - i,
                month: month - 1,
                year: month === 0 ? year - 1 : year,
                isCurrentMonth: false
            });
        }

        // Days of current month
        const currentMonthDays = [];
        for (let i = 1; i <= daysInMonth; i++) {
            currentMonthDays.push({
                day: i,
                month: month,
                year: year,
                isCurrentMonth: true
            });
        }

        // Days from next month to fill the last week
        const totalDays = prevMonthDays.length + currentMonthDays.length;
        const nextMonthDays = [];
        for (let i = 1; i <= (42 - totalDays); i++) {
            nextMonthDays.push({
                day: i,
                month: month + 1,
                year: month === 11 ? year + 1 : year,
                isCurrentMonth: false
            });
        }

        return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
    }, [currentDate]);

    // Fetch lots for the entire month to highlight days
    const [monthLots, setMonthLots] = useState<Lot[]>([]);
    useEffect(() => {
        const fetchMonthLots = async () => {
            setLoadingCalendar(true);
            try {
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                const dateMin = new Date(year, month, 1).toISOString();
                const dateMax = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

                const params: any = {
                    dateMin,
                    dateMax,
                    limit: 1000,
                    search: filters.search,
                    marca: filters.marca.join(','),
                    modelo: filters.modelo.join(','),
                    location: filters.location.join(','),
                    cor: filters.cor.join(','),
                    sourceName: filters.sourceName.join(','),
                    tipo: filters.tipo.join(','),
                    tipoDeMonta: filters.tipoDeMonta.join(','),
                    anoMin: filters.anoMin,
                    anoMax: filters.anoMax,
                    precoMin: filters.precoMin,
                    precoMax: filters.precoMax,
                };

                const res = await api.get(`/lots`, { params });
                setMonthLots(res.data.data.lots || []);
            } catch (err) {
                console.error("Error fetching month lots:", err);
            } finally {
                setLoadingCalendar(false);
            }
        };
        fetchMonthLots();
    }, [currentDate, filters]);

    // Fetch lots for selected date or current week
    useEffect(() => {
        const fetchLots = async () => {
            setLoading(true);
            try {
                let dateMin, dateMax;
                if (selectedDate) {
                    const start = new Date(selectedDate);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(selectedDate);
                    end.setHours(23, 59, 59, 999);
                    dateMin = start.toISOString();
                    dateMax = end.toISOString();
                } else {
                    // Default: this month view
                    const year = currentDate.getFullYear();
                    const month = currentDate.getMonth();
                    dateMin = new Date(year, month, 1).toISOString();
                    dateMax = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
                }

                const params: any = {
                    dateMin,
                    dateMax,
                    limit: 100,
                    search: filters.search,
                    marca: filters.marca.join(','),
                    modelo: filters.modelo.join(','),
                    location: filters.location.join(','),
                    cor: filters.cor.join(','),
                    sourceName: filters.sourceName.join(','),
                    tipo: filters.tipo.join(','),
                    tipoDeMonta: filters.tipoDeMonta.join(','),
                    anoMin: filters.anoMin,
                    anoMax: filters.anoMax,
                    precoMin: filters.precoMin,
                    precoMax: filters.precoMax,
                    sort: filters.sort
                };

                const res = await api.get(`/lots`, { params });
                setLots(res.data.data.lots || []);
                setTotalCount(res.data.data.pagination?.total || (res.data.data.lots?.length || 0));
            } catch (err) {
                console.error("Error fetching lots:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLots();
    }, [selectedDate, currentDate, filters]);

    const handleFilterChange = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    }, []);

    const handleReset = useCallback(() => {
        setFilters(DEFAULT_FILTERS);
    }, []);

    const getAuctionCount = (day: number, month: number, year: number) => {
        return monthLots.filter(lot => {
            if (!lot.endAt) return false;
            const date = new Date(lot.endAt);
            return date.getDate() === day && date.getMonth() === month && date.getFullYear() === year;
        }).length;
    };

    const isToday = (day: number, month: number, year: number) => {
        const today = new Date();
        return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
    };

    const isSelected = (day: number, month: number, year: number) => {
        if (!selectedDate) return false;
        return selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
    };

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });
    const year = currentDate.getFullYear();

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 py-10">
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl font-black text-slate-900 text-center uppercase tracking-tight">
                        Calendário de Leilões
                    </h1>
                    <p className="text-slate-400 text-center mt-2 flex items-center justify-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        {selectedDate ? selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : `Visão Mensal (${monthName})`}
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 mt-8">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Sidebar Filters */}
                    <aside className="hidden lg:block w-72 shrink-0">
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 sticky top-24">
                            <FilterSidebar
                                filters={filters}
                                onChange={handleFilterChange}
                                onApply={() => { }}
                                onReset={handleReset}
                            />
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 space-y-8 min-w-0">

                        {/* Calendar Header with Controls */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-8">
                                <ResultsHeader
                                    total={totalCount}
                                    sort={filters.sort}
                                    viewMode={viewMode}
                                    onSortChange={(s) => handleFilterChange('sort', s as any)}
                                    onViewModeChange={setViewMode}
                                    onOpenFilters={() => { }}
                                    title={selectedDate
                                        ? `Leilões em ${selectedDate!.toLocaleDateString('pt-BR')}`
                                        : `Leilões em ${monthName} de ${year}`}
                                    hideFilterButton
                                    extraActions={
                                        <button
                                            onClick={() => {
                                                setSelectedDate(null);
                                                setCurrentDate(new Date());
                                            }}
                                            className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-black uppercase hover:bg-emerald-100 transition-all"
                                        >
                                            Hoje
                                        </button>
                                    }
                                />
                            </div>

                            {/* Active Chips */}
                            <div className="mb-6">
                                <ActiveFilterChips
                                    filters={filters}
                                    onRemove={(key, value) => {
                                        const val = filters[key as keyof Filters];
                                        if (Array.isArray(val)) {
                                            handleFilterChange(key as keyof Filters, val.filter(v => v !== value) as any);
                                        } else {
                                            handleFilterChange(key as keyof Filters, '' as any);
                                        }
                                    }}
                                    onClearAll={handleReset}
                                />
                            </div>

                            {/* Calendar Navigation */}
                            <div className="flex items-center justify-between py-4 border-t border-slate-50 mb-6">
                                <div className="flex items-center gap-4">
                                    <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"><ChevronLeft className="w-5 h-5" /></button>
                                    <span className="text-lg font-black text-slate-800 capitalize">{monthName} de {year}</span>
                                    <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"><ChevronRight className="w-5 h-5" /></button>
                                </div>
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 border border-slate-100 rounded-3xl overflow-hidden">
                                {["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"].map(d => (
                                    <div key={d} className="py-4 text-center text-[10px] font-black text-emerald-600 bg-emerald-50/30 border-b border-r border-slate-100 last:border-r-0">
                                        {d}
                                    </div>
                                ))}
                                {calendarDays.map((date, i) => {
                                    const count = getAuctionCount(date.day, date.month, date.year);
                                    const selected = isSelected(date.day, date.month, date.year);
                                    const today = isToday(date.day, date.month, date.year);

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedDate(new Date(date.year, date.month, date.day))}
                                            className={`relative h-14 md:h-20 border-b border-r border-slate-100 last:border-r-0 text-sm font-bold transition-all flex items-center justify-center
                                                ${!date.isCurrentMonth ? "bg-slate-50/30 text-slate-300 pointer-events-none" : "bg-white text-slate-600 hover:bg-slate-100"}
                                                ${selected ? "!bg-slate-900 !text-white z-10" : ""}
                                                ${today && !selected ? "text-emerald-600 after:content-[''] after:absolute after:bottom-2 after:w-1 after:h-1 after:bg-emerald-500 after:rounded-full" : ""}
                                            `}
                                        >
                                            <span className="relative z-10">{date.day}</span>
                                            {count > 0 && (
                                                <span className={`absolute top-2 right-2 text-[8px] px-1 py-0.5 rounded font-black ${selected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                                    {count}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* List Results */}
                        <div className="space-y-4">
                            {loading ? (
                                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
                                    {[...Array(6)].map((_, i) => (
                                        <SkeletonCard key={i} viewMode={viewMode} />
                                    ))}
                                </div>
                            ) : lots.length === 0 ? (
                                <div className="p-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-8 h-8 text-slate-200" />
                                    </div>
                                    <p className="text-slate-500 font-bold text-lg">Nenhum leilão encontrado</p>
                                    <p className="text-slate-400 text-sm mt-1">Tente outra data no calendário ou ajuste os filtros.</p>
                                </div>
                            ) : (
                                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "flex flex-col gap-4"}>
                                    {lots.map(lot => (
                                        viewMode === 'grid'
                                            ? <GridCard key={lot._id} lot={lot} />
                                            : <ListRow key={lot._id} lot={lot} />
                                    ))}
                                </div>
                            )}
                        </div>

                    </main>
                </div>
            </div >
        </div >
    );
}

