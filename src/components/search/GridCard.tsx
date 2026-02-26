"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Tag, ChevronLeft, ChevronRight, Clock, Eye } from 'lucide-react';
import { Lot } from '@/types';

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
    const [imgIdx, setImgIdx] = useState(0);
    const images = (lot.images && lot.images.length > 0) ? lot.images : (lot.raw?.images || []);
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
                    {lot.visitas !== undefined && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 shrink-0 mt-0.5 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100" title="Quantidade de visitas">
                            <Eye className="h-3 w-3 text-gray-400" />
                            <span className="flex items-center gap-1">
                                <span className="text-gray-600">{lot.visitas.toLocaleString()}</span>
                            </span>
                        </div>
                    )}
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
                            href={`/lots/${lot.externalLotId}`}
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
