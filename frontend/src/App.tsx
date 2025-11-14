import { useState, useCallback, useEffect, useMemo } from 'react';
import { Product, ScraperType, scraperTypeMap } from './types';
import { fetchProductPrice, simulateFetchProductPrice, getProducts, addProduct as addProductService, deleteProduct as deleteProductService, updateProduct as updateProductService, checkBackendHealth, savePriceHistory } from './services/scraperService';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { LoginPage } from './components/LoginPage';
import { AdminPanel } from './components/AdminPanel';
import { UserAccountPage } from './components/UserAccountPage';
import { ProductInput } from './components/ProductInput';
import { ProductTable } from './components/ProductTable';
import { ProductListTable } from './components/ProductListTable';
import { FilterPanel, FilterOptions } from './components/FilterPanel';
import { EditProductModal } from './components/EditProductModal';
import { Pagination } from './components/Pagination';
import { Footer } from './components/Footer';
import { PriceHistoryViewer } from './components/PriceHistoryViewer';
import { v4 as uuidv4 } from 'uuid';

// Helper function to map string to valid ScraperType
const getValidScraperType = (input: string): ScraperType => {
  const normalized = input.toLowerCase().trim();
  
  // Check if it's already a valid key
  if (Object.keys(scraperTypeMap).includes(normalized)) {
    return normalized as ScraperType;
  }
  
  // Try to match by value (display name)
  const matchedKey = Object.entries(scraperTypeMap).find(
    ([, value]) => value.toLowerCase() === normalized
  )?.[0];
  
  if (matchedKey) {
    return matchedKey as ScraperType;
  }
  
  // Default to generic if no match
  console.warn(`Unknown scraper type: "${input}", using "generic" as default`);
  return 'generic';
};

// Helper function to check if product is duplicate based on key fields
const isDuplicateProduct = (
  product1: Omit<Product, 'instanceId' | 'price' | 'lastChecked' | 'status' | 'isSimulated'>,
  product2: Omit<Product, 'instanceId' | 'price' | 'lastChecked' | 'status' | 'isSimulated'>
): boolean => {
  return (
    product1.productId.toLowerCase() === product2.productId.toLowerCase() &&
    product1.name.toLowerCase() === product2.name.toLowerCase() &&
    product1.url.toLowerCase() === product2.url.toLowerCase() &&
    product1.website.toLowerCase() === product2.website.toLowerCase() &&
    product1.scraperType === product2.scraperType
  );
};

// LocalStorage utility functions for price cache
const PRICE_CACHE_KEY = 'priceTrackerCache';

interface PriceCache {
  [instanceId: string]: {
    price: number;
    lastChecked: string;
  };
}

const getPriceCache = (): PriceCache => {
  try {
    const cache = localStorage.getItem(PRICE_CACHE_KEY);
    return cache ? JSON.parse(cache) : {};
  } catch (error) {
    console.error('Error reading price cache:', error);
    return {};
  }
};

