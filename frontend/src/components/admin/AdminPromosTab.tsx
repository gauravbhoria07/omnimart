import { useState } from 'react';
import { Tag, Plus, Trash2 } from 'lucide-react';
import { api } from '../../utils/api';

interface AdminPromosTabProps {
  promos: any[];
  loading: boolean;
  onRefresh: () => void;
  addToast: (message: string, type: 'success' | 'error') => void;
}

export default function AdminPromosTab({ promos, loading, onRefresh, addToast }: AdminPromosTabProps) {
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('10');
  const [creating, setCreating] = useState(false);

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      addToast('Please enter a promo code', 'error');
      return;
    }

    const discountNum = parseFloat(discount);
    if (isNaN(discountNum) || discountNum <= 0 || discountNum > 100) {
      addToast('Discount percentage must be between 1 and 100', 'error');
      return;
    }

    setCreating(true);
    try {
      await api.post('/orders/promo', {
        code: code.trim().toUpperCase(),
        discountPercentage: discountNum,
        isActive: true,
      });
      addToast('Promo code created successfully', 'success');
      setCode('');
      setDiscount('10');
      onRefresh();
    } catch (err: any) {
      addToast(err.message || 'Failed to create promo code', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePromo = async (promoCode: string) => {
    if (!window.confirm(`Are you sure you want to delete promo code ${promoCode}?`)) return;
    try {
      await api.delete(`/orders/promo/${promoCode}`);
      addToast('Promo code deleted', 'success');
      onRefresh();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete promo code', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
        Loading active promo codes...
      </div>
    );
  }

  const safePromos = Array.isArray(promos) ? promos : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Create Promo Code */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-md)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Tag size={20} className="text-violet-500" />
          <span>Create New Promo Code</span>
        </h3>
        <form onSubmit={handleCreatePromo} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Code Name *</label>
            <input
              type="text"
              placeholder="e.g. SUMMER20"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none', textTransform: 'uppercase' }}
            />
          </div>
          <div style={{ width: '140px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Discount % *</label>
            <input
              type="number"
              min="1"
              max="100"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="btn-primary"
            style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            <span>{creating ? 'Creating...' : 'Add Promo'}</span>
          </button>
        </form>
      </div>

      {/* Promos List */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>Active Promo Codes ({safePromos.length})</h4>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '14px 20px' }}>Code</th>
                <th style={{ padding: '14px 20px' }}>Discount</th>
                <th style={{ padding: '14px 20px' }}>Status</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {safePromos.map((p) => (
                <tr key={p.code} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{p.code}</td>
                  <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>{p.discountPercentage}% OFF</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      Active
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDeletePromo(p.code)}
                      style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--error)', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                      title="Delete Promo"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {safePromos.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No active promo codes found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
