"use client";

import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

interface SearchableSelectProps {
    label: string;
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export default function SearchableSelect({
    label,
    options,
    value,
    onChange,
    placeholder = "Selecione...",
    disabled = false
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter options based on search term
    const normalizedSearch = searchTerm.toLowerCase().trim();

    const filteredOptions = options.filter(option =>
        String(option).toLowerCase().includes(normalizedSearch)
    );

    // Sort to show exact startsWith matches first
    const finalOptions = [...filteredOptions].sort((a, b) => {
        const aStart = String(a).toLowerCase().startsWith(normalizedSearch);
        const bStart = String(b).toLowerCase().startsWith(normalizedSearch);
        if (aStart && !bStart) return -1;
        if (!aStart && bStart) return 1;
        return 0;
    });

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block px-1">
                {label}
            </label>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs bg-gray-50/50 border border-gray-100 rounded-md hover:bg-white hover:border-emerald-500 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${isOpen ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/5' : ''}`}
            >
                <span className={`truncate ${!value ? 'text-gray-400' : 'text-gray-700 font-bold'}`}>
                    {value || placeholder}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-emerald-500' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-[60] w-full mt-1 bg-white border border-gray-100 rounded-md shadow-lg overflow-hidden animate-in fade-in zoom-in duration-200 origin-top">
                    <div className="p-1.5 border-b border-gray-50 flex items-center gap-2 bg-gray-50/30">
                        <Search className="h-3.5 w-3.5 text-emerald-500 ml-1.5" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full text-xs font-medium focus:outline-none border-none ring-0 focus:ring-0 p-1 bg-transparent text-gray-900 placeholder-gray-400"
                        />
                        {searchTerm && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSearchTerm('');
                                }}
                                className="p-1 hover:bg-gray-200/50 rounded-full transition-colors mr-1"
                            >
                                <X className="h-3 w-3 text-gray-400" />
                            </button>
                        )}
                    </div>
                    <div className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
                        {value && (
                            <button
                                onClick={() => {
                                    onChange('');
                                    setIsOpen(false);
                                    setSearchTerm('');
                                }}
                                className="w-full text-left px-2 py-2 text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors flex items-center gap-2 mb-1"
                            >
                                <X className="h-3 w-3" /> Limpar seleção
                            </button>
                        )}

                        {finalOptions.length === 0 ? (
                            <div className="px-3 py-6 text-center">
                                <Search className="h-6 w-6 text-gray-100 mx-auto mb-1" />
                                <p className="text-[10px] text-gray-400 font-medium italic">
                                    Nenhum resultado
                                </p>
                            </div>
                        ) : (
                            finalOptions.map((option) => (
                                <button
                                    key={option}
                                    onClick={() => {
                                        onChange(option);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-all duration-200 flex items-center justify-between group mb-0.5 ${value === option ? 'bg-emerald-500 text-white font-bold' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'}`}
                                >
                                    <span className="truncate">{option}</span>
                                    {value === option && <Check className="h-3 w-3" />}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
