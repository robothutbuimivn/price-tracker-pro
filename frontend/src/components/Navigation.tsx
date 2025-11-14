import React from 'react';

type PageType = 'check-price' | 'add-product' | 'price-history' | 'account' | 'admin';

interface NavigationProps {
  activePage: PageType;
  onPageChange: (page: PageType) => void;
  isAdmin?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ activePage, onPageChange, isAdmin }) => {
  return (
    <div className="bg-secondary border-b border-border shadow-md">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() => onPageChange('check-price')}
            className={`px-6 py-4 font-bold transition duration-300 border-b-2 ${
              activePage === 'check-price'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM15 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2zM5 13a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5z" />
            </svg>
            Kiểm Tra Giá
          </button>
          <button
            onClick={() => onPageChange('add-product')}
            className={`px-6 py-4 font-bold transition duration-300 border-b-2 ${
              activePage === 'add-product'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Thêm Sản Phẩm
          </button>
          <button
            onClick={() => onPageChange('price-history')}
            className={`px-6 py-4 font-bold transition duration-300 border-b-2 ${
              activePage === 'price-history'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v2H4a2 2 0 00-2 2v2h16V7a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v2H7V3a1 1 0 00-1-1zm0 5a2 2 0 002 2h8a2 2 0 002-2H6z" clipRule="evenodd" />
            </svg>
            Lịch Sử Giá
          </button>
          <button
            onClick={() => onPageChange('account')}
            className={`px-6 py-4 font-bold transition duration-300 border-b-2 ${
              activePage === 'account'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            Tài Khoản
          </button>
          {isAdmin && (
            <button
              onClick={() => onPageChange('admin')}
              className={`px-6 py-4 font-bold transition duration-300 border-b-2 ${
                activePage === 'admin'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted hover:text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Quản Lý Tài Khoản
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
