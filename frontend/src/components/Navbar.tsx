import { ShoppingBag, ShoppingCart, User, LogOut, LogIn, LayoutDashboard, History, Heart } from 'lucide-react';

interface UserType {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  addresses: string[];
  phone?: string;
}

interface NavbarProps {
  user: UserType | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAuthClick: () => void;
  onLogout: () => void;
  cartCount: number;
  onCartClick: () => void;
}

export default function Navbar({
  user,
  activeTab,
  setActiveTab,
  onAuthClick,
  onLogout,
  cartCount,
  onCartClick,
}: NavbarProps) {
  return (
    <nav className="navbar" id="app-navigation">
      <div className="nav-brand" onClick={() => setActiveTab('home')}>
        <ShoppingBag size={28} className="text-violet-500" />
        <span>OmniMart</span>
      </div>

      <div className="nav-actions">
        <button
          className={`nav-link ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          Store
        </button>

        {user && user.role === 'admin' && (
          <button
            className={`nav-link ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LayoutDashboard size={16} />
            <span>Admin</span>
          </button>
        )}

        {user && (
          <button
            className={`nav-link ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <History size={16} />
            <span>Orders</span>
          </button>
        )}

        {user && (
          <button
            className={`nav-link ${activeTab === 'wishlist' ? 'active' : ''}`}
            onClick={() => setActiveTab('wishlist')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Heart size={16} />
            <span>Wishlist</span>
          </button>
        )}

        <button
          className="btn-icon-badge"
          onClick={onCartClick}
          aria-label="Open Cart"
        >
          <ShoppingCart size={20} />
          {cartCount > 0 && <span className="badge">{cartCount}</span>}
        </button>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="user-chip"
              onClick={() => setActiveTab('profile')}
              style={{ cursor: 'pointer', border: 'none', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', gap: '8px' }}
              title="View Profile"
            >
              <User size={14} />
              <span>{user.name}</span>
              <span className={`role-tag ${user.role}`}>
                {user.role}
              </span>
            </button>
            <button
              className="btn-icon-badge"
              onClick={onLogout}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <button
            className="btn-primary"
            onClick={onAuthClick}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            <LogIn size={16} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </nav>
  );
}