const savePriceToCache = (instanceId: string, price: number, lastChecked: string): void => {
  try {
    const cache = getPriceCache();
    cache[instanceId] = { price, lastChecked };
    localStorage.setItem(PRICE_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving price cache:', error);
  }
};

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    productId: '',
    category: '',
    brand: '',
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activePage, setActivePage] = useState<'check-price' | 'add-product' | 'price-history' | 'account' | 'admin'>('check-price');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');

  // Kiểm tra token khi component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    const storedRole = localStorage.getItem('role') as 'user' | 'admin' | null;
    if (token && storedUsername && storedRole) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
      setRole(storedRole);
    }
  }, []);

  // Lấy danh sách sản phẩm từ backend khi component được mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        console.log("Checking backend health...");
        const isHealthy = await checkBackendHealth();
        console.log("Backend health:", isHealthy);
        
        const fetchedProducts = await getProducts();
        console.log("Products fetched:", fetchedProducts);
        
        // Lấy cache giá từ localStorage
        const priceCache = getPriceCache();
        
        // Chuyển đổi dữ liệu từ DB (không có status, price...) sang state của frontend
        const initialisedProducts = fetchedProducts.map(p => {
          const cached = priceCache[p.instanceId];
          return {
            ...p,
            price: cached ? cached.price : null,
            lastChecked: cached ? cached.lastChecked : null,
            status: cached ? 'checked' as const : 'idle' as const,
            isSimulated: false,
          };
        });
        setProducts(initialisedProducts);
      } catch (error) {
        console.error("Failed to fetch products from backend:", error);
        alert(`Failed to connect to backend: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);


  const addProduct = async (productData: Omit<Product, 'instanceId' | 'price' | 'lastChecked' | 'status' | 'isSimulated'>) => {
    const newProduct = {
        ...productData,
        instanceId: uuidv4(),
    };

    try {
        console.log("Adding product:", newProduct);
        await addProductService(newProduct as any);
        console.log("Product added successfully");
        // Thêm vào state của frontend sau khi đã lưu thành công ở backend
        setProducts(prev => [
            ...prev,
            {
                ...newProduct,
                price: null,
                lastChecked: null,
                status: 'idle' as const,
                isSimulated: false,
            }
        ]);
    } catch (error) {
        console.error("Failed to add product:", error);
        alert(`Failed to add product: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const addProductsFromPaste = async (pastedText: string) => {
    const rows = pastedText.trim().split('\n');
    
    // Parse all rows into products array
    const productsToAdd: (Omit<Product, 'instanceId' | 'price' | 'lastChecked' | 'status' | 'isSimulated'> & { category?: string; brand?: string })[] = [];
    const skippedDuplicates: string[] = [];
    
    for (const row of rows) {
      // Hỗ trợ cả tab-separated (từ sheet) và comma-separated
      let parts: string[] = [];
      if (row.includes('\t')) {
        // Tab-separated (từ Google Sheet, Excel)
        parts = row.split('\t').map(item => item.trim());
      } else {
        // Comma-separated
        parts = row.split(',').map(item => item.trim());
      }
      
      if (parts.length >= 4) {
        const [productId, name, url, website] = parts;
        let scraperType: ScraperType = 'generic';
        if (parts[4] && parts[4].length > 0) {
          scraperType = getValidScraperType(parts[4]);
        }
        let category = parts[5] && parts[5].length > 0 ? parts[5] : undefined;
        let brand = parts[6] && parts[6].length > 0 ? parts[6] : undefined;
        
        const newProduct = { productId, name, url, website, scraperType, category, brand };
        
        // Check if duplicate with existing products or already in current batch
        const isDuplicate = 
          products.some(p => isDuplicateProduct(newProduct, p)) ||
          productsToAdd.some(p => isDuplicateProduct(newProduct, p));
        
        if (isDuplicate) {
          skippedDuplicates.push(`${productId} - ${name}`);
        } else {
          productsToAdd.push(newProduct);
        }
      }
    }
    
    // Add non-duplicate products sequentially
    for (const product of productsToAdd) {
      await addProduct(product);
    }
    
    // Show feedback
    if (productsToAdd.length > 0 || skippedDuplicates.length > 0) {
      let message = `Added ${productsToAdd.length} product(s)`;
      if (skippedDuplicates.length > 0) {
        message += `, skipped ${skippedDuplicates.length} duplicate(s)`;
        if (skippedDuplicates.length <= 5) {
          message += `: ${skippedDuplicates.join(', ')}`;
        }
      }
      alert(message);
    }
  };

  const deleteProduct = async (instanceId: string) => {
     try {
        console.log("Deleting product:", instanceId);
        await deleteProductService(instanceId);
        console.log("Product deleted successfully");
        setProducts(prev => prev.filter(p => p.instanceId !== instanceId));
    } catch (error) {
        console.error("Failed to delete product:", error);
        alert(`Failed to delete product: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const saveEditedProduct = async (updatedProduct: Product) => {
    try {
      console.log("Updating product:", updatedProduct);
      const { price, lastChecked, status, isSimulated, ...productData } = updatedProduct;
      await updateProductService(productData as any);
      console.log("Product updated successfully");
      setProducts(prev => prev.map(p => p.instanceId === updatedProduct.instanceId ? updatedProduct : p));
      setIsEditModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error("Failed to update product:", error);
      alert(`Failed to update product: ${error instanceof Error ? error.message : String(error)}`);
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
                const lastCheckedTime = new Date().toISOString();
                
                // Lưu vào localStorage cache
                savePriceToCache(instanceId, newPrice, lastCheckedTime);
                
                // Lưu vào price history (backend)
                try {
                  await savePriceHistory(instanceId, productToCheck.productId, productToCheck.website, newPrice);
                  console.log('Price history saved successfully');
                } catch (historyError) {
                  console.error('Failed to save price history:', historyError);
                  // Không throw error - vẫn update UI ngay cả khi history save fail
                }
                
                setProducts(prev => prev.map(p => 
                    p.instanceId === instanceId 
                    ? { ...p, price: newPrice, status: 'checked', lastChecked: lastCheckedTime, isSimulated: false } 
                    : p
                ));
            } catch (error) {
                console.error("Failed to fetch price for", productToCheck.url, error);
                const simulatedPrice = simulateFetchProductPrice(productToCheck.url);
                const lastCheckedTime = new Date().toISOString();
                
                // Lưu simulated price vào cache cũng được
                savePriceToCache(instanceId, simulatedPrice, lastCheckedTime);
                
                setProducts(prev => prev.map(p => 
                    p.instanceId === instanceId 
                    ? { ...p, price: simulatedPrice, status: 'error', lastChecked: lastCheckedTime, isSimulated: true } 
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

  // Lọc sản phẩm dựa trên các filter được chọn
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const productIdMatch = product.productId.toLowerCase().includes(filters.productId.toLowerCase());
      
      // Category filter logic
      let categoryMatch = true;
      if (filters.category === '__uncategorized__') {
        categoryMatch = !product.category; // Show products with no category
      } else if (filters.category) {
        categoryMatch = product.category === filters.category;
      }
      // If filters.category is empty, show all products
      
      // Brand filter logic
      let brandMatch = true;
      if (filters.brand === '__unbranded__') {
        brandMatch = !product.brand; // Show products with no brand
      } else if (filters.brand) {
        brandMatch = product.brand === filters.brand;
      }
      // If filters.brand is empty, show all products
      
      return productIdMatch && categoryMatch && brandMatch;
    });
  }, [products, filters]);

  // Tính toán phân trang
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handleLoginSuccess = (_token: string, loggedInUsername: string, loggedInRole: string) => {
    setIsLoggedIn(true);
    setUsername(loggedInUsername);
    setRole(loggedInRole as 'user' | 'admin');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setUsername('');
  };

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-primary font-sans">
      <Header username={username} onLogout={handleLogout} />
      <Navigation activePage={activePage} onPageChange={setActivePage} isAdmin={role === 'admin'} />
      <main className="container mx-auto p-4 md:p-8">
        {activePage === 'check-price' && (
          <>
            <div className="mb-8 bg-secondary border border-border rounded-lg shadow-xl p-4 md:p-6">
              <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white mb-4 md:mb-0">Kiểm Tra Giá</h2>
                <button
                  onClick={checkAllPrices}
                  disabled={isLoading}
                  className="w-full md:w-auto bg-accent hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                  Kiểm Tra Tất Cả Giá
                </button>
              </div>
              {isLoading ? (
                <p className="text-center text-muted py-8">Đang tải sản phẩm từ cơ sở dữ liệu...</p>
              ) : products.length === 0 ? (
                <p className="text-center text-muted py-8">Chưa có sản phẩm nào. Hãy thêm sản phẩm từ trang "Thêm Sản Phẩm".</p>
              ) : (
                <>
                  {products.length > 0 && (
                    <FilterPanel products={products} filters={filters} onFilterChange={setFilters} />
                  )}
                  <ProductTable 
                    products={paginatedProducts} 
                    onCheckPrice={checkPrice} 
                    showActions={false}
                  />
                  {filteredProducts.length > 0 && (
                    <div className="mt-6">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={setItemsPerPage}
                        totalItems={filteredProducts.length}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {activePage === 'add-product' && (
          <>
            <ProductInput onAddProduct={addProduct} onAddFromPaste={addProductsFromPaste} />
            {!isLoading && products.length > 0 && (
              <ProductListTable 
                products={products} 
                onEditProduct={openEditModal} 
                onDeleteProduct={deleteProduct}
              />
            )}
          </>
        )}

        {activePage === 'price-history' && (
          <>
            <PriceHistoryViewer products={products} />
          </>
        )}

        {activePage === 'account' && (
          <>
            <UserAccountPage 
              username={username}
              role={role}
              password={localStorage.getItem('adminPassword') || localStorage.getItem('userPassword') || ''}
            />
          </>
        )}

        {activePage === 'admin' && role === 'admin' && (
          <>
            <AdminPanel 
              adminUsername={username} 
              adminPassword={localStorage.getItem('adminPassword') || ''} 
              currentUsername={username}
              currentRole={role}
            />
          </>
        )}

        {editingProduct && (
          <EditProductModal
            product={editingProduct}
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingProduct(null);
            }}
            onSave={saveEditedProduct}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;
