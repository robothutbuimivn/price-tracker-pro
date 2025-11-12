import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Product, ScraperType, scraperTypeMap } from './types';
import { fetchProductPrice, simulateFetchProductPrice, getProducts, addProduct as addProductService, deleteProduct as deleteProductService, updateProduct as updateProductService, checkBackendHealth } from './services/scraperService';
import { Header } from './components/Header';
import { ProductInput } from './components/ProductInput';
import { ProductTable } from './components/ProductTable';
import { FilterPanel, FilterOptions } from './components/FilterPanel';
import { EditProductModal } from './components/EditProductModal';
import { Pagination } from './components/Pagination';
import { Footer } from './components/Footer';
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

  // Lấy danh sách sản phẩm từ backend khi component được mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        console.log("Checking backend health...");
        const isHealthy = await checkBackendHealth();
        console.log("Backend health:", isHealthy);
        
        const fetchedProducts = await getProducts();
        console.log("Products fetched:", fetchedProducts);
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

  // Lọc sản phẩm dựa trên các filter được chọn
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const productIdMatch = product.productId.toLowerCase().includes(filters.productId.toLowerCase());
      const categoryMatch = !filters.category || (product.category && product.category === filters.category);
      const brandMatch = !filters.brand || (product.brand && product.brand === filters.brand);
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

  return (
    <div className="min-h-screen bg-primary font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <ProductInput onAddProduct={addProduct} onAddFromPaste={addProductsFromPaste} />
        {!isLoading && products.length > 0 && (
          <FilterPanel products={products} filters={filters} onFilterChange={setFilters} />
        )}
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
            <>
              <ProductTable products={paginatedProducts} onCheckPrice={checkPrice} onDeleteProduct={deleteProduct} onEditProduct={openEditModal} />
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
