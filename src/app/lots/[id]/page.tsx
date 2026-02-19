"use client";

import { useEffect, useState, use } from 'react';
import api from '@/lib/api';
import { Lot } from '@/types';
import {
    Calendar, MapPin, Tag, Fuel, Settings, Gauge,
    ArrowLeft, Share2, Heart, ExternalLink, Hash,
    ChevronLeft, ChevronRight, X, Maximize2, Loader2, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import LotCard from '@/components/LotCard';

interface AuctionData {
    title: string;
    externalAuctionId: string;
    organization?: string;
}

export default function LotDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [lot, setLot] = useState<Lot | null>(null);
    const [auction, setAuction] = useState<AuctionData | null>(null);
    const [priceRef, setPriceRef] = useState<{ priceFipe: number, priceOlx: number, priceCurrent: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [recommendedLots, setRecommendedLots] = useState<Lot[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get(`/lots/${id}`);
                const lotData = response.data.data;
                setLot(lotData);

                // Parallel fetch for auction, price reference, and recommendations
                const [auctionRes, priceRes, recRes] = await Promise.all([
                    lotData.externalAuctionId ? api.get(`/auctions/${lotData.externalAuctionId}`) : null,
                    lotData.externalLotId ? api.get(`/lots/${lotData.externalLotId}/price-reference`) : null,
                    api.get('/lots', { params: { limit: 8, sort: '-createdAt' } })
                ]);

                if (auctionRes && auctionRes.data.success) {
                    setAuction(auctionRes.data.data);
                }
                if (priceRes && priceRes.data.success) {
                    setPriceRef(priceRes.data.data);
                }
                if (recRes && recRes.data.success) {
                    // Filter out current lot from recommendations
                    setRecommendedLots(recRes.data.data.lots.filter((l: Lot) => l.externalLotId !== id));
                }
            } catch (error) {
                console.error('Error fetching lot details:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        // Keyboard navigation for gallery
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isGalleryOpen) return;
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') prevImage();
            if (e.key === 'Escape') setIsGalleryOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [id, isGalleryOpen, currentImageIndex]);

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (!lot) {
        return (
            <div className="max-w-7xl mx-auto text-center py-32 px-4">
                <div className="bg-gray-50 rounded-xl p-16 inline-block border border-gray-100 shadow-sm transition-all hover:shadow-xl">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter sm:text-4xl">Lote não encontrado</h2>
                    <p className="mt-4 text-gray-500 font-medium">O lote que você procura pode ter sido removido ou o ID está incorreto.</p>
                    <Link href="/" className="mt-10 bg-emerald-600 text-white px-8 py-4 rounded-xl font-black uppercase text-sm tracking-widest hover:bg-emerald-500 hover:shadow-xl hover:shadow-emerald-200 transition-all inline-flex items-center gap-2">
                        <ArrowLeft className="h-5 w-5" /> Voltar para a busca
                    </Link>
                </div>
            </div>
        );
    }

    const displayImages = (lot.images && lot.images.length > 0) ? lot.images : (lot.raw?.images || []);

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch (e) {
            return dateString;
        }
    };

    const calculatePercentage = (current: number, target: number) => {
        if (!target) return 0;
        return Math.min(Math.round((current / target) * 100), 100);
    };

    return (
        <div className="bg-[#f3f5f8] min-h-screen pb-20 overflow-x-hidden">
            {/* Gallery Modal */}
            {isGalleryOpen && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 flex flex-col">
                    <div className="p-6 flex items-center justify-between text-white">
                        <div className="text-xs font-black tracking-widest uppercase opacity-70">
                            {lot.marca} {lot.modelo} · {currentImageIndex + 1} de {displayImages.length}
                        </div>
                        <button
                            onClick={() => setIsGalleryOpen(false)}
                            className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="flex-1 relative flex items-center justify-center p-4">
                        <button
                            onClick={prevImage}
                            className="absolute left-6 z-10 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all"
                        >
                            <ChevronLeft className="h-8 w-8" />
                        </button>

                        <img
                            src={displayImages[currentImageIndex]}
                            alt={lot.modelo}
                            className="max-h-full max-w-full object-contain shadow-2xl"
                            referrerPolicy="no-referrer"
                        />

                        <button
                            onClick={nextImage}
                            className="absolute right-6 z-10 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all"
                        >
                            <ChevronRight className="h-8 w-8" />
                        </button>
                    </div>

                    {/* Thumbnails strip */}
                    <div className="p-6 bg-black/50 overflow-x-auto">
                        <div className="flex gap-3 justify-center min-w-max pb-4">
                            {displayImages.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentImageIndex(idx)}
                                    className={`relative w-24 aspect-video rounded-lg overflow-hidden border-2 transition-all ${currentImageIndex === idx ? 'border-emerald-500 scale-105 shadow-lg shadow-emerald-500/20' : 'border-transparent opacity-40 hover:opacity-100'
                                        }`}
                                >
                                    <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Header / Breadcrumb - Clean & Simple */}
            <div className="bg-white border-b border-gray-100 flex items-center justify-center">
                <div className="max-w-[1240px] w-full px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-[11px] font-bold text-gray-400 hover:text-gray-900 transition-all uppercase tracking-widest">
                        <ArrowLeft className="h-4 w-4" />
                        Voltar para a busca
                    </Link>
                    <div className="flex items-center gap-4">
                        <button className="text-gray-300 hover:text-emerald-600 transition-colors">
                            <Share2 className="h-5 w-5" />
                        </button>
                        <button className="text-gray-300 hover:text-emerald-600 transition-colors">
                            <Heart className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Hero Section: Gallery - Webmotors Style */}
            <div className="bg-[#f0f2f5] relative group cursor-zoom-in" onClick={() => setIsGalleryOpen(true)}>
                <div className="w-full relative flex items-center justify-center overflow-hidden">
                    {/* Background Blur Image for "Full" effect */}
                    <div className="absolute inset-0 opacity-[0.03] bg-black scale-110 blur-3xl overflow-hidden">
                        <img src={displayImages[currentImageIndex]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>

                    <div className="w-full h-[300px] sm:h-[400px] relative z-10 flex items-center justify-center">
                        {displayImages.length > 0 ? (
                            <div className="flex items-center gap-0.5 w-full h-full">
                                {/* Left Image Preview */}
                                <div className="hidden lg:block flex-1 h-full opacity-60 overflow-hidden grayscale-[40%] hover:grayscale-0 cursor-pointer">
                                    <img src={displayImages[(currentImageIndex - 1 + displayImages.length) % displayImages.length]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </div>

                                {/* Main Image */}
                                <div className="flex-1 h-full overflow-hidden relative">
                                    <img
                                        src={displayImages[currentImageIndex]}
                                        alt={lot.modelo}
                                        className="w-full h-full object-cover shadow-2xl"
                                        referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                                        <div className="opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur-md p-3 rounded-full text-emerald-600 shadow-xl transition-all scale-75 group-hover:scale-100">
                                            <Maximize2 className="h-5 w-5" />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Image Preview */}
                                <div className="hidden lg:block flex-1 h-full opacity-60 overflow-hidden grayscale-[40%] hover:grayscale-0 cursor-pointer">
                                    <img src={displayImages[(currentImageIndex + 1) % displayImages.length]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-300">
                                <Hash className="h-12 w-12" />
                            </div>
                        )}
                    </div>

                    {/* Carousel Nav Controls */}
                    <button
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        className="absolute left-10 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/90 shadow-2xl text-gray-900 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 z-20 border border-gray-100"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        className="absolute right-10 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/90 shadow-2xl text-gray-900 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 z-20 border border-gray-100"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>

                    {/* Image Counter Badge */}
                    <div className="absolute bottom-6 right-6 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest border border-white/10 z-20">
                        {currentImageIndex + 1} / {displayImages.length}
                    </div>
                </div>
            </div>

            {/* Main Content Area - Overlapping Layout */}
            <div className="max-w-[1240px] mx-auto px-4 mt-8 relative z-40">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left: Vehicle Details Card */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white rounded-lg shadow-xl shadow-gray-200/40 p-6 sm:p-10 border border-gray-100">
                            {/* Title Section */}
                            <div className="mb-10">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100/30">
                                        <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[9px] font-bold uppercase tracking-[0.1em]">Leilão Ativo</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.1em]">{lot.sourceName}</span>
                                </div>
                                <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 leading-tight tracking-tight">
                                    <span className="font-light mr-3 text-gray-400 uppercase tracking-tighter">{lot.marca}</span>
                                    <span className="text-emerald-600 uppercase font-black">{lot.modelo}</span>
                                </h1>
                                <p className="text-gray-400 font-medium text-[11px] mt-2 uppercase tracking-[0.1em]">{lot.versao}</p>
                            </div>

                            {/* Main Specs Grid - Text Focused */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-8 gap-x-4">
                                <div>
                                    <div className="text-[11px] font-medium text-gray-400 uppercase mb-1">Cidade</div>
                                    <div className="text-sm font-bold text-gray-900 truncate pr-2">{lot.location || 'N/A'}</div>
                                </div>
                                <div>
                                    <div className="text-[11px] font-medium text-gray-400 uppercase mb-1">Ano</div>
                                    <div className="text-sm font-bold text-gray-900">{lot.ano}/{lot.anoModelo}</div>
                                </div>
                                <div>
                                    <div className="text-[11px] font-medium text-gray-400 uppercase mb-1">KM</div>
                                    <div className="text-sm font-bold text-gray-900">{lot.quilometragem?.toLocaleString() || '0'}</div>
                                </div>
                                <div>
                                    <div className="text-[11px] font-medium text-gray-400 uppercase mb-1">Câmbio</div>
                                    <div className="text-sm font-bold text-gray-900 uppercase">Não Info.</div>
                                </div>
                                <div>
                                    <div className="text-[11px] font-medium text-gray-400 uppercase mb-1">Combustível</div>
                                    <div className="text-sm font-bold text-gray-900 uppercase">{lot.combustivel || 'N/A'}</div>
                                </div>
                                <div>
                                    <div className="text-[11px] font-medium text-gray-400 uppercase mb-1">Cor</div>
                                    <div className="text-sm font-bold text-gray-900 uppercase">{lot.cor || 'N/A'}</div>
                                </div>
                                <div>
                                    <div className="text-[11px] font-medium text-gray-400 uppercase mb-1">Carroceria</div>
                                    <div className="text-sm font-bold text-gray-900 uppercase">{lot.vehicleType || '---'}</div>
                                </div>
                                <div>
                                    <div className="text-[11px] font-medium text-gray-400 uppercase mb-1">Placa</div>
                                    <div className="text-sm font-bold text-gray-900">FINAL 0</div>
                                </div>
                            </div>
                        </div>

                        {/* Description Card */}
                        <div className="bg-white rounded-lg p-6 sm:p-10 border border-gray-100 shadow-sm">
                            <h2 className="text-[11px] font-bold text-gray-400 mb-6 uppercase tracking-wider">Itens do Lote</h2>
                            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                                {lot.descricao}
                            </p>
                        </div>
                    </div>

                    {/* Right: Price & Action Sidebar */}
                    <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 h-fit">
                        {/* Auction Metadata Card - Now at Top */}
                        <div className="bg-emerald-600 rounded-lg p-6 text-white shadow-lg shadow-emerald-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Calendar className="h-10 w-10" />
                            </div>
                            <div className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider mb-2 opacity-80">Encerramento Leilão</div>
                            <p className="text-sm font-bold uppercase leading-tight">
                                {formatDate(lot.endAt)}
                            </p>
                        </div>

                        {/* Price & Bid Card */}
                        <div className="bg-white rounded-lg shadow-xl shadow-gray-200/40 p-8 border border-gray-100">
                            <div className="mb-6">
                                <div className="text-[11px] font-bold text-gray-400 uppercase mb-2">Lance atual do leilão</div>
                                <div className="text-4xl font-black text-gray-900 tracking-tighter">
                                    <span className="text-xl font-medium mr-1 text-gray-400">R$</span>
                                    {lot.precoMinimo ? lot.precoMinimo.toLocaleString('pt-BR') : 'N/A'}
                                </div>
                            </div>

                            <a
                                href={lot.lotUrl || lot.loteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-3 rounded-lg bg-[#ef3e42] py-4 text-sm font-bold text-white hover:bg-[#d63438] transition-all shadow-lg shadow-red-100 uppercase active:scale-[0.98]"
                            >
                                Dar Lance Agora <ExternalLink className="h-4 w-4" />
                            </a>

                            <div className="mt-8 pt-6 border-t border-gray-50 space-y-3">
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-medium text-gray-300 uppercase">Leiloeiro</span>
                                    <span className="font-bold text-gray-600 uppercase">{auction?.organization || lot.sourceName}</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-medium text-gray-300 uppercase">ID Lote</span>
                                    <span className="font-bold text-gray-600 uppercase">#{lot.externalLotId}</span>
                                </div>
                            </div>
                        </div>

                        {/* FIPE Comparison Card - Emerald Style */}
                        {priceRef && (
                            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8">Referência de Mercado</h3>
                                <div className="flex items-end justify-between mb-5">
                                    <div>
                                        <div className="text-sm font-bold text-gray-300 line-through mb-1">R$ {priceRef.priceFipe.toLocaleString('pt-BR')}</div>
                                        <div className="text-xl font-black text-emerald-600 tracking-tight">Menor que a FIPE</div>
                                    </div>
                                    <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                                        Excelente Oportunidade
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100 relative">
                                    <div
                                        className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                        style={{ width: `${calculatePercentage(priceRef.priceCurrent, priceRef.priceFipe)}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                {/* Recommended Lots Section */}
                {recommendedLots.length > 0 && (
                    <div className="mt-20 pt-10 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-emerald-500" />
                                Recomendados para você
                            </h2>
                            <Link href="/" className="text-sm font-bold text-emerald-600 hover:underline">
                                Ver todos
                            </Link>
                        </div>
                        <div className="relative">
                            <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide no-scrollbar">
                                {recommendedLots.map(recLot => (
                                    <div key={recLot._id} className="min-w-[280px] w-[280px] snap-start">
                                        <LotCard lot={recLot} viewMode="grid" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
