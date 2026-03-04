"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Tag, ChevronLeft, ChevronRight, Clock, Eye, Heart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Lot } from '@/types';
import api from '@/lib/api';

interface ListRowProps {
    lot: Lot;
}

function formatDate(dateString?: string) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return dateString;
    }
}

export default function ListRow({ lot }: ListRowProps) {
    const { data: session } = useSession();
    const [imgIdx, setImgIdx] = useState(0);
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

    // Initial check for favorite status
    useEffect(() => {
        if (session?.user?.email) {
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

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!session?.user?.email) {
            alert('Faça login para salvar favoritos');
            return;
        }

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
                    auctionId: String(lot.auctionId || lot.raw?.auctionId || lot.externalAuctionId || 0),
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
    let images = (lot.images && lot.images.length > 0) ? lot.images : (lot.raw?.images || []);
    if (lot.sourceName === 'receitafederal' && images.length > 1) {
        images = images.slice(1);
    }
    const title = `${lot.marca || ''} ${lot.modelo || ''}`.trim();
    const price = lot.precoMinimo
        ? `R$ ${lot.precoMinimo.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
        : 'Sob Consulta';

    const prev = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setImgIdx(i => (i - 1 + images.length) % images.length);
    };
    const next = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setImgIdx(i => (i + 1) % images.length);
    };

    return (
        <div className="group flex flex-row overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm transition-all hover:shadow-md hover:border-emerald-200 min-h-[110px]">
            {/* Thumbnail — fixed size */}
            <div className="relative w-[160px] sm:w-[200px] shrink-0 overflow-hidden bg-gray-100">
                {images.length > 0 ? (
                    <>
                        <img
                            src={images[imgIdx]}
                            alt={title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/200x150/f3f4f6/aaa?text=Sem+Imagem';
                            }}
                        />
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={prev}
                                    aria-label="Imagem anterior"
                                    className="absolute left-1 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
                                >
                                    <ChevronLeft className="h-3 w-3" />
                                </button>
                                <button
                                    onClick={next}
                                    aria-label="Próxima imagem"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
                                >
                                    <ChevronRight className="h-3 w-3" />
                                </button>
                            </>
                        )}
                        {/* Source badge */}
                        <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            {lot.sourceName || 'Leilão'}
                        </span>
                        {/* Favorite Button */}
                        <button
                            onClick={handleToggleFavorite}
                            className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-slate-100 shadow-sm transition-all hover:scale-110 active:scale-95 z-10"
                        >
                            <Heart className={`w-3.5 h-3.5 transition-colors ${isFavorite ? 'fill-pink-500 text-pink-500' : 'text-slate-400'}`} />
                        </button>
                    </>
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300 text-xs font-medium">
                        Sem imagem
                    </div>
                )}
                {/* View Counter Badge */}
                <div className="absolute bottom-1.5 left-1.5 bg-black/40 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm border border-white/10 z-10">
                    <Eye className="w-2.5 h-2.5" />
                    {(lot.viewsCount ?? lot.visitas ?? 0).toLocaleString()}
                </div>
            </div>

            {/* Info — fills remaining space */}
            <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 min-w-0">
                {/* Left: Title + meta */}
                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <h3
                                title={title}
                                className="text-sm font-bold text-gray-900 group-hover:text-emerald-600 transition-colors leading-tight line-clamp-1 uppercase tracking-tight"
                            >
                                {lot.marca} <span className="text-gray-500 font-medium">{lot.modelo}</span>
                            </h3>
                            <p
                                title={lot.versao || '—'}
                                className="text-[11px] text-gray-400 line-clamp-1"
                            >
                                {lot.versao || '—'}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-0.5">
                        <span className="flex items-center gap-1 text-[11px] text-gray-500" title={`Ano: ${lot.ano}/${lot.anoModelo}`}>
                            <Calendar className="h-3 w-3 text-emerald-500 shrink-0" />
                            {lot.ano}/{lot.anoModelo}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-gray-500" title={`Combustível: ${lot.combustivel || '—'}`}>
                            <Tag className="h-3 w-3 text-emerald-500 shrink-0" />
                            {lot.combustivel || '—'}
                        </span>
                        {lot.location && (
                            <span className="flex items-center gap-1 text-[11px] text-gray-500" title={`Local: ${lot.location}`}>
                                <MapPin className="h-3 w-3 text-emerald-500 shrink-0" />
                                <span className="truncate max-w-[120px]">{lot.location}</span>
                            </span>
                        )}
                        <div className="flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase tracking-tight ml-auto">
                            <Clock className="h-3 w-3 shrink-0" />
                            Termina: {formatDate(lot.endAt)}
                        </div>
                    </div>
                </div>

                {/* Right: Price + CTA */}
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:gap-2 w-full sm:w-auto shrink-0">
                    <div className="sm:text-right">
                        <span className="block text-[9px] uppercase font-bold text-gray-400 tracking-widest">Lance atual</span>
                        <span className="text-base font-black text-gray-900 tracking-tighter whitespace-nowrap">{price}</span>
                    </div>
                    <Link
                        href={`/lots/${(lot.auctionId || lot.externalAuctionId || 0)}/${lot.externalLotId}`}
                        className="shrink-0 bg-emerald-600 text-white text-[11px] font-bold px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors active:scale-95 whitespace-nowrap"
                    >
                        Ver Detalhes
                    </Link>
                </div>
            </div>
        </div>
    );
}
