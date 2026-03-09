"use client";

import { useEffect, useState, use } from 'react';
import api from '@/lib/api';
import { Lot } from '@/types';
import {
    Calendar, MapPin, Tag, Fuel, Settings, Gauge,
    ArrowLeft, Share2, Heart, ExternalLink, Hash, Eye,
    ChevronLeft, ChevronRight, X, Maximize2, Loader2, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import GridCard from '@/components/search/GridCard';

interface AuctionData {
    title: string;
    externalAuctionId: string;
    organization?: string;
}

export default function LotDetailsPageCombined({ params }: { params: Promise<{ auctionId: string; lotId: string }> }) {
    const { auctionId, lotId } = use(params);
    const [lot, setLot] = useState<Lot | null>(null);
    const [auction, setAuction] = useState<AuctionData | null>(null);
    const [priceRef, setPriceRef] = useState<{ priceFipe: number, priceOlx: number, priceCurrent: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [recommendedLots, setRecommendedLots] = useState<Lot[]>([]);
    const { data: session } = useSession();
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteId, setFavoriteId] = useState<string | null>(null);
    const [notifyFavorites, setNotifyFavorites] = useState(true);

    useEffect(() => {
        if (session?.user?.email) {
            api.get(`/auth/me?email=${encodeURIComponent(session.user.email)}`)
                .then(res => setNotifyFavorites(res.data.user.preferences?.notifyFavorites ?? true))
                .catch(() => { });
        }
    }, [session]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Construct the path for the API call
                const queryPath = `${auctionId}/${lotId}`;

                const response = await api.get(`/lots/${queryPath}`);
                const lotData = response.data.data;
                setLot(lotData);
                setLoading(false);

                // Record visit
                api.post(`/lots/${queryPath}/visit`).catch(e => console.error("Visit recording failed", e));
                if (lotData._id) {
                    api.patch(`/lots/${lotData._id}/view`).catch(e => console.error("View increment failed", e));
                }

                // Secondary fetches
                const fetchExtras = async () => {
                    // Auction
                    const aID = lotData.externalAuctionId || lotData.auctionId || auctionId;
                    if (aID) {
                        api.get(`/auctions/${aID}`)
                            .then(res => res.data.success && setAuction(res.data.data))
                            .catch(e => console.error("Auction fetch failed", e));
                    }
                    // Price Ref
                    api.get(`/lots/${queryPath}/price-reference`)
                        .then(res => res.data.success && setPriceRef(res.data.data))
                        .catch(e => console.error("Price ref fetch failed", e));

                    // Recommendations
                    try {
                        const recRes = await api.get('/lots', {
                            params: {
                                limit: 20,
                                sort: 'relevant',
                                ...(lotData.marca ? { marca: lotData.marca } : {})
                            }
                        });

                        if (recRes && recRes.data.success) {
                            let filtered = recRes.data.data.lots.filter((l: Lot) => {
                                const currentLotId = String(lotData.externalLotId);
                                const currentAuctionId = String(lotData.auctionId || lotData.externalAuctionId);
                                const itemLotId = String(l.externalLotId);
                                const itemAuctionId = String(l.auctionId || l.externalAuctionId);

                                return !(itemLotId === currentLotId && itemAuctionId === currentAuctionId);
                            });

                            if (filtered.length < 4) {
                                const fallbackRes = await api.get('/lots', { params: { limit: 20, sort: 'relevant' } });
                                if (fallbackRes.data.success) {
                                    const secondFilter = fallbackRes.data.data.lots.filter((l: Lot) => {
                                        const currentLotId = String(lotData.externalLotId);
                                        const currentAuctionId = String(lotData.auctionId || lotData.externalAuctionId);
                                        const itemLotId = String(l.externalLotId);
                                        const itemAuctionId = String(l.auctionId || l.externalAuctionId);
                                        const isCurrent = (itemLotId === currentLotId && itemAuctionId === currentAuctionId);

                                        const alreadyIn = filtered.some((m: Lot) => m._id === l._id);
                                        return !isCurrent && !alreadyIn;
                                    });
                                    filtered = [...filtered, ...secondFilter];
                                }
                            }
                            setRecommendedLots(filtered.slice(0, 10));
                        }
                    } catch (e) {
                        console.error("Recommendations fetch failed", e);
                    }
                };
                fetchExtras();

            } catch (error) {
                console.error('Error fetching lot details:', error);
                setLoading(false);
            }
        };
        fetchData();
    }, [auctionId, lotId]);

    // Check favorite status
    useEffect(() => {
        if (session?.user?.email && lot) {
            api.get(`/favorites?email=${encodeURIComponent(session.user.email)}`)
                .then(res => {
                    const fav = res.data.favorites.find((f: any) => f.lotId === String(lot.externalLotId || lot._id));
                    if (fav) {
                        setIsFavorite(true);
                        setFavoriteId(fav._id);
                    }
                })
                .catch(() => { });
        }
    }, [session, lot]);

    const handleToggleFavorite = async () => {
        if (!session?.user?.email) {
            alert('Faça login para salvar favoritos');
            return;
        }

        if (!lot) return;

        try {
            if (isFavorite && favoriteId) {
                await api.delete(`/favorites/${favoriteId}`);
                setIsFavorite(false);
                setFavoriteId(null);
            } else {
                const res = await api.post('/favorites', {
                    email: session.user.email,
                    userId: (session.user as any).id || session.user.email,
                    lotId: String(lot.externalLotId || lot._id),
                    auctionId: String(lot.auctionId || lot.raw?.auctionId || lot.externalAuctionId || auctionId),
                    marca: lot.marca,
                    modelo: lot.modelo,
                    ano: `${lot.ano}/${lot.anoModelo}`,
                    image: (lot.images && lot.images.length > 0) ? lot.images[0] : (lot.raw?.images?.[0])
                });
                setIsFavorite(true);
                setFavoriteId(res.data.favorite._id);

                if (notifyFavorites) {
                    alert('Lote adicionado aos favoritos. Você receberá lembretes antes do leilão.');
                } else {
                    alert('Lote adicionado aos favoritos. Ative notificações na sua conta para receber lembretes.');
                }
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `${lot?.marca} ${lot?.modelo}`,
                text: `Confira este lote no Receba Leilão: ${lot?.marca} ${lot?.modelo}`,
                url: window.location.href,
            }).catch(() => { });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copiado para a área de transferência!');
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isGalleryOpen) return;
            const ims = lot ? ((lot.images && lot.images.length > 0) ? lot.images : (lot.raw?.images || [])) : [];
            if (!ims.length) return;
            if (e.key === 'ArrowRight') setCurrentImageIndex((prev) => (prev + 1) % ims.length);
            if (e.key === 'ArrowLeft') setCurrentImageIndex((prev) => (prev - 1 + ims.length) % ims.length);
            if (e.key === 'Escape') setIsGalleryOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isGalleryOpen, lot]);

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

    let displayImages = (lot.images && lot.images.length > 0) ? lot.images : (lot.raw?.images || []);
    if (lot.sourceName === 'receitafederal' && displayImages.length > 1) {
        displayImages = displayImages.slice(1);
    }
    const nextImage = () => displayImages.length && setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
    const prevImage = () => displayImages.length && setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
            });
        } catch (e) { return dateString; }
    };

    const calculatePercentage = (current: number, target: number) => target ? Math.min(Math.round((current / target) * 100), 100) : 0;

    return (
        <div className="bg-[#f3f5f8] min-h-screen pb-20 overflow-x-hidden">
            {/* Gallery Modal */}
            {isGalleryOpen && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 flex flex-col"
                    onClick={() => setIsGalleryOpen(false)}
                >
                    <div className="p-6 flex items-center justify-between text-white" onClick={e => e.stopPropagation()}>
                        <div className="text-xs font-black tracking-widest uppercase opacity-70">
                            {lot.marca} {lot.modelo} · {currentImageIndex + 1} de {displayImages.length}
                        </div>
                        <button onClick={() => setIsGalleryOpen(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all">
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="flex-1 relative flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
                        <button onClick={prevImage} className="absolute left-6 z-10 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all">
                            <ChevronLeft className="h-8 w-8" />
                        </button>
                        <img src={displayImages[currentImageIndex]} alt={lot.modelo} className="max-h-full max-w-full object-contain shadow-2xl" referrerPolicy="no-referrer" />
                        <button onClick={nextImage} className="absolute right-6 z-10 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all">
                            <ChevronRight className="h-8 w-8" />
                        </button>
                    </div>
                    <div className="p-6 bg-black/50 overflow-x-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-3 justify-center min-w-max pb-4">
                            {displayImages.map((img, idx) => (
                                <button key={idx} onClick={() => setCurrentImageIndex(idx)} className={`relative w-24 aspect-video rounded-lg overflow-hidden border-2 transition-all ${currentImageIndex === idx ? 'border-emerald-500 scale-105 shadow-lg shadow-emerald-500/20' : 'border-transparent opacity-40 hover:opacity-100'}`}>
                                    <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <div className="bg-[#f0f2f5] relative group cursor-zoom-in" onClick={() => setIsGalleryOpen(true)}>
                <div className="w-full relative flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.03] bg-black scale-110 blur-3xl overflow-hidden">
                        <img src={displayImages[currentImageIndex]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="w-full h-[300px] sm:h-[400px] relative z-10 flex items-center justify-center">
                        {displayImages.length > 0 ? (
                            <div className="flex items-center gap-0.5 w-full h-full">
                                <div className="hidden lg:block flex-1 h-full opacity-60 overflow-hidden grayscale-[40%] hover:grayscale-0 cursor-pointer">
                                    <img src={displayImages[(currentImageIndex - 1 + displayImages.length) % displayImages.length]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </div>
                                <div className="flex-1 h-full overflow-hidden relative">
                                    <img src={displayImages[currentImageIndex]} alt={lot.modelo} className="w-full h-full object-cover shadow-2xl" referrerPolicy="no-referrer" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                                        <div className="opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur-md p-3 rounded-full text-emerald-600 shadow-xl transition-all scale-75 group-hover:scale-100">
                                            <Maximize2 className="h-5 w-5" />
                                        </div>
                                    </div>
                                </div>
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
                    <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-10 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/90 shadow-2xl text-gray-900 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 z-20 border border-gray-100">
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-10 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/90 shadow-2xl text-gray-900 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 z-20 border border-gray-100">
                        <ChevronRight className="h-6 w-6" />
                    </button>
                    <div className="absolute bottom-6 right-6 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest border border-white/10 z-20">
                        {currentImageIndex + 1} / {displayImages.length}
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="bg-white border-b border-gray-100 mb-6">
                <div className="max-w-[1240px] mx-auto px-4 py-3 flex items-center justify-between">
                    <Link href="/search" className="flex items-center gap-2 text-[10px] sm:text-[11px] font-black text-gray-400 hover:text-emerald-600 transition-all uppercase tracking-[0.2em] group">
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Voltar
                    </Link>
                    <div className="flex items-center gap-6">
                        <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest" title="Quantidade de visitas">
                            <Eye className="h-4 w-4" /> <span>{lot.visitas?.toLocaleString() || '0'} visitas</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleShare}
                                className="text-gray-300 hover:text-emerald-600 transition-colors flex items-center gap-2"
                            >
                                <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Compartilhar</span>
                                <Share2 className="h-5 w-5" />
                            </button>
                            <button
                                onClick={handleToggleFavorite}
                                className={`transition-colors flex items-center gap-2 ${isFavorite ? 'text-pink-500' : 'text-gray-300 hover:text-emerald-600'}`}
                            >
                                <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">
                                    {isFavorite ? 'Favoritado' : 'Favoritar'}
                                </span>
                                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-[1240px] mx-auto px-4 relative z-40">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white rounded-lg shadow-xl shadow-gray-200/40 p-6 sm:p-10 border border-gray-100">
                            <div className="mb-10">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-1 py-1 rounded-full border border-emerald-100/30">
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
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-8 gap-x-4">
                                <div title={`Cidade: ${lot.location || 'N/A'}`}>
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
                        <div className="bg-white rounded-lg p-6 sm:p-10 border border-gray-100 shadow-sm">
                            <h2 className="text-[11px] font-bold text-gray-400 mb-6 uppercase tracking-wider">Descrição do lote</h2>
                            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{lot.descricao}</p>
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 h-fit">
                        <div className="bg-emerald-600 rounded-lg p-6 text-white shadow-lg shadow-emerald-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Calendar className="h-10 w-10" />
                            </div>
                            <div className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider mb-2 opacity-80">Encerramento do Leilão</div>
                            <p className="text-sm font-bold uppercase leading-tight">{formatDate(lot.endAt)}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-xl shadow-gray-200/40 p-8 border border-gray-100">
                            <div className="mb-6">
                                <div className="text-[11px] font-bold text-gray-400 uppercase mb-2">Lance atual do leilão</div>
                                <div className="text-4xl font-black text-gray-900 tracking-tighter">
                                    <span className="text-xl font-medium mr-1 text-gray-400">R$</span>
                                    {(lot.lanceAtual ?? lot.precoMinimo)?.toLocaleString('pt-BR') || 'N/A'}
                                </div>
                            </div>
                            <a href={lot.lotUrl || lot.loteUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-3 rounded-lg bg-[#ef3e42] py-4 text-sm font-bold text-white hover:bg-[#d63438] transition-all shadow-lg shadow-red-100 uppercase active:scale-[0.98]">
                                Dar Lance Agora <ExternalLink className="h-4 w-4" />
                            </a>
                            <div className="mt-8 pt-6 border-t border-gray-50 space-y-3">
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-medium text-gray-300 uppercase">Leiloeiro</span>
                                    <span className="font-bold text-gray-600 uppercase">{auction?.organization || lot.organization || lot.sourceName}</span>
                                </div>
                                {auction && (
                                    <>
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="font-medium text-gray-300 uppercase">Leilão</span>
                                            <span className="font-bold text-gray-600 uppercase text-right truncate max-w-[180px]" title={auction.title}>{auction.title}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="font-medium text-gray-300 uppercase">ID Leilão</span>
                                            <span className="font-bold text-gray-600 uppercase">#{auction.externalAuctionId}</span>
                                        </div>
                                    </>
                                )}
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-medium text-gray-300 uppercase">ID Lote</span>
                                    <span className="font-bold text-gray-600 uppercase">#{lot.externalLotId}</span>
                                </div>
                            </div>
                        </div>

                        {(() => {
                            const fipeVal = lot.fipeValor || priceRef?.priceFipe;
                            const lanceAtualVal = lot.lanceAtual || lot.precoMinimo || 0;

                            if (!fipeVal) {
                                return (
                                    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Referência de Mercado</h3>
                                        <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">FIPE indisponível</div>
                                    </div>
                                );
                            }

                            const isBelowFipe = lanceAtualVal < fipeVal;
                            return (
                                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8">Referência de Mercado</h3>
                                    <div className="flex items-end justify-between mb-5">
                                        <div>
                                            <div className="text-sm font-bold text-gray-300 line-through mb-1">R$ {fipeVal.toLocaleString('pt-BR')}</div>
                                            <div className={`text-xl font-black tracking-tight ${isBelowFipe ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {isBelowFipe ? 'Menor que a FIPE' : 'Acima da FIPE'}
                                            </div>
                                        </div>
                                        {isBelowFipe && <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">Oportunidade</div>}
                                    </div>
                                    <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                        <div className={`h-full ${isBelowFipe ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${calculatePercentage(lanceAtualVal, fipeVal)}%` }} />
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {recommendedLots.length > 0 && (
                    <div className="mt-16 pt-10 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Sparkles className="h-4 w-4 text-emerald-500" /> Recomendados</h2>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory no-scrollbar">
                            {recommendedLots.map(recLot => (
                                <div key={recLot._id} className="min-w-[240px] w-[240px] snap-start shrink-0">
                                    <GridCard lot={recLot} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
