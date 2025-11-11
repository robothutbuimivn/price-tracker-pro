import React, { useState, useCallback } from 'react';
import { Product, ScraperType, scraperTypeMap } from './types';
import { fetchProductPrice, simulateFetchProductPrice } from './services/scraperService';
import { Header } from './components/Header';
import { ProductInput } from './components/ProductInput';
import { ProductTable } from './components/ProductTable';
import { v4 as uuidv4 } from 'uuid';

const initialProducts: Product[] = [
  {
    instanceId: '1',
    productId: 'SKU-001',
    name: 'High-Performance Wireless Mouse',
    url: 'https://mystore.com/products/wireless-mouse',
    website: 'MyStore',
    price: 79.99,
    lastChecked: new Date().toISOString(),
    status: 'idle',
    isSimulated: false,
    scraperType: 'generic',
  },
  {
    instanceId: '2',
    productId: 'SKU-001',
    name: 'Gaming Mouse Pro',
    url: 'https://competitor-a.com/gaming-mouse-pro',
    website: 'Competitor A',
    price: 75.50,
    lastChecked: new Date().toISOString(),
    status: 'idle',
    isSimulated: false,
    scraperType: 'generic',
  },
  {
    instanceId: '3',
    productId: 'SKU-001',
    name: 'Wireless Mouse v2',
    url: 'https://competitor-b.com/mouse-v2',
    website: 'Competitor B',
    price: 82.00,
    lastChecked: new Date().toISOString(),
    status: 'idle',
    isSimulated: false,
    scraperType: 'generic',
  },
  {
    instanceId: '4',
    productId: 'SKU-002',
    name: 'Mechanical Keyboard RGB',
    url: 'https://mystore.com/products/mech-keyboard',
    website: 'MyStore',
    price: 129.99,
    lastChecked: new Date().toISOString(),
    status: 'idle',
    isSimulated: false,
    scraperType: 'generic',
  },
   {
    instanceId: '5',
    productId: 'SKU-002',
    name: 'Mechanical Keyboard',
    url: 'https://competitor-a.com/mech-keyboard',
    website: 'Competitor A',
    price: 119.99,
    lastChecked: new Date().toISOString(),
    status: 'idle',
    isSimulated: false,
    scraperType: 'generic',
  },
];


function App() {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  const addProduct = (product: Omit<Product, 'instanceId' | 'price' | 'lastChecked' | 'status' | 'isSimulated'>) => {
    setProducts(prev => [
      ...prev,
      {
        ...product,
        instanceId: uuidv4(),
        price: null,
        lastChecked: null,
        status: 'idle',
        isSimulated: false,
      }
    ]);
  };

  const addProductsFromPaste = (pastedText: string) => {
    const newProducts: Product[] = [];
    const rows = pastedText.trim().split('\n');
    const validScraperTypes = Object.keys(scraperTypeMap);

    rows.forEach(row => {
      const parts = row.split(',').map(item => item.trim());
      if (parts.length >= 4) {
        const [productId, name, url, website] = parts;
        let scraperType = (parts[4] as ScraperType) || 'generic';
        if (!validScraperTypes.includes(scraperType)) {
          scraperType = 'generic';
        }

        newProducts.push({
          instanceId: uuidv4(),
          productId,
          name,
          url,
          website,
          price: null,
          lastChecked: null,
          status: 'idle',
          isSimulated: false,
          scraperType,
        });
      }
    });
    setProducts(prev => [...prev, ...newProducts]);
  };


  const deleteProduct = (instanceId: string) => {
    setProducts(prev => prev.filter(p => p.instanceId !== instanceId));
  };

  const checkPrice = useCallback(async (instanceId: string) => {
    setProducts(prev => prev.map(p => p.instanceId === instanceId ? { ...p, status: 'loading' } : p));
    
    const productToCheck = products.find(p => p.instanceId === instanceId);
    if (!productToCheck) return;

    try {
      const newPrice = await fetchProductPrice(productToCheck.url, productToCheck.scraperType);
      setProducts(prev => prev.map(p => 
        p.instanceId === instanceId 
        ? { ...p, price: newPrice, status: 'checked', lastChecked: new Date().toISOString(), isSimulated: false } 
        : p
      ));
    } catch (error) {
      console.error("Failed to fetch price for", productToCheck.url, error);
      // Fallback to simulation on error
      const simulatedPrice = simulateFetchProductPrice(productToCheck.url);
      setProducts(prev => prev.map(p => 
        p.instanceId === instanceId 
        ? { ...p, price: simulatedPrice, status: 'error', lastChecked: new Date().toISOString(), isSimulated: true } 
        : p
      ));
    }
  }, [products]);

  const checkAllPrices = useCallback(async () => {
    // Using a for...of loop to check prices sequentially to avoid overwhelming a potential backend
    for (const product of products) {
        await checkPrice(product.instanceId);
    }
  }, [products, checkPrice]);

  return (
    <div className="min-h-screen bg-primary font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <ProductInput onAddProduct={addProduct} onAddFromPaste={addProductsFromPaste} />
        <div className="mt-8 bg-secondary border border-border rounded-lg shadow-xl p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white mb-4 md:mb-0">Product Comparison</h2>
            <button
              onClick={checkAllPrices}
              className="w-full md:w-auto bg-accent hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
            >
              Check All Prices
            </button>
          </div>
          <ProductTable products={products} onCheckPrice={checkPrice} onDeleteProduct={deleteProduct} />
        </div>
      </main>
    </div>
  );
}

export default App;