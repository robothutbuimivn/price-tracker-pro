export type ScraperType = 'generic' | 'woocommerce' | 'cellphones' | 'dienmayxanh' | 'fptshop';

export const scraperTypeMap: Record<ScraperType, string> = {
  generic: 'Generic',
  woocommerce: 'WooCommerce',
  cellphones: 'CellphoneS',
  dienmayxanh: 'Điện máy XANH',
  fptshop: 'FPT Shop',
};

// Loại dữ liệu lưu trong DB
export interface ProductData {
  instanceId: string;
  productId: string;
  name: string;
  url: string;
  website: string;
  scraperType: ScraperType;
}

// Loại dữ liệu sử dụng trong state của frontend
export interface Product extends ProductData {
  price: number | null;
  lastChecked: string | null; // ISO string
  status: 'idle' | 'loading' | 'checked' | 'error';
  isSimulated?: boolean;
}
