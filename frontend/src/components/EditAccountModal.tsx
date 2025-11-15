import React, { useState } from 'react';
import { getApiUrl } from '../utils/apiConfig';

interface EditAccountModalProps {
  userId: number;
  currentUsername: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUserRole: string; // Role of the person doing the editing
  currentUsername_editing: string; // Username of the person doing the editing
  currentPassword: string; // Password of the person doing the editing
}

export const EditAccountModal: React.FC<EditAccountModalProps> = ({
  userId,
  currentUsername,
  isOpen,
  onClose,
  onSuccess,
  currentUserRole,
  currentUsername_editing,
  currentPassword,
}) => {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Determine what can be edited based on role
  const isAdminEditing = currentUserRole === 'admin';

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!newUsername && !newPassword) {
      setError('Vui lòng nhập thông tin cần chỉnh sửa');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError('Mật khẩu không khớp');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setError('Mật khẩu phải ít nhất 6 ký tự');
      return;
    }

    if (newUsername && newUsername.length < 3) {
      setError('Tên đăng nhập phải ít nhất 3 ký tự');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(getApiUrl(`/auth/users/${userId}/edit`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newUsername: newUsername || undefined,
          newPassword: newPassword || undefined,
          currentUsername: currentUsername_editing,
          currentPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Lỗi cập nhật tài khoản');
        return;
      }

      setNewUsername('');
      setNewPassword('');
      setConfirmPassword('');
      alert('Cập nhật tài khoản thành công!');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-secondary border border-border rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-white mb-4">
          Chỉnh Sửa Tài Khoản: {currentUsername}
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-lg text-red-100 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username field - only for admin or if admin is editing */}
          {isAdminEditing && (
            <div>
              <label htmlFor="newUsername" className="block text-sm font-medium text-muted mb-2">
                Tên Đăng Nhập Mới (Không bắt buộc)
              </label>
              <input
                type="text"
                id="newUsername"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                disabled={isLoading}
                className="w-full bg-primary border border-border rounded-md px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
                placeholder={`Để trống để giữ: ${currentUsername}`}
              />
              <p className="text-xs text-muted mt-1">
                Chỉ admin mới có thể thay đổi tên đăng nhập
              </p>
            </div>
          )}

          {/* Password field - everyone can change their own password */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-muted mb-2">
              Mật Khẩu Mới (Không bắt buộc)
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
              className="w-full bg-primary border border-border rounded-md px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
              placeholder="Để trống để giữ nguyên"
            />
          </div>

          {/* Confirm password - only show if entering new password */}
          {newPassword && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted mb-2">
                Xác Nhận Mật Khẩu
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className="w-full bg-primary border border-border rounded-md px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>
          )}

          {/* Info message */}
          {!isAdminEditing && (
            <div className="p-3 bg-blue-900 border border-blue-700 rounded-lg text-blue-100 text-sm">
              Bạn chỉ có thể thay đổi mật khẩu của mình
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-accent hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Đang cập nhật...' : 'Cập Nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
