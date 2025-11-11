import { ScraperType } from "../types";

/**
 * REAL WEB SCRAPER SERVICE CONNECTOR
 * ===================================
 * This function connects to a backend server that performs the actual web scraping.
 * The client-side (browser) cannot directly scrape other websites due to security
 * restrictions (CORS). Therefore, the frontend sends the URL to our own backend,
 * which then fetches the data and returns the result.
 * 
 * Before this works, you must have the backend server running.
 * The backend is responsible for handling potential scraping blocks, using correct
 * HTML selectors, and parsing the price data.
 * 
 * @param url - The product URL to scrape.
 * @param scraperType - The type of scraper to use for this URL.
 * @returns A promise that resolves to the product price fetched by the backend.
 */
export const fetchProductPrice = async (url: string, scraperType: ScraperType): Promise<number> => {
    // URL of your local backend server. Make sure it's running.
    const backendUrl = 'http://localhost:8080/scrape';
    console.log(`Sending scrape request for: ${url} to backend: ${backendUrl} with scraper: ${scraperType}`);

    try {
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Send the target URL and the chosen scraper type in the request body
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
        
        // Add a helpful message for common "Failed to fetch" errors.
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          console.error(
            '💡 This is a common network error. Please check the following:\n' +
            '1. Is your backend server running? (e.g., "node server.js")\n' +
            '2. Is the backend URL in scraperService.ts ("http://localhost:8080/scrape") correct?\n' +
            '3. Is a firewall or antivirus blocking the connection?\n' +
            '4. Check the browser console for more specific CORS errors.'
          );
        }

        // Re-throw the error so the component can handle the failed state
        throw error;
    }
};

/**
 * SIMULATED WEB SCRAPER (FALLBACK)
 * =================================
 * This function simulates fetching a product price and is used as a fallback
 * when the backend server is not reachable. It generates a consistent but
 * slightly variable price based on the product URL to mimic real-world pricing.
 * This allows the frontend to remain interactive for demonstration purposes.
 *
 * @param url - The product URL (used to seed the price).
 * @returns A simulated product price.
 */
export const simulateFetchProductPrice = (url: string): number => {
    console.warn(`Backend connection failed. Using simulated price for ${url}`);
    
    // Simple hash function to create a "stable" base price from the URL
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
        const char = url.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }

    const basePrice = (Math.abs(hash) % 2000000) + 500000; // Base price between 500,000 and 2,500,000
    const fluctuation = (Math.random() - 0.5) * 100000; // Fluctuate by +/- 50,000
    const finalPrice = Math.round((basePrice + fluctuation) / 1000) * 1000; // Round to nearest 1000

    return finalPrice;
};