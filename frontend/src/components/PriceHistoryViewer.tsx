import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '../types';
import { getDailyPriceHistory, PriceHistory } from '../services/scraperService';

interface PriceHistoryViewerProps {
  products: Product[];
}

// Format timestamp to Vietnam timezone (GMT+7)
const formatToVietnamTime = (isoString: string | null): string => {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

export const PriceHistoryViewer: React.FC<PriceHistoryViewerProps> = ({ products }) => {
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Get unique product IDs for filter dropdown
  const productIds = useMemo(() => {
    return Array.from(new Set(products.map(p => p.productId))).sort();
  }, [products]);

  // Load price history khi filter thay đổi
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const history = await getDailyPriceHistory(
          selectedProductId || undefined,
          startDate || undefined,
          endDate || undefined
        );
        console.log('Price history loaded:', history);
        setPriceHistory(history);
      } catch (error) {
        console.error('Failed to load price history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [selectedProductId, startDate, endDate]);

  const handleClearFilters = () => {
    setSelectedProductId('');
    setStartDate('');
    setEndDate('');
  };

  const handleExportCSV = () => {
    if (priceHistory.length === 0) {
      alert('No data to export');
      return;
    }

    // Prepare CSV content
    const headers = ['Product ID', 'Product Name', 'Website', 'Price', 'Date'];
    const rows = priceHistory.map(h => [
      h.productId,
      h.name || '',
      h.website,
      h.price.toLocaleString('vi-VN'),
      h.date,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `price-history-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const inputClasses = "w-full bg-primary border border-border rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent";

  return (
    <div className="min-h-screen bg-primary font-sans p-4 md:p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Price History</h1>

        {/* Filters */}
        <div className="bg-secondary border border-border rounded-lg shadow-xl p-4 md:p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="filter-productId" className="block text-sm font-medium text-muted mb-1">
                Product ID
              </label>
              <select
                id="filter-productId"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className={inputClasses}
              >
                <option value="">All Products</option>
                {productIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-muted mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-muted mb-1">
                End Date
              </label>
              <input
                type="date"
                id="end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClasses}
              />
            </div>

            <div className="flex flex-col justify-end gap-2">
              <button
                onClick={handleClearFilters}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
              >
                Clear Filters
              </button>
              <button
                onClick={handleExportCSV}
                disabled={isLoading || priceHistory.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Price History Table */}
        <div className="bg-secondary border border-border rounded-lg shadow-xl p-4 md:p-6">
          {isLoading ? (
            <p className="text-center text-muted py-8">Loading price history...</p>
          ) : priceHistory.length === 0 ? (
            <p className="text-center text-muted py-8">No price history found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-primary">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Website
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-secondary divide-y divide-border">
                  {priceHistory.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{record.name}</div>
                        <div className="text-sm text-muted">{record.productId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {record.website}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
                        {record.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {record.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
