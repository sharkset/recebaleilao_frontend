import { useState } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Tag, Tags, ChevronLeft, ChevronRight, Clock, Hash } from 'lucide-react';
import { Lot } from '@/types';

interface LotCardProps {
    lot: Lot;
    viewMode?: 'grid' | 'list';
}

export default function LotCard({ lot, viewMode = 'grid' }: LotCardProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const formattedTitle = `${lot.marca || ''} ${lot.modelo || ''} ${lot.versao || ''} ${lot.ano}/${lot.anoModelo}`.trim();
    const displayImages = (lot.images && lot.images.length > 0) ? lot.images : (lot.raw?.images || []);

    // Resume description to max 150 chars
    const truncatedDesc = lot.descricao
        ? (lot.descricao.length > 150 ? lot.descricao.substring(0, 150) + '...' : lot.descricao)
        : 'Sem descrição disponível';

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

    const nextImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (displayImages.length > 0) {
            setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
        }
    };

    const prevImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (displayImages.length > 0) {
            setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
        }
    };

    if (viewMode === 'list') {
        return (
            <div className="group relative flex flex-col sm:flex-row overflow-hidden rounded-lg bg-white border border-gray-100 shadow-sm transition-all hover:shadow-md hover:border-emerald-100">
                <div className="w-full sm:w-64 aspect-[4/3] sm:aspect-auto overflow-hidden bg-gray-50 relative">
                    {displayImages.length > 0 ? (
                        <>
                            <img
                                src={displayImages[currentImageIndex]}
                                alt={formattedTitle}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/f3f4f6/666?text=Sem+Imagem';
                                }}
                            />
                            {displayImages.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/80 backdrop-blur-sm text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/80 backdrop-blur-sm text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                        {displayImages.map((_, i) => (
                                            <div key={i} className={`h-1 rounded-full transition-all ${i === currentImageIndex ? 'w-4 bg-emerald-500' : 'w-1 bg-white/50'}`} />
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400 bg-gray-50">
                            Sem Imagem
                        </div>
                    )}
                </div>
                <div className="flex flex-1 flex-col p-4 justify-between">
                    <div>
                        <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                            <span className="bg-emerald-50 px-2 py-0.5 rounded">{lot.sourceName || 'N/A'}</span>
                            <span className="bg-emerald-50 px-2 py-0.5 rounded">{lot.cor || 'N/A'}</span>
                            <span className="bg-emerald-50 px-2 py-0.5 rounded">{lot.combustivel || 'N/A'}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                            {formattedTitle}
                        </h3>
                        <div className="mt-3 flex items-center text-xs text-emerald-600 font-bold">
                            <Clock className="h-3.5 w-3.5 mr-1.5" /> Termina: {formatDate(lot.endAt)}
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-gray-400" /> {lot.location || 'Local não informado'}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-50">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-tight">Lance Atual</span>
                            <span className="text-xl font-black text-emerald-600">
                                {lot.precoMinimo ? `R$ ${lot.precoMinimo.toLocaleString('pt-BR')}` : 'Sob Consulta'}
                            </span>
                        </div>
                        <Link
                            href={`/lots/${lot.externalLotId}`}
                            className="rounded-lg bg-[#111822] px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-200"
                        >
                            Ver Detalhes
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-lg bg-white border border-gray-100 shadow-sm transition-all hover:shadow-md hover:border-emerald-100">
            <div className="aspect-[4/3] w-full overflow-hidden bg-gray-50 relative">
                {displayImages.length > 0 ? (
                    <>
                        <img
                            src={displayImages[currentImageIndex]}
                            alt={formattedTitle}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/f3f4f6/666?text=Sem+Imagem';
                            }} />
                        {displayImages.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                    {displayImages.slice(0, 10).map((_, i) => (
                                        <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentImageIndex ? 'w-5 bg-emerald-500' : 'w-1.5 bg-white/60 shadow-sm'}`} />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400 bg-gray-50">
                        Sem Imagem
                    </div>
                )}
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-emerald-700 shadow-sm uppercase">
                    {lot.location || 'Local não informado'}
                </div>
            </div>
            <div className="flex flex-1 flex-col p-4">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1">
                        {lot.sourceName}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1">
                        {lot.cor}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1">
                        {lot.combustivel}
                    </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 line-clamp-2 leading-tight min-h-[2.5rem] group-hover:text-emerald-600 transition-colors">
                    {formattedTitle}
                </h3>

                <div className="mt-4 flex items-center text-[12px] font-bold text-emerald-600">
                    <Clock className="h-4 w-4 mr-1.5" /> Termina: {formatDate(lot.endAt)}
                </div>

                <div className="mt-4 flex flex-col border-t border-gray-50 pt-4 gap-3">
                    <div className="flex flex-col">
                        <span className="text-[11px] uppercase font-bold text-gray-400 tracking-tight mb-1">Lance Atual</span>
                        <span className="text-2xl font-black text-emerald-600 leading-none">
                            {lot.precoMinimo ? `R$ ${lot.precoMinimo.toLocaleString('pt-BR')}` : 'Sob Consulta'}
                        </span>
                    </div>
                    <Link
                        href={`/lots/${lot.externalLotId}`}
                        className="w-full text-center rounded-lg bg-[#111822] py-3.5 text-sm font-bold text-white transition-all hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-200"
                    >
                        Ver Detalhes
                    </Link>
                </div>
            </div>
        </div>
    );
}
