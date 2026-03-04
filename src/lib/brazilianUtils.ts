/**
 * Utility functions for Brazilian standard formatting and validation.
 */

/**
 * Removes all non-numeric characters from a string.
 */
export const normalizeNumbers = (value: string): string => {
    return value.replace(/\D/g, "");
};

/**
 * Formats a CPF string as 000.000.000-00.
 */
export const formatCPF = (value: string): string => {
    const numbers = normalizeNumbers(value).slice(0, 11);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
};

/**
 * Validates a CPF string using the digit verification algorithm.
 */
export const validateCPF = (cpf: string): boolean => {
    const numbers = normalizeNumbers(cpf);
    
    if (numbers.length !== 11) return false;
    
    // Check for known invalid CPFs (all digits same)
    if (/^(\d)\1{10}$/.test(numbers)) return false;
    
    let sum = 0;
    let remainder;
    
    // Validate first digit
    for (let i = 1; i <= 9; i++) {
        sum = sum + parseInt(numbers.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers.substring(9, 10))) return false;
    
    // Validate second digit
    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum = sum + parseInt(numbers.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers.substring(10, 11))) return false;
    
    return true;
};

/**
 * Formats a Brazilian phone number as +55 (DD) 9 XXXX-XXXX.
 */
export const formatPhoneBR = (value: string): string => {
    let numbers = normalizeNumbers(value);
    
    // Remove leading 0 if present
    if (numbers.startsWith("0")) numbers = numbers.slice(1);
    
    // If it doesn't have 55, add it for display
    if (numbers.length <= 11 && !numbers.startsWith("55")) {
        // This is a local number without country code
    } else if (numbers.startsWith("55")) {
        // Strip 55 to re-apply it properly
        numbers = numbers.slice(2);
    }
    
    const ddd = numbers.slice(0, 2);
    const firstDigit = numbers.slice(2, 3);
    const firstPart = numbers.slice(3, 7);
    const secondPart = numbers.slice(7, 11);
    
    let result = "+55";
    if (ddd) result += ` (${ddd}`;
    if (numbers.length > 2) result += ") ";
    if (firstDigit) result += `${firstDigit} `;
    if (firstPart) result += firstPart;
    if (numbers.length > 7) result += `-${secondPart}`;
    
    return result;
};

/**
 * Validates a Brazilian mobile phone number.
 * Must have 11 digits (after 55) and the 3rd digit (first after DDD) must be 9.
 */
export const validatePhoneBR = (value: string): boolean => {
    let numbers = normalizeNumbers(value);
    
    // If it starts with 55, remove it for validation
    if (numbers.startsWith("55")) numbers = numbers.slice(2);
    
    // Must be exactly 11 digits: DDD (2) + 9 + 8 digits
    if (numbers.length !== 11) return false;
    
    // The 11th digit (3rd digit of 11-digit number) must be 9
    if (numbers[2] !== "9") return false;
    
    return true;
};
