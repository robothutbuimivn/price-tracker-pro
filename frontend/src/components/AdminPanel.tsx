import React, { useState, useEffect } from 'react';
import { EditAccountModal } from './EditAccountModal';

interface User {
  id: number;
  username: string;
  role: string;
  createdAt: string;
}

interface AdminPanelProps {
  adminUsername: string;
  adminPassword: string;
  currentUsername: string;
  currentRole: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  adminUsername, 
  adminPassword,
  currentUsername,
  currentRole,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fetch(
        `http://localhost:8080/auth/users?adminUsername=${encodeURIComponent(adminUsername)}&adminPassword=${encodeURIComponent(adminPassword)}`
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Lỗi tải danh sách người dùng');
        return;
      }

      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }

    try {
      setIsCreating(true);
      setError('');
      const response = await fetch('http://localhost:8080/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          adminUsername,
          adminPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Lỗi tạo tài khoản');
        return;
      }

      setNewUsername('');
      setNewPassword('');
      alert('Tạo tài khoản thành công!');
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Bạn có chắc muốn xóa tài khoản "${username}"?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/auth/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUsername, adminPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Lỗi xóa tài khoản');
        return;
      }

      alert('Xóa tài khoản thành công!');
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối');
    }
  };

  const handleToggleRole = async (userId: number, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const confirmMsg = `Thay đổi quyền của tài khoản này thành "${newRole}"?`;

    if (!confirm(confirmMsg)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/auth/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newRole, adminUsername, adminPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Lỗi cập nhật quyền');
        return;
      }

      alert('Cập nhật quyền thành công!');
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối');
    }
  };

  const handleEditClick = (userId: number) => {
    setEditingUserId(userId);
    setIsEditModalOpen(true);
  };

  const selectedUser = users.find(u => u.id === editingUserId);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h2 className="text-3xl font-bold text-white mb-6">Quản Lý Tài Khoản</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg text-red-100">
          {error}
        </div>
      )}

      {/* Create new user form */}
      <div className="mb-8 bg-secondary border border-border rounded-lg shadow-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Tạo Tài Khoản Mới</h3>
        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            disabled={isCreating}
            className="bg-primary border border-border rounded-md px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
            placeholder="Tên đăng nhập"
            required
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isCreating}
            className="bg-primary border border-border rounded-md px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
            placeholder="Mật khẩu (tối thiểu 6 ký tự)"
            required
          />
          <button
            type="submit"
            disabled={isCreating}
            className="bg-accent hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Đang tạo...' : 'Tạo Tài Khoản'}
          </button>
        </form>
      </div>

      {/* Users list */}
      <div className="bg-secondary border border-border rounded-lg shadow-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Danh Sách Tài Khoản ({users.length})</h3>

        {isLoading ? (
          <p className="text-center text-muted py-8">Đang tải...</p>
        ) : users.length === 0 ? (
          <p className="text-center text-muted py-8">Không có tài khoản nào</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-primary">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Tên Đăng Nhập
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Quyền
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Tạo Lúc
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Tác Vụ</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-secondary divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">{user.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'admin'
                            ? 'bg-red-900 text-red-100'
                            : 'bg-gray-700 text-gray-100'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          onClick={() => handleEditClick(user.id)}
                          className="text-green-500 hover:text-green-400 text-xs font-semibold"
                          title="Chỉnh sửa tài khoản"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleToggleRole(user.id, user.role)}
                          className="text-blue-500 hover:text-blue-400 text-xs font-semibold"
                          title={`Thay đổi quyền thành ${user.role === 'admin' ? 'user' : 'admin'}`}
                        >
                          {user.role === 'admin' ? 'Hạ cấp' : 'Nâng cấp'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          className="text-red-500 hover:text-red-400 text-xs font-semibold"
                          title="Xóa tài khoản"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Account Modal */}
      {selectedUser && (
        <EditAccountModal
          userId={editingUserId!}
          currentUsername={selectedUser.username}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingUserId(null);
          }}
          onSuccess={loadUsers}
          currentUserRole={currentRole}
          currentUsername_editing={currentUsername}
          currentPassword={adminPassword}
        />
      )}
    </div>
  );
};
