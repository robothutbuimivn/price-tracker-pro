import { ScraperType, ProductData } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

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
        throw new Error('Failed to add product');
    }
    return response.json();
};

export const deleteProduct = async (instanceId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/products/${instanceId}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete product');
    }
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

/**
 * SIMULATED WEB SCRAPER (FALLBACK)
 */
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
