import React, { useState } from 'react';
import { EditAccountModal } from './EditAccountModal';

interface UserAccountPageProps {
  username: string;
  role: string;
  password: string;
}

export const UserAccountPage: React.FC<UserAccountPageProps> = ({
  username,
  role,
  password,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h2 className="text-3xl font-bold text-white mb-6">Tài Khoản Của Tôi</h2>

      {/* Account Info */}
      <div className="bg-secondary border border-border rounded-lg shadow-xl p-6 max-w-2xl">
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-border">
            <span className="text-muted font-semibold">Tên Đăng Nhập:</span>
            <span className="text-white font-semibold">{username}</span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-border">
            <span className="text-muted font-semibold">Vai Trò:</span>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                role === 'admin'
                  ? 'bg-red-900 text-red-100'
                  : 'bg-gray-700 text-gray-100'
              }`}
            >
              {role === 'admin' ? 'Quản Trị Viên' : 'Người Dùng'}
            </span>
          </div>

          <div className="pt-4">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="bg-accent hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
            >
              Chỉnh Sửa Tài Khoản
            </button>
          </div>
        </div>
      </div>

      {/* Edit Account Modal */}
      <EditAccountModal
        userId={0} // Placeholder, won't be used since we're only editing own account
        currentUsername={username}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          // In a real app, might need to logout and re-login or refresh token
          alert('Tài khoản cập nhật thành công. Vui lòng đăng nhập lại.');
          window.location.reload();
        }}
        currentUserRole={role}
        currentUsername_editing={username}
        currentPassword={password}
      />
    </div>
  );
};
