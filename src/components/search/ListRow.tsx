"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Tag, ChevronLeft, ChevronRight, Clock, Eye } from 'lucide-react';
import { Lot } from '@/types';

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
                    </>
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300 text-xs font-medium">
                        Sem imagem
                    </div>
                )}
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
                        {lot.visitas !== undefined && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 shrink-0 mt-0.5 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100" title="Quantidade de visitas">
                                <Eye className="h-3 w-3 text-gray-400" />
                                <span className="text-gray-600">{lot.visitas.toLocaleString()}</span>
                            </div>
                        )}
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
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase tracking-tight">
                        <Clock className="h-3 w-3 shrink-0" />
                        Termina: {formatDate(lot.endAt)}
                    </div>
                </div>

                {/* Right: Price + CTA */}
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:gap-2 w-full sm:w-auto shrink-0">
                    <div className="sm:text-right">
                        <span className="block text-[9px] uppercase font-bold text-gray-400 tracking-widest">Lance atual</span>
                        <span className="text-base font-black text-gray-900 tracking-tighter whitespace-nowrap">{price}</span>
                    </div>
                    <Link
                        href={`/lots/${lot.externalLotId}`}
                        className="shrink-0 bg-emerald-600 text-white text-[11px] font-bold px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors active:scale-95 whitespace-nowrap"
                    >
                        Ver Detalhes
                    </Link>
                </div>
            </div>
        </div>
    );
}
