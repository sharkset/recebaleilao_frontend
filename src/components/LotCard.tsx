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
            <div className="group relative flex flex-col md:flex-row overflow-hidden rounded-md bg-white border border-gray-100 shadow-sm transition-all hover:shadow-md hover:border-emerald-200">
                <div className="w-full md:w-[320px] lg:w-[400px] aspect-[16/9] md:aspect-auto overflow-hidden bg-gray-50 relative shrink-0">
                    {displayImages.length > 0 ? (
                        <>
                            <img
                                src={displayImages[currentImageIndex]}
                                alt={formattedTitle}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/f3f4f6/666?text=Sem+Imagem';
                                }}
                            />
                            {displayImages.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/20 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/40"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/20 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/40"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400 bg-gray-50">
                            Sem Imagem
                        </div>
                    )}
                    <div className="absolute top-2 left-2 flex gap-1.5">
                        <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                            {lot.sourceName || 'Oportunidade'}
                        </span>
                    </div>
                </div>

                <div className="flex flex-1 flex-col p-5 justify-between bg-white">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">
                                {lot.marca} <span className="text-gray-500 font-medium">{lot.modelo}</span>
                            </h3>
                        </div>
                        <p className="text-sm text-gray-500 font-medium line-clamp-1">
                            {lot.versao || 'Versão não especificada'}
                        </p>

                        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-4">
                            <div className="flex items-center gap-1.5 text-gray-500">
                                <Calendar className="h-4 w-4 text-emerald-500" />
                                <span className="text-xs font-bold">{lot.ano}/{lot.anoModelo}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-500">
                                <Tag className="h-4 w-4 text-emerald-500" />
                                <span className="text-xs font-bold truncate max-w-[120px]">{lot.combustivel || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-500">
                                <MapPin className="h-4 w-4 text-emerald-500" />
                                <span className="text-xs font-bold truncate max-w-[150px]">{lot.location || 'Brasil'}</span>
                            </div>
                        </div>

                        <div className="pt-3 flex items-center gap-2 border-t border-gray-50 mt-4">
                            <Clock className="h-3.5 w-3.5 text-red-500" />
                            <span className="text-[11px] font-bold text-red-500 uppercase">Termina: {formatDate(lot.endAt)}</span>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Lance Atualizado</span>
                            <span className="text-2xl font-black text-gray-900 tracking-tighter">
                                {lot.precoMinimo ? `R$ ${lot.precoMinimo.toLocaleString('pt-BR')}` : 'Sob Consulta'}
                            </span>
                        </div>
                        <Link
                            href={`/lots/${lot.externalLotId}`}
                            className="bg-emerald-600 text-white px-8 py-3 rounded-md text-sm font-bold transition-all hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-100 text-center active:scale-[0.98]"
                        >
                            VER DETALHES
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-md bg-white border border-gray-100 shadow-sm transition-all hover:shadow-md hover:border-emerald-200">
            <div className="aspect-[4/3] w-full overflow-hidden bg-gray-50 relative">
                {displayImages.length > 0 ? (
                    <>
                        <img
                            src={displayImages[currentImageIndex]}
                            alt={formattedTitle}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/f3f4f6/666?text=Sem+Imagem';
                            }} />
                        {displayImages.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/20 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/40"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/20 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/40"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </>
                        )}
                    </>
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400 bg-gray-50">
                        Sem Imagem
                    </div>
                )}
                <div className="absolute top-2 left-2">
                    <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                        {lot.sourceName || 'Oportunidade'}
                    </span>
                </div>
            </div>

            <div className="flex flex-1 flex-col p-4 bg-white">
                <div className="space-y-1">
                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-emerald-600 transition-colors uppercase truncate tracking-tight">
                        {lot.marca} <span className="text-gray-500 font-medium">{lot.modelo}</span>
                    </h3>
                    <p className="text-[11px] text-gray-500 font-medium truncate">
                        {lot.versao || 'Versão não especificada'}
                    </p>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-gray-500 border-b border-gray-50 pb-2">
                    <span className="bg-gray-50 px-1.5 py-0.5 rounded">{lot.ano}/{lot.anoModelo}</span>
                    <span className="truncate max-w-[80px]">{lot.combustivel || 'N/A'}</span>
                </div>

                <div className="mt-3 space-y-3">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-0.5">Lance Atual</span>
                        <span className="text-lg font-black text-gray-900 tracking-tighter">
                            {lot.precoMinimo ? `R$ ${lot.precoMinimo.toLocaleString('pt-BR')}` : 'Sob Consulta'}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-red-500 uppercase tracking-tight">
                        <Clock className="h-3 w-3" /> Termina: {formatDate(lot.endAt).split(',')[0]}
                    </div>

                    <Link
                        href={`/lots/${lot.externalLotId}`}
                        className="w-full text-center rounded-md bg-emerald-600 py-2 text-xs font-bold text-white transition-all hover:bg-emerald-700 active:scale-[0.98] uppercase tracking-wider"
                    >
                        Ver Detalhes
                    </Link>
                </div>
            </div>
        </div>
    );
}
