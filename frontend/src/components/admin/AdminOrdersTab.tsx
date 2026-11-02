import { useState } from 'react';
import { ClipboardList, Filter, Calendar, MapPin, Package, DollarSign, User, LayoutGrid, List } from 'lucide-react';
import { api } from '../../utils/api';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  items: OrderItem[];
  total: number;
  address: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  statusHistory?: { status: string; timestamp: string }[];
  createdAt: string;
}

interface AdminOrdersTabProps {
  orders: Order[];
  loading: boolean;
  showCancelledOnly?: boolean;
  onRefresh: () => void;
  addToast: (message: string, type: 'success' | 'error') => void;
}

export default function AdminOrdersTab({ orders, loading, showCancelledOnly = false, onRefresh, addToast }: AdminOrdersTabProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      addToast(`Order ${orderId} updated to ${newStatus}`, 'success');
      onRefresh();
    } catch (err: any) {
      addToast(err.message || 'Failed to update order status', 'error');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (showCancelledOnly) return o.status === 'cancelled';
    if (filterStatus === 'all') return o.status !== 'cancelled';
    return o.status === filterStatus;
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
        Loading order list...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Controls Bar */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-md)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ClipboardList size={22} className="text-violet-500" />
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
            {showCancelledOnly ? 'Cancelled Orders Management' : 'Order Tracking & Status Management'}
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* View Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'cards' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'cards' ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              <LayoutGrid size={14} />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'table' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'table' ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              <List size={14} />
              <span>Table</span>
            </button>
          </div>

          {/* Filter Status */}
          {!showCancelledOnly && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <Filter size={16} style={{ color: 'var(--text-muted)' }} />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                <option value="all">All Active Orders</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {filteredOrders.length === 0 ? (
        <div className="no-data-msg">
          No orders match the selected filter criteria.
        </div>
      ) : viewMode === 'cards' ? (
        /* Rich Card View with Stepper & Address Details */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredOrders.map((order) => (
            <div key={order.id} className="order-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-md)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
              {/* Order Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="order-id" style={{ fontSize: '18px', color: 'var(--accent-primary)' }}>{order.id}</span>
                    <span className={`order-status ${order.status}`}>{order.status}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} />
                      <span>{new Date(order.createdAt).toLocaleString()}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                      <User size={13} />
                      <strong style={{ color: 'var(--text-primary)' }}>{order.userName}</strong> ({order.userEmail})
                    </span>
                  </div>
                </div>

                {/* Status Selector Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Update Status:</span>
                  {order.status !== 'cancelled' ? (
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--accent-primary)',
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        fontWeight: 600,
                        outline: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 0 10px rgba(139, 92, 246, 0.2)'
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--error)', fontWeight: 600 }}>Cancelled</span>
                  )}
                </div>
              </div>

              {/* Status Stepper Timeline */}
              {order.status !== 'cancelled' && (
                <div style={{ marginTop: '16px', marginBottom: '24px', padding: '16px 20px', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '28px', left: '10%', right: '10%', height: '2px', background: 'var(--glass-border)', zIndex: 0 }}></div>
                  {['pending', 'processing', 'shipped', 'delivered'].map((stepStatus) => {
                    const statusHistory = order.statusHistory || [];
                    const historyItem = statusHistory.find(h => h.status === stepStatus);
                    const isCompleted = !!historyItem ||
                      (order.status === 'processing' && stepStatus === 'pending') ||
                      (order.status === 'shipped' && (stepStatus === 'pending' || stepStatus === 'processing')) ||
                      (order.status === 'delivered' && stepStatus !== 'cancelled') ||
                      (order.status === 'completed' && stepStatus !== 'cancelled');
                    const isActive = order.status === stepStatus;

                    return (
                      <div key={stepStatus} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
                        <div style={{
                          width: '26px', height: '26px', borderRadius: '50%',
                          background: isCompleted ? 'var(--accent-primary)' : 'var(--bg-primary)',
                          border: `2px solid ${isCompleted ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginBottom: '8px',
                          color: '#fff',
                          boxShadow: isActive ? '0 0 0 4px rgba(139, 92, 246, 0.3)' : 'none',
                          transition: 'all 0.3s'
                        }}>
                          {isCompleted && <div style={{ width: '8px', height: '8px', background: '#fff', borderRadius: '50%' }}></div>}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: isActive ? 'bold' : 'normal', color: isCompleted ? 'var(--text-primary)' : 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {stepStatus}
                        </span>
                        {historyItem && (
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {new Date(historyItem.timestamp).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Order Details Grid: Items & Delivery Address */}
              <div className="order-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Package size={14} className="text-violet-500" />
                    <span>Items Ordered</span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: '6px', border: '1px solid var(--glass-border)', fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                          {item.name} <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>x{item.quantity}</span>
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} className="text-violet-500" />
                    <span>Delivery Address</span>
                  </h4>
                  <div style={{ color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '14px', borderRadius: '6px', border: '1px solid var(--glass-border)', fontSize: '14px', lineHeight: '1.5' }}>
                    {order.address}
                  </div>
                </div>
              </div>

              {/* Total Price Bar */}
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <DollarSign size={18} className="text-violet-500" />
                  <span>Total Amount Paid</span>
                </span>
                <span style={{ fontSize: '22px', fontWeight: 'bold', fontFamily: 'var(--font-display)', color: 'var(--accent-primary)' }}>
                  ${order.total.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Compact Table View */
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '14px 20px' }}>Order ID</th>
                  <th style={{ padding: '14px 20px' }}>Customer</th>
                  <th style={{ padding: '14px 20px' }}>Items</th>
                  <th style={{ padding: '14px 20px' }}>Total</th>
                  <th style={{ padding: '14px 20px' }}>Status</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Update Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{o.id}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{o.userName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{o.userEmail}</div>
                    </td>
                    <td style={{ padding: '16px 20px', maxWidth: '260px' }}>
                      {o.items.map((item, i) => (
                        <div key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.quantity}x {item.name}
                        </div>
                      ))}
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>${o.total.toFixed(2)}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span className={`order-status ${o.status}`}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      {o.status !== 'cancelled' ? (
                        <select
                          value={o.status}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--glass-border)',
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                            fontSize: '12px',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No actions</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
