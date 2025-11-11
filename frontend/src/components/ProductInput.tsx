import React, { useState } from 'react';
import { Product, ScraperType, scraperTypeMap } from '../types';

interface ProductInputProps {
  onAddProduct: (product: Omit<Product, 'instanceId' | 'price' | 'lastChecked' | 'status' | 'isSimulated'>) => void;
  onAddFromPaste: (pastedText: string) => void;
}

type InputMode = 'manual' | 'paste';

export const ProductInput: React.FC<ProductInputProps> = ({ onAddProduct, onAddFromPaste }) => {
  const [mode, setMode] = useState<InputMode>('manual');
  
  const [productId, setProductId] = useState('');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [website, setWebsite] = useState('');
  const [scraperType, setScraperType] = useState<ScraperType>('generic');
  const [pastedText, setPastedText] = useState('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (productId && name && url && website) {
      onAddProduct({ productId, name, url, website, scraperType });
      setProductId('');
      setName('');
      setUrl('');
      setWebsite('');
      setScraperType('generic');
    }
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pastedText) {
      onAddFromPaste(pastedText);
      setPastedText('');
    }
  };
  
  const inputClasses = "w-full bg-primary border border-border rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent";

  return (
    <div className="bg-secondary border border-border rounded-lg shadow-xl p-4 md:p-6">
      <div className="mb-4 border-b border-border">
        <nav className="-mb-px flex space-x-6">
          <button onClick={() => setMode('manual')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${mode === 'manual' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-gray-200'}`}>
            Add Manually
          </button>
          <button onClick={() => setMode('paste')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${mode === 'paste' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-gray-200'}`}>
            Paste from Sheet
          </button>
        </nav>
      </div>

      {mode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="productId" className="block text-sm font-medium text-muted mb-1">Product ID (SKU)</label>
              <input type="text" id="productId" value={productId} onChange={(e) => setProductId(e.target.value)} className={inputClasses} placeholder="SKU-123" required />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-muted mb-1">Product Name</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClasses} placeholder="e.g., Wireless Mouse" required />
            </div>
             <div>
              <label htmlFor="website" className="block text-sm font-medium text-muted mb-1">Website</label>
              <input type="text" id="website" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClasses} placeholder="e.g., MyStore" required />
              <p className="text-xs text-muted mt-1">Nhập 'MyStore' cho sản phẩm của bạn để so sánh.</p>
            </div>
            <div>
              <label htmlFor="scraperType" className="block text-sm font-medium text-muted mb-1">Scraper Type</label>
              <select 
                  id="scraperType" 
                  value={scraperType} 
                  onChange={(e) => setScraperType(e.target.value as ScraperType)}
                  className={inputClasses}
              >
                  {Object.entries(scraperTypeMap).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                  ))}
              </select>
              <p className="text-xs text-muted mt-1">Chọn nền tảng của trang web.</p>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="url" className="block text-sm font-medium text-muted mb-1">Product URL</label>
              <input type="url" id="url" value={url} onChange={(e) => setUrl(e.target.value)} className={inputClasses} placeholder="https://..." required />
            </div>
          </div>
          <button type="submit" className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
            Add Product
          </button>
        </form>
      )}

      {mode === 'paste' && (
        <form onSubmit={handlePasteSubmit} className="space-y-4">
          <div>
            <label htmlFor="pastedText" className="block text-sm font-medium text-muted mb-1">Paste Data Here</label>
            <p className="text-xs text-muted mb-2">Định dạng: ID, Tên, URL, Website, ScraperType (mỗi sản phẩm một dòng, ScraperType là tùy chọn)</p>
            <textarea
              id="pastedText"
              rows={6}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className={inputClasses}
              placeholder="SKU-003, 4K Monitor, https://mystore.com/monitor, MyStore, generic&#10;SKU-004, Gaming Headset, https://competitor-a.com/headset, Competitor A, woocommerce"
            />
          </div>
          <button type="submit" className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
            Add Products
          </button>
        </form>
      )}
    </div>
  );
};
