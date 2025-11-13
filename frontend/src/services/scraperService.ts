import { ScraperType, ProductData } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// --- Price History Types ---

export interface PriceHistory {
  id: number;
  instanceId: string;
  productId: string;
  website: string;
  price: number;
  date: string;
  checkedAt: string;
  name?: string;
}

export interface DailyPriceHistory extends PriceHistory {
  dailyPrice?: number;
}

// --- Product Management API Calls ---

export const getProducts = async (): Promise<ProductData[]> => {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) {
        throw new Error('Failed to fetch products from backend');
    }
    return response.json();
};

export const addProduct = async (product: ProductData): Promise<ProductData> => {
    const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to add product: ${response.statusText}`);
    }
    return response.json();
};

export const deleteProduct = async (instanceId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/products/${instanceId}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete product: ${response.statusText}`);
    }
};

export const updateProduct = async (product: ProductData): Promise<ProductData> => {
    const response = await fetch(`${API_BASE_URL}/products/${product.instanceId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update product: ${response.statusText}`);
    }
    const data = await response.json();
    return data.product || data;
};


// --- Price Scraping API Call ---

export const fetchProductPrice = async (url: string, scraperType: ScraperType): Promise<number> => {
    const backendUrl = `${API_BASE_URL}/scrape`;
    console.log(`Sending scrape request for: ${url} to backend: ${backendUrl} with scraper: ${scraperType}`);

    try {
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url, scraperType }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Backend returned status: ${response.status}`);
        }

        const data = await response.json();
        
        if (typeof data.price !== 'number') {
          throw new Error('Invalid price format received from backend');
        }

        return data.price;
    } catch (error) {
        console.error(`Error fetching price from backend for URL ${url}:`, error);
        
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          console.error(
            '💡 Lỗi mạng phổ biến. Vui lòng kiểm tra:\n' +
            '1. Backend server có đang chạy không? (chạy "npm start" trong thư mục backend)\n' +
            '2. URL backend trong scraperService.ts ("http://localhost:8080") có đúng không?\n' +
            '3. Tường lửa hoặc antivirus có chặn kết nối không?'
          );
        }

        throw error;
    }
};

// Health check
export const checkBackendHealth = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        return response.ok;
    } catch (error) {
        console.error('Backend health check failed:', error);
        return false;
    }
};


// --- Price History API Calls ---

export const getPriceHistory = async (productId?: string, startDate?: string, endDate?: string): Promise<PriceHistory[]> => {
    const params = new URLSearchParams();
    if (productId) params.append('productId', productId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const query = params.toString();
    const url = `${API_BASE_URL}/price-history${query ? '?' + query : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch price history');
    }
    return response.json();
};

export const getDailyPriceHistory = async (productId?: string, startDate?: string, endDate?: string): Promise<DailyPriceHistory[]> => {
    const params = new URLSearchParams();
    if (productId) params.append('productId', productId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const query = params.toString();
    const url = `${API_BASE_URL}/price-history/daily${query ? '?' + query : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch daily price history');
    }
    return response.json();
};

export const savePriceHistory = async (instanceId: string, productId: string, website: string, price: number): Promise<PriceHistory> => {
    const response = await fetch(`${API_BASE_URL}/price-history`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instanceId, productId, website, price }),
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save price history');
    }
    return response.json();
};

export const deletePriceHistoryOld = async (days: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/price-history/old/${days}`, {
        method: 'DELETE',
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete old price history');
    }
};


export const simulateFetchProductPrice = (url: string): number => {
    console.warn(`Backend connection failed. Using simulated price for ${url}`);
    
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
        const char = url.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }

    const basePrice = (Math.abs(hash) % 2000000) + 500000;
    const fluctuation = (Math.random() - 0.5) * 100000;
    const finalPrice = Math.round((basePrice + fluctuation) / 1000) * 1000;

    return finalPrice;
};
