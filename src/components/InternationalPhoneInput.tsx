"use client"

import React from 'react'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { Phone } from 'lucide-react'

interface InternationalPhoneInputProps {
    value: string
    onChange: (value: string | undefined) => void
    error?: string
    placeholder?: string
}

const InternationalPhoneInput = ({ value, onChange, error, placeholder }: InternationalPhoneInputProps) => {
    return (
        <div className="space-y-1 w-full">
            <div className="relative phone-input-container">
                <style jsx global>{`
                    .phone-input-container .PhoneInput {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        width: 100%;
                        padding: 0.875rem 1rem;
                        background-color: #f8fafc; /* slate-50 */
                        border: 1px solid ${error ? '#fca5a5' : '#e2e8f0'}; /* red-300 : slate-200 */
                        border-radius: 1rem; /* rounded-2xl */
                        transition: all 0.2s;
                    }
                    .phone-input-container .PhoneInput:focus-within {
                        border-color: ${error ? '#ef4444' : '#10b981'}; /* red-500 : emerald-500 */
                        box-shadow: 0 0 0 4px ${error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'};
                    }
                    .phone-input-container .PhoneInputInput {
                        background: transparent;
                        border: none;
                        outline: none;
                        width: 100%;
                        font-weight: 500;
                        color: #1e293b; /* slate-800 */
                        font-size: 0.875rem;
                    }
                    .phone-input-container .PhoneInputCountrySelect {
                        padding: 0;
                        margin: 0;
                        border: none;
                        background: transparent;
                        width: auto;
                        cursor: pointer;
                    }
                    .phone-input-container .PhoneInputCountryIcon {
                        width: 1.5rem;
                        height: 1.1rem;
                        border-radius: 0.25rem;
                        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                    }
                `}</style>
                <PhoneInput
                    international
                    defaultCountry="BR"
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder || "(00) 00000-0000"}
                    className="w-full"
                />
            </div>
            {error && <p className="text-[10px] text-red-500 font-bold ml-1">{error}</p>}
        </div>
    )
}

export default InternationalPhoneInput
