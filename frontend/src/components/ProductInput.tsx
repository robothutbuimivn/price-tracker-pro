import React, { useState } from 'react';
import { Product, ScraperType, scraperTypeMap } from '../types';

interface ProductInputProps {
  onAddProduct: (product: Omit<Product, 'instanceId' | 'price' | 'lastChecked' | 'status' | 'isSimulated'>) => void;
  onAddFromPaste: (pastedText: string) => void;
}

type InputMode = 'manual' | 'paste' | 'file';

export const ProductInput: React.FC<ProductInputProps> = ({ onAddProduct, onAddFromPaste }) => {
  const [mode, setMode] = useState<InputMode>('manual');
  
  const [productId, setProductId] = useState('');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [website, setWebsite] = useState('');
  const [scraperType, setScraperType] = useState<ScraperType>('generic');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [fileLoading, setFileLoading] = useState(false);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (productId && name && url && website) {
      const productData: any = {
        productId,
        name,
        url,
        website,
        scraperType,
      };
      if (category) productData.category = category;
      if (brand) productData.brand = brand;
      onAddProduct(productData);
      setProductId('');
      setName('');
      setUrl('');
      setWebsite('');
      setScraperType('generic');
      setCategory('');
      setBrand('');
    }
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pastedText) {
      onAddFromPaste(pastedText);
      setPastedText('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        onAddFromPaste(text);
        // Reset file input
        e.target.value = '';
      } catch (error) {
        alert(`Error reading file: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setFileLoading(false);
      }
    };
    reader.onerror = () => {
      alert('Error reading file');
      setFileLoading(false);
    };
    reader.readAsText(file);
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
          <button onClick={() => setMode('file')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${mode === 'file' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-gray-200'}`}>
            Import File
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
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-muted mb-1">Category (Danh mục)</label>
              <input type="text" id="category" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClasses} placeholder="e.g., Robot hút bụi" />
            </div>
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-muted mb-1">Brand (Hãng)</label>
              <input type="text" id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClasses} placeholder="e.g., Roborock" />
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
            <p className="text-xs text-muted mb-2">
              <strong>Hỗ trợ 2 format:</strong><br/>
              <strong>1. Tab-separated (từ Google Sheet, Excel):</strong> ID, Tên, URL, Website, ScraperType, Category, Brand<br/>
              <strong>2. Comma-separated:</strong> ID, Tên, URL, Website, ScraperType, Category, Brand<br/>
              <em>(Mỗi sản phẩm một dòng, 3 trường cuối là tùy chọn)</em>
            </p>
            <textarea
              id="pastedText"
              rows={8}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className={inputClasses}
              placeholder="Ví dụ Google Sheet:&#10;xiaomi-vacuum-5-pro	Robot hút bụi Xiaomi Vacuum 5 Pro	https://example.com/product1	MyStore	WooCommerce	Robot hút bụi	Xiaomi&#10;roborock-qrevo	Robot hút bụi Roborock Qrevo	https://example.com/product2	MyStore	WooCommerce	Robot hút bụi	Roborock&#10;&#10;Hoặc CSV:&#10;SKU-003, 4K Monitor, https://mystore.com/monitor, MyStore, generic, Màn hình, Dell"
            />
          </div>
          <button type="submit" className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
            Add Products
          </button>
        </form>
      )}

      {mode === 'file' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="fileInput" className="block text-sm font-medium text-muted mb-1">Import from File</label>
            <p className="text-xs text-muted mb-4">
              <strong>Hỗ trợ định dạng:</strong><br/>
              • <strong>Excel:</strong> Mở file Excel → Select All → Copy → Dùng "Paste from Sheet"<br/>
              • <strong>CSV:</strong> .csv file (tab-separated hoặc comma-separated)<br/>
              • <strong>TXT:</strong> .txt file (tab-separated hoặc comma-separated)<br/>
              <br/>
              <strong>Cấu trúc:</strong> ID {'\t'} Tên {'\t'} URL {'\t'} Website {'\t'} ScraperType {'\t'} Category {'\t'} Brand<br/>
              <em>(3 trường cuối là tùy chọn)</em>
            </p>
            <div className="relative">
              <input
                type="file"
                id="fileInput"
                onChange={handleFileSelect}
                accept=".csv,.txt,.tsv"
                className="hidden"
              />
              <label
                htmlFor="fileInput"
                className="block w-full bg-primary border border-border border-dashed rounded-md px-3 py-8 text-center cursor-pointer hover:bg-gray-800 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-accent mb-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 16.5a1 1 0 01-1-1V9.707l-1.146 1.147a1 1 0 01-1.414-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L9 9.707V15.5a1 1 0 01-1 1zm2-10a1 1 0 011-1h5a2 2 0 012 2v5a2 2 0 01-2 2H11a1 1 0 110-2h5V7.5h-5a1 1 0 01-1-1zM5 5a2 2 0 012-2h3a1 1 0 000-2H7a4 4 0 000 8h.5a1 1 0 110 2H7a4 4 0 010-8z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-gray-200">
                  {fileLoading ? 'Loading...' : 'Click để chọn file hoặc kéo thả file'}
                </p>
                <p className="text-xs text-muted mt-1">CSV, TSV, hoặc TXT (tab-separated)</p>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
