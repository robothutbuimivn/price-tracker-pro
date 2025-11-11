import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-secondary border-b border-border shadow-md">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent mr-3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
        </svg>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Price Tracker Pro
        </h1>
      </div>
    </header>
  );
};