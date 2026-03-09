/**
 * Utility functions for notification UI adjustments.
 */

export interface NotificationData {
    _id: string;
    type: string;
    title: string;
    message: string;
    lotId?: string;
    auctionId?: string;
    externalLotId?: string;
    externalAuctionId?: string;
    lotUrl?: string;
    metadata?: {
        lotId?: string;
        auctionId?: string;
        [key: string]: any;
    };
}

/**
 * Builds the detail URL for a lot based on available notification data.
 */
export const getLotDetailsUrl = (n: NotificationData): string | null => {
    const lotId = n.metadata?.lotId || n.lotId || n.externalLotId;
    const auctionId = n.metadata?.auctionId || n.auctionId || n.externalAuctionId || '0';

    if (lotId) {
        return `/lots/${auctionId}/${lotId}`;
    }

    if (n.lotUrl) {
        return n.lotUrl;
    }

    return null;
};

/**
 * Cleans the notification message and extracts the lot title for alert notifications.
 */
export const getNotificationContent = (n: NotificationData) => {
    const isAlert = n.type === 'alert' || n.title === 'Novo lote encontrado!';
    const prefix = "Encontramos um lote que combina com seu alerta: ";

    if (isAlert && n.message.startsWith(prefix)) {
        const lotTitle = n.message.replace(prefix, "").trim();
        return {
            isAlert: true,
            lotTitle,
            subtext: "Baseado no seu alerta"
        };
    }

    return {
        isAlert: false,
        lotTitle: null,
        subtext: null
    };
};
