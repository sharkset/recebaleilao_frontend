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

    // Filter options based on search term
    const filteredOptions = options.filter(option =>
        option.toLowerCase().startsWith(searchTerm.toLowerCase())
    );

    // Fallback if no startsWith match, try includes
    const finalOptions = filteredOptions.length > 0
        ? filteredOptions
        : options.filter(option => option.toLowerCase().includes(searchTerm.toLowerCase()));

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                {label}
            </label>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:border-emerald-500 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <span className={`truncate ${!value ? 'text-gray-400' : 'text-gray-900 font-medium'}`}>
                    {value || placeholder}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-2 border-b border-gray-50 flex items-center gap-2">
                        <Search className="h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            autoFocus
                            placeholder="Procurar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full text-sm focus:outline-none border-none ring-0 focus:ring-0 p-1"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="p-1 hover:bg-gray-100 rounded-md">
                                <X className="h-3 w-3 text-gray-400" />
                            </button>
                        )}
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                        <button
                            onClick={() => {
                                onChange('');
                                setIsOpen(false);
                                setSearchTerm('');
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center justify-between"
                        >
                            Limpar seleção
                        </button>
                        {finalOptions.length === 0 ? (
                            <div className="px-3 py-6 text-center text-xs text-gray-400 italic">
                                Nenhum resultado encontrado
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
                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${value === option ? 'bg-emerald-500 text-white font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <span className="truncate">{option}</span>
                                    {value === option && <Check className="h-4 w-4" />}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
