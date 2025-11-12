export type ScraperType = 'generic' | 'woocommerce' | 'cellphones' | 'dienmayxanh' | 'fptshop' | 'quang_hanh' | 'techzhome' | 'vietnamrobotics' | 'meta' | 'miworld' | 'gia_khang';

export const scraperTypeMap: Record<ScraperType, string> = {
  generic: 'Generic',
  woocommerce: 'WooCommerce',
  cellphones: 'CellphoneS',
  dienmayxanh: 'Điện máy XANH',
  fptshop: 'FPT Shop',
  quang_hanh: 'Điện máy Quang Hạnh',
  techzhome: 'Techzhome',
  vietnamrobotics: 'Vietnamrobotics',
  meta: 'Meta',
  miworld: 'Miworld',
  gia_khang: 'Điện máy Gia Khang',
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
