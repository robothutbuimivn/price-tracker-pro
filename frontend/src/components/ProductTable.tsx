import React, { useMemo, useState } from 'react';
import { Product, scraperTypeMap } from '../types';

interface ProductTableProps {
  products: Product[];
  onCheckPrice: (instanceId: string) => void;
  onDeleteProduct: (instanceId: string) => void;
  onEditProduct: (product: Product) => void;
}

interface ColumnVisibility {
  category: boolean;
  brand: boolean;
}

const LoadingSpinner: React.FC = () => (
  <svg className="animate-spin h-5 w-5 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const StatusIndicator: React.FC<{ product: Product; allProducts: Product[] }> = ({ product, allProducts }) => {
    if (product.status === 'error') {
        return <span className="text-yellow-400 text-sm italic">Connection failed</span>;
    }
    
    const comparison = useMemo(() => {
        if (product.website !== 'MyStore') {
            return { type: 'competitor' as const };
        }

        const myStorePrice = product.price;
        if (myStorePrice === null) {
            return { type: 'no-data' as const };
        }

        const competitors = allProducts.filter(p => p.productId === product.productId && p.website !== 'MyStore');
        const cheaperCompetitors = competitors.filter(c => c.price !== null && !c.isSimulated && c.price < myStorePrice);

        if (cheaperCompetitors.length > 0) {
            const bestCompetitor = cheaperCompetitors.reduce((best, current) => (current.price! < best.price! ? current : best));
            return {
                type: 'cheaper-found' as const,
                competitor: bestCompetitor.website,
                price: bestCompetitor.price
            };
        }
        return { type: 'best-price' as const };
    }, [product, allProducts]);

    const formatPrice = (price: number | null) => {
        if (price === null) return '';
        return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    }

    switch (comparison.type) {
        case 'best-price':
            return (
                <div className="flex items-center text-green-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <span>Best Price</span>
                </div>
            );
        case 'cheaper-found':
            return (
                <div className="flex items-center text-red-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    <span>Cheaper at {comparison.competitor} ({formatPrice(comparison.price)})</span>
                </div>
            );
        case 'competitor':
            return <span className="text-muted text-sm italic">Competitor</span>;
        case 'no-data':
            return <span className="text-muted text-sm italic">Awaiting data</span>;
        default:
            return null;
    }
};

export const ProductTable: React.FC<ProductTableProps> = ({ products, onCheckPrice, onDeleteProduct, onEditProduct }) => {
    const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
        category: true,
        brand: true,
    });

    const toggleColumnVisibility = (column: keyof ColumnVisibility) => {
        setColumnVisibility(prev => ({
            ...prev,
            [column]: !prev[column],
        }));
    };

    if (products.length === 0) {
        return <p className="text-center text-muted py-8">Chưa có sản phẩm nào. Hãy thêm sản phẩm để bắt đầu theo dõi.</p>
    }
    return (
    <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
            <thead className="bg-primary">
                <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Product</th>
                    {columnVisibility.category && (
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                            <div className="flex items-center justify-between">
                                <span>Category</span>
                                <button
                                    onClick={() => toggleColumnVisibility('category')}
                                    className="ml-2 p-1 text-muted hover:text-white transition-colors"
                                    title="Hide column"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </th>
                    )}
                    {columnVisibility.brand && (
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                            <div className="flex items-center justify-between">
                                <span>Brand</span>
                                <button
                                    onClick={() => toggleColumnVisibility('brand')}
                                    className="ml-2 p-1 text-muted hover:text-white transition-colors"
                                    title="Hide column"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </th>
                    )}
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Website</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Current Price</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Last Checked</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
            </thead>
            <tbody className="bg-secondary divide-y divide-border">
                {products.map((product) => (
                    <tr key={product.instanceId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">{product.name}</div>
                            <div className="text-sm text-muted">{product.productId}</div>
                        </td>
                        {columnVisibility.category && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {product.category || <span className="text-muted italic">-</span>}
                            </td>
                        )}
                        {columnVisibility.brand && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {product.brand || <span className="text-muted italic">-</span>}
                            </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                           <div className="flex items-center">
                                <a 
                                    href={product.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-accent hover:text-blue-300 underline flex items-center"
                                    title="Open product link"
                                >
                                    {product.website}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M11 3a1 1 0 100 2h3.586L9.293 9.293a1 1 0 001.414 1.414L16 6.414V10a1 1 0 102 0V4a1 1 0 00-1-1h-6z" />
                                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                    </svg>
                                </a>
                                {product.website === 'MyStore' && (
                                    <span className="ml-2 text-xs font-semibold bg-accent text-white px-2 py-0.5 rounded-full">
                                        My Store
                                    </span>
                                )}
                           </div>
                           <div className="text-xs text-muted mt-1">
                                Scraper: {scraperTypeMap[product.scraperType]}
                           </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
                            <div className="flex items-center">
                                <span>
                                    {product.price !== null ? product.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : 'N/A'}
                                </span>
                                {product.isSimulated && (
                                    <div className="group relative ml-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <div className="absolute bottom-full mb-2 left-1/2 z-10 w-48 -translate-x-1/2 transform rounded-lg bg-primary border border-border px-3 py-2 text-center text-sm font-normal text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Backend not connected. This is a simulated price.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <StatusIndicator product={product} allProducts={products} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                            {product.lastChecked ? new Date(product.lastChecked).toLocaleString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-3">
                                <button onClick={() => onCheckPrice(product.instanceId)} disabled={product.status === 'loading'} className="text-accent hover:text-blue-400 disabled:text-muted disabled:cursor-not-allowed">
                                    {product.status === 'loading' ? <LoadingSpinner /> : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.899 2.186l-1.414 1.414A5.002 5.002 0 005.999 7.49l-.496.497a1 1 0 01-1.414 0l-2-2A1 1 0 012 5V3a1 1 0 011-1h1zm12 14a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.899-2.186l1.414-1.414A5.002 5.002 0 0014.001 12.51l.496-.497a1 1 0 011.414 0l2 2a1 1 0 010 1.414l-2 2a1 1 0 01-1 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                                <button onClick={() => onEditProduct(product)} className="text-blue-500 hover:text-blue-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                </button>
                                <button onClick={() => onDeleteProduct(product.instanceId)} className="text-red-500 hover:text-red-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  );
};
