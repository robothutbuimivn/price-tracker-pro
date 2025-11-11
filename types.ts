export type ScraperType = 'generic' | 'woocommerce' | 'cellphones' | 'dienmayxanh' | 'fptshop';

export const scraperTypeMap: Record<ScraperType, string> = {
  generic: 'Generic',
  woocommerce: 'WooCommerce',
  cellphones: 'CellphoneS',
  dienmayxanh: 'Điện máy XANH',
  fptshop: 'FPT Shop',
};

export interface Product {
  instanceId: string; // Unique identifier for this specific entry
  productId: string;    // Shared identifier for the same product across different websites (e.g., SKU)
  name: string;
  url: string;
  website: string;
  price: number | null;
  lastChecked: string | null; // ISO string
  status: 'idle' | 'loading' | 'checked' | 'error';
  isSimulated?: boolean;
  scraperType: ScraperType;
}