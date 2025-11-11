import React, { useState, useCallback, useEffect } from 'react';
import { Product, ScraperType } from './types';
import { fetchProductPrice, simulateFetchProductPrice, getProducts, addProduct as addProductService, deleteProduct as deleteProductService } from './services/scraperService';
import { Header } from './components/Header';
import { ProductInput } from './components/ProductInput';
import { ProductTable } from './components/ProductTable';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Lấy danh sách sản phẩm từ backend khi component được mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const fetchedProducts = await getProducts();
        // Chuyển đổi dữ liệu từ DB (không có status, price...) sang state của frontend
        const initialisedProducts = fetchedProducts.map(p => ({
            ...p,
            price: null,
            lastChecked: null,
            status: 'idle' as const,
            isSimulated: false,
        }));
        setProducts(initialisedProducts);
      } catch (error) {
        console.error("Failed to fetch products from backend:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);


  const addProduct = async (productData: Omit<Product, 'instanceId' | 'price' | 'lastChecked' | 'status' | 'isSimulated'>) => {
    const newProduct: Omit<Product, 'price' | 'lastChecked' | 'status' | 'isSimulated'> = {
        ...productData,
        instanceId: uuidv4(),
    };

    try {
        await addProductService(newProduct);
        // Thêm vào state của frontend sau khi đã lưu thành công ở backend
        setProducts(prev => [
            ...prev,
            {
                ...newProduct,
                price: null,
                lastChecked: null,
                status: 'idle',
                isSimulated: false,
            }
        ]);
    } catch (error) {
        console.error("Failed to add product:", error);
    }
  };

  const addProductsFromPaste = async (pastedText: string) => {
    const rows = pastedText.trim().split('\n');
    
    // Sử dụng for...of để xử lý tuần tự, tránh race condition
    for (const row of rows) {
      const parts = row.split(',').map(item => item.trim());
      if (parts.length >= 4) {
        const [productId, name, url, website] = parts;
        let scraperType = (parts[4] as ScraperType) || 'generic';
        
        // Bạn có thể thêm validation cho scraperType ở đây nếu muốn
        
        await addProduct({ productId, name, url, website, scraperType });
      }
    }
  };

  const deleteProduct = async (instanceId: string) => {
     try {
        await deleteProductService(instanceId);
        setProducts(prev => prev.filter(p => p.instanceId !== instanceId));
    } catch (error) {
        console.error("Failed to delete product:", error);
    }
  };

  const checkPrice = useCallback(async (instanceId: string) => {
    setProducts(prev => prev.map(p => p.instanceId === instanceId ? { ...p, status: 'loading' } : p));
    
    // Dùng callback với setState để đảm bảo có được product mới nhất
    setProducts(prevProducts => {
        const productToCheck = prevProducts.find(p => p.instanceId === instanceId);
        if (!productToCheck) return prevProducts;

        (async () => {
            try {
                const newPrice = await fetchProductPrice(productToCheck.url, productToCheck.scraperType);
                setProducts(prev => prev.map(p => 
                    p.instanceId === instanceId 
                    ? { ...p, price: newPrice, status: 'checked', lastChecked: new Date().toISOString(), isSimulated: false } 
                    : p
                ));
            } catch (error) {
                console.error("Failed to fetch price for", productToCheck.url, error);
                const simulatedPrice = simulateFetchProductPrice(productToCheck.url);
                setProducts(prev => prev.map(p => 
                    p.instanceId === instanceId 
                    ? { ...p, price: simulatedPrice, status: 'error', lastChecked: new Date().toISOString(), isSimulated: true } 
                    : p
                ));
            }
        })();
        
        return prevProducts;
    });
  }, []);

  const checkAllPrices = useCallback(async () => {
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
              disabled={isLoading}
              className="w-full md:w-auto bg-accent hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              Check All Prices
            </button>
          </div>
          {isLoading ? (
             <p className="text-center text-muted py-8">Loading products from database...</p>
          ) : (
            <ProductTable products={products} onCheckPrice={checkPrice} onDeleteProduct={deleteProduct} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
