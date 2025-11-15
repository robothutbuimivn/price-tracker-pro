import React, { useState } from 'react';
import { getApiUrl } from '../utils/apiConfig';

interface LoginPageProps {
  onLoginSuccess: (token: string, username: string, role: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(getApiUrl('/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Đã xảy ra lỗi');
        return;
      }

      // Login success
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.user.username);
      localStorage.setItem('role', data.user.role);
      if (data.user.role === 'admin') {
        localStorage.setItem('adminPassword', password);
      } else {
        localStorage.setItem('userPassword', password);
      }
      onLoginSuccess(data.token, data.user.username, data.user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối đến máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-secondary border border-border rounded-lg shadow-xl p-8">
        <div className="flex items-center justify-center mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-accent mr-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
          </svg>
          <h1 className="text-3xl font-bold text-white">Price Tracker Pro</h1>
        </div>

        <h2 className="text-2xl font-bold text-white mb-6 text-center">Đăng Nhập</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-lg text-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-muted mb-2">
              Tên Đăng Nhập
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              className="w-full bg-primary border border-border rounded-md px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
              placeholder="Nhập tên đăng nhập"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-muted mb-2">
              Mật Khẩu
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full bg-primary border border-border rounded-md px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
              placeholder="Nhập mật khẩu"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Đang xử lý...' : 'Đăng Nhập'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-border text-center">
          <p className="text-xs text-muted">
            Liên hệ admin để được cấp tài khoản
          </p>
        </div>
      </div>
    </div>
  );
};
