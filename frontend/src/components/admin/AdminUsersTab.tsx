import { Users, Trash2, ShieldAlert, UserCheck } from 'lucide-react';
import { api } from '../../utils/api';

interface AdminUsersTabProps {
  users: any[];
  loading: boolean;
  onRefresh: () => void;
  addToast: (message: string, type: 'success' | 'error') => void;
}

export default function AdminUsersTab({ users, loading, onRefresh, addToast }: AdminUsersTabProps) {
  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await api.patch(`/auth/users/${userId}`, { role: newRole });
      addToast(`User role updated to ${newRole}`, 'success');
      onRefresh();
    } catch (err: any) {
      addToast(err.message || 'Failed to update user role', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/auth/users/${userId}`);
      addToast('User deleted successfully', 'success');
      onRefresh();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete user', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
        Loading registered user accounts...
      </div>
    );
  }

  const safeUsers = Array.isArray(users) ? users : [];

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={20} className="text-violet-500" />
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>User Management</h3>
        </div>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{safeUsers.length} registered accounts</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ padding: '14px 20px' }}>Name</th>
              <th style={{ padding: '14px 20px' }}>Email</th>
              <th style={{ padding: '14px 20px' }}>Role</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {safeUsers.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</td>
                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{u.email}</td>
                <td style={{ padding: '16px 20px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      background: u.role === 'admin' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      color: u.role === 'admin' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      border: `1px solid ${u.role === 'admin' ? 'rgba(139, 92, 246, 0.3)' : 'var(--glass-border)'}`
                    }}
                  >
                    {u.role === 'admin' ? <ShieldAlert size={14} /> : <UserCheck size={14} />}
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      onClick={() => handleToggleRole(u.id, u.role)}
                      style={{
                        fontSize: '12px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--glass-border)',
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      Set as {u.role === 'admin' ? 'User' : 'Admin'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--error)', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                      title="Delete User"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
