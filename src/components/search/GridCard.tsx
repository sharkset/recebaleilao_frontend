"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Tag, ChevronLeft, ChevronRight, Clock, Eye, Heart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Lot } from '@/types';
import api from '@/lib/api';

interface GridCardProps {
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

export default function GridCard({ lot }: GridCardProps) {
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
        <div className="group relative flex flex-col overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm transition-all hover:shadow-md hover:border-emerald-200 h-full">
            {/* Image */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 shrink-0">
                {images.length > 0 ? (
                    <>
                        <img
                            src={images[imgIdx]}
                            alt={title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/f3f4f6/aaa?text=Sem+Imagem';
                            }}
                        />
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={prev}
                                    aria-label="Imagem anterior"
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/30 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={next}
                                    aria-label="Próxima imagem"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/30 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                                <div className="absolute bottom-2 right-2 bg-black/40 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                    {imgIdx + 1}/{images.length}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300 text-xs font-medium bg-gray-50">
                        Sem imagem
                    </div>
                )}
                {/* Source Badge */}
                <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    {lot.sourceName || 'Leilão'}
                </span>
                {/* Favorite Button */}
                <button
                    onClick={handleToggleFavorite}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-slate-100 shadow-sm transition-all hover:scale-110 active:scale-95 z-10"
                >
                    <Heart className={`w-3.5 h-3.5 transition-colors ${isFavorite ? 'fill-pink-500 text-pink-500' : 'text-slate-400'}`} />
                </button>
                {/* View Counter Badge */}
                <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm border border-white/10 z-10">
                    <Eye className="w-3 h-3" />
                    {(lot.viewsCount ?? lot.visitas ?? 0).toLocaleString()}
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col p-4 gap-3">
                {/* Title & Visits */}
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
                            className="text-[11px] text-gray-400 mt-0.5 line-clamp-1"
                        >
                            {lot.versao || '—'}
                        </p>
                    </div>
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                    <span className="flex items-center gap-1" title={`Ano: ${lot.ano}/${lot.anoModelo}`}>
                        <Calendar className="h-3 w-3 text-emerald-500" />
                        {lot.ano}/{lot.anoModelo}
                    </span>
                    <span className="flex items-center gap-1 truncate max-w-[90px]" title={`Combustível: ${lot.combustivel || '—'}`}>
                        <Tag className="h-3 w-3 text-emerald-500 shrink-0" />
                        <span className="truncate">{lot.combustivel || '—'}</span>
                    </span>
                    {lot.location && (
                        <span className="flex items-center gap-1 truncate max-w-[70px]" title={`Local: ${lot.location}`}>
                            <MapPin className="h-3 w-3 text-emerald-500 shrink-0" />
                            <span className="truncate">{lot.location}</span>
                        </span>
                    )}
                </div>

                <div className="border-t border-gray-50 pt-3 mt-auto">
                    {/* Ends at */}
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 uppercase tracking-tight mb-2">
                        <Clock className="h-3 w-3 shrink-0" />
                        Termina: {formatDate(lot.endAt)}
                    </div>

                    {/* Price + CTA */}
                    <div className="flex items-end justify-between gap-2">
                        <div>
                            <span className="block text-[9px] uppercase font-bold text-gray-400 tracking-widest">Lance atual</span>
                            <span className="text-base font-black text-gray-900 tracking-tighter">{price}</span>
                        </div>
                        <Link
                            href={`/lots/${(lot.auctionId || lot.externalAuctionId || 0)}/${lot.externalLotId}`}
                            className="shrink-0 bg-emerald-600 text-white text-[11px] font-bold px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors active:scale-95"
                        >
                            Ver Detalhes
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
