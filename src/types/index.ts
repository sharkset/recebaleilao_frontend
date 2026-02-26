export interface Lot {
    _id: string;
    externalLotId?: string | number;
    sourceName?: string;
    auctionId?: string | number;
    ano?: number;
    anoModelo?: number;
    cor?: string;
    combustivel?: string;
    descricao?: string;
    car?: string;
    marca?: string;
    modelo?: string;
    descriptionHtml?: string;
    images?: string[];
    location?: string;
    loteUrl?: string;
    lotUrl?: string;
    precoMinimo?: number;
    quilometragem?: number;
    vehicleType?: string;
    versao?: string;
    createdAt?: string;
    endAt?: string;
    fipeValor?: number;
    lanceAtual?: number;
    visitas?: number;
    statusRaw?: string;
    raw?: {
        images?: string[];
        [key: string]: any;
    };
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

export interface LotsResponse {
    success: boolean;
    data: {
        lots: Lot[];
        pagination: Pagination;
        filters: any;
    };
}

export interface WatcherData {
    phoneNumber: string;
    filters: {
        marca?: string;
        modelo?: string;
        ano?: number;
        vehicleType?: string;
        minPrice?: number;
        maxPrice?: number;
    };
}
