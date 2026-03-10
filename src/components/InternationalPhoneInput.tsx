"use client"

import React from 'react'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

interface InternationalPhoneInputProps {
    value: string
    onChange: (value: string | undefined) => void
    error?: string
    placeholder?: string
}

const phoneInputStyles = `
    /* ── Outer wrapper ───────────────────────────────────────────── */
    .phone-input-container .PhoneInput {
        display: flex;
        align-items: stretch;
        width: 100%;
        background-color: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 1rem;
        overflow: hidden;
        transition: border-color 0.2s, box-shadow 0.2s;
    }
    .phone-input-container.has-error .PhoneInput {
        border-color: #fca5a5;
    }
    .phone-input-container .PhoneInput:focus-within {
        border-color: #10b981;
        box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
    }
    .phone-input-container.has-error .PhoneInput:focus-within {
        border-color: #ef4444;
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
    }

    /* ── Country selector block (left) ───────────────────────────── */
    .phone-input-container .PhoneInputCountry {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0 0.875rem;
        background-color: #f8fafc;
        border-right: 1px solid #e2e8f0;
        min-width: 4.5rem;
        flex-shrink: 0;
        cursor: pointer;
    }
    .phone-input-container .PhoneInputCountrySelect {
        position: absolute;
        inset: 0;
        opacity: 0;
        cursor: pointer;
        width: 100%;
        height: 100%;
    }
    .phone-input-container .PhoneInputCountrySelectArrow {
        display: block;
        width: 0.4rem;
        height: 0.4rem;
        border-right: 2px solid #94a3b8;
        border-bottom: 2px solid #94a3b8;
        transform: rotate(45deg) translateY(-2px);
        flex-shrink: 0;
    }
    .phone-input-container .PhoneInputCountryIcon {
        width: 1.5rem;
        height: 1.1rem;
        border-radius: 0.2rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        flex-shrink: 0;
    }
    .phone-input-container .PhoneInputCountryIcon--square {
        width: 1.25rem;
        height: 1.25rem;
    }

    /* ── Number input (right) ────────────────────────────────────── */
    .phone-input-container .PhoneInputInput {
        flex: 1;
        padding: 0.875rem 1rem;
        background: transparent;
        border: none;
        outline: none;
        font-weight: 500;
        color: #1e293b;
        font-size: 0.875rem;
        min-width: 0;
    }
    .phone-input-container .PhoneInputInput::placeholder {
        color: #94a3b8;
        font-weight: 400;
    }
`;

const InternationalPhoneInput = ({ value, onChange, error, placeholder }: InternationalPhoneInputProps) => {
    return (
        <div className="space-y-1 w-full">
            <style dangerouslySetInnerHTML={{ __html: phoneInputStyles }} />
            <div className={`phone-input-container${error ? ' has-error' : ''}`}>
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
