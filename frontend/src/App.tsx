import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ShoppingCart, Info, UserCheck, ShieldAlert, Star, Heart } from 'lucide-react';
import Navbar from './components/Navbar';
import Slider from './components/Slider';
import CartDrawer from './components/CartDrawer';
import AuthModal from './components/AuthModal';
import Checkout from './components/Checkout';
import UserOrders from './components/UserOrders';
import AdminPanel from './components/AdminPanel';
import ProductModal from './components/ProductModal';
import UserProfile from './components/UserProfile';
import WishlistView from './components/WishlistView';
import { api } from './utils/api';

interface UserType {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  addresses: string[];
  phone?: string;
  wishlist?: string[];
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export default function App() {
  // Authentication & session state
  const [user, setUser] = useState<UserType | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCartDrawer, setShowCartDrawer] = useState(false);

  // General App navigation state
  const [activeTab, setActiveTab] = useState('home');

  // Product browse state
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Filter & Sort state
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Toast notifications state
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Add toast notification
  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Initialize and verify user session + load cart from localStorage
  useEffect(() => {
    // 1. Load Cart
    const storedCart = localStorage.getItem('omnimart_cart');
    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart));
      } catch (e) {
        localStorage.removeItem('omnimart_cart');
      }
    }

    // 2. Verify Session
    const token = localStorage.getItem('omnimart_token');
    const storedUser = localStorage.getItem('omnimart_user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        // Verify token with backend
        api
          .get('/auth/profile')
          .then((profile) => {
            // Merge updated data (like addresses)
            setUser((prevUser) => {
              const merged = prevUser
                ? { ...prevUser, name: profile.name, email: profile.email, role: profile.role, addresses: profile.addresses, phone: profile.phone, wishlist: profile.wishlist }
                : null;
              if (merged) {
                // Fetch full info if needed or just sync
                localStorage.setItem('omnimart_user', JSON.stringify(merged));
              }
              return merged;
            });
          })
          .catch(() => {
            // If token expired, clear session
            localStorage.removeItem('omnimart_token');
            localStorage.removeItem('omnimart_user');
            setUser(null);
            addToast('Your session has expired. Please sign in again.', 'error');
          });
      } catch (e) {
        localStorage.removeItem('omnimart_token');
        localStorage.removeItem('omnimart_user');
      }
    }
  }, []);

  // Fetch products when Store view is loaded
  const fetchProducts = async (pageNum = 1) => {
    if (pageNum === 1) setLoadingProducts(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '6',
        category: selectedCategory,
        search: searchQuery,
        sort: sortOrder
      });
      const data = await api.get(`/products?${params.toString()}`);

      if (pageNum === 1) {
        setProducts(data.data);
      } else {
        setProducts(prev => [...prev, ...data.data]);
      }
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      addToast(err.message || 'Failed to fetch products', 'error');
    } finally {
      setLoadingProducts(false);
    }
  };

  // Re-fetch when filters or active tab changes
  useEffect(() => {
    if (activeTab === 'home') {
      setPage(1);
      fetchProducts(1);
    }
  }, [activeTab, selectedCategory, sortOrder, searchQuery]);

  // Load more handler
  const handleLoadMore = useCallback(() => {
    if (page < totalPages && !loadingProducts) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage);
    }
  }, [page, totalPages, loadingProducts]);

  // Infinite Scroll Observer
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [handleLoadMore]);

  // Synchronize Cart to LocalStorage
  const syncCart = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem('omnimart_cart', JSON.stringify(items));
  };

  // Cart operations
  const handleAddToCart = (product: any) => {
    const existing = cartItems.find((item) => item.id === product.id);
    if (existing) {
      const updated = cartItems.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
      syncCart(updated);
    } else {
      const updated = [
        ...cartItems,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1,
        },
      ];
      syncCart(updated);
    }
    addToast(`"${product.name}" added to cart!`, 'success');
  };

  const handleUpdateCartQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveFromCart(id);
      return;
    }
    const updated = cartItems.map((item) =>
      item.id === id ? { ...item, quantity: qty } : item
    );
    syncCart(updated);
  };

  const handleRemoveFromCart = (id: string) => {
    const item = cartItems.find((i) => i.id === id);
    const updated = cartItems.filter((i) => i.id !== id);
    syncCart(updated);
    if (item) {
      addToast(`"${item.name}" removed from cart`, 'error');
    }
  };

  const handleClearCart = () => {
    syncCart([]);
  };

  // Session operations
  const handleAuthSuccess = (userData: any, token: string) => {
    setUser(userData);
    localStorage.setItem('omnimart_token', token);
    localStorage.setItem('omnimart_user', JSON.stringify(userData));

    // Redirect admin to dashboard, customer to home
    if (userData.role === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('home');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('omnimart_token');
    localStorage.removeItem('omnimart_user');
    handleClearCart();
    setActiveTab('home');
    addToast('You have been signed out.', 'success');
  };

  const updateUserSession = (updatedUser: UserType) => {
    setUser(updatedUser);
    localStorage.setItem('omnimart_user', JSON.stringify(updatedUser));
  };

  // Wishlist toggle
  const handleToggleWishlist = async (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      addToast('Please login to use wishlist', 'error');
      setShowAuthModal(true);
      return;
    }
    const currentWishlist = user.wishlist || [];
    const inWishlist = currentWishlist.includes(product.id);
    const newWishlist = inWishlist
      ? currentWishlist.filter(id => id !== product.id)
      : [...currentWishlist, product.id];

    try {
      const updatedUser = await api.patch('/auth/profile', { wishlist: newWishlist });
      updateUserSession(updatedUser);
      addToast(inWishlist ? `Removed from wishlist` : `Added to wishlist`, 'success');
    } catch (err: any) {
      addToast('Failed to update wishlist', 'error');
    }
  };

  // Search, filter and sort
  const categories = ['All', 'Fashion', 'Electronics', 'Accessories', 'Home', 'Other'];

  // Note: Filtering and Sorting is now done on the backend.
  // We just render `products` directly.
  let filteredProducts = products;

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="app-container">
      {/* Toast Notifications Panel */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Top Floating Glassmorphism Nav Bar */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          // Auto close cart drawer if switching pages
          setShowCartDrawer(false);
        }}
        onAuthClick={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        cartCount={cartCount}
        onCartClick={() => setShowCartDrawer(true)}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={showCartDrawer}
        onClose={() => setShowCartDrawer(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onCheckoutClick={() => {
          setShowCartDrawer(false);
          if (!user) {
            setShowAuthModal(true);
            addToast('Please login or register to checkout', 'error');
          } else {
            setActiveTab('checkout');
          }
        }}
      />

      {/* Main View Area */}
      <main className="content-wrapper">
        {activeTab === 'home' && (
          <div>
            {/* Banner Slider */}
            <Slider />

            {/* Products catalog list */}
            <div className="products-section-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="products-title" style={{ margin: 0 }}>Featured Products</h2>
                <div className="products-search-bar" style={{ margin: 0 }}>
                  <Search size={16} className="text-muted" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: '1px solid var(--glass-border)',
                        background: selectedCategory === cat ? 'var(--primary)' : 'var(--bg-secondary)',
                        color: selectedCategory === cat ? '#fff' : 'var(--text-primary)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        fontSize: '14px',
                        transition: 'all 0.2s'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>

            {loadingProducts ? (
              <div className="text-center" style={{ padding: '40px' }}>Loading catalog...</div>
            ) : products.length === 0 ? (
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  padding: '48px',
                  borderRadius: 'var(--border-radius-lg)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div
                  style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                  }}
                >
                  <Info size={32} className="text-violet-500" />
                </div>
                <h3 style={{ fontSize: '22px' }}>Inventory is Empty</h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', fontSize: '14px', lineHeight: '1.6' }}>
                  There are no products in the catalog yet. To add products, sign in with an{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>Admin role</strong>, click on the{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>Admin Dashboard</strong> tab, and submit your first product list items.
                </p>
                <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                  <button
                    className="btn-primary"
                    onClick={() => setShowAuthModal(true)}
                  >
                    <UserCheck size={16} />
                    <span>Sign In / Register</span>
                  </button>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="no-data-msg">No products found matching "{searchQuery}"</div>
            ) : (
              <div className="products-grid">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="product-card"
                    onClick={() => setSelectedProduct(product)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="product-image-container" style={{ position: 'relative' }}>
                      <img
                        src={product.image}
                        alt={product.name}
                        className="product-image"
                        style={{ opacity: product.stockQuantity !== undefined && product.stockQuantity <= 0 ? 0.5 : 1 }}
                      />
                      {product.stockQuantity !== undefined && product.stockQuantity <= 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          background: 'rgba(239, 68, 68, 0.9)',
                          color: 'white',
                          padding: '6px 16px',
                          borderRadius: '20px',
                          fontWeight: 'bold',
                          fontSize: '14px',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}>
                          Out of Stock
                        </div>
                      )}
                      <span className="product-price-tag">
                        ${Number(product.price).toFixed(2)}
                      </span>
                      <button
                        onClick={(e) => handleToggleWishlist(product, e)}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: 'rgba(255, 255, 255, 0.8)',
                          backdropFilter: 'blur(4px)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: user?.wishlist?.includes(product.id) ? '#ef4444' : '#6b7280',
                          transition: 'all 0.2s',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                      >
                        <Heart size={18} fill={user?.wishlist?.includes(product.id) ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    <div className="product-details">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h3 className="product-title" style={{ margin: 0 }}>{product.name}</h3>
                        {product.reviews && product.reviews.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#FFD700', fontSize: '13px', flexShrink: 0 }}>
                            <Star size={12} fill="currentColor" />
                            <span style={{ fontWeight: 'bold' }}>
                              {(product.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / product.reviews.length).toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="product-desc">{product.description}</p>

                      {user && user.role === 'admin' ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(239, 68, 68, 0.05)',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1px solid rgba(239, 68, 68, 0.1)',
                            fontSize: '12px',
                            color: 'var(--error)',
                          }}
                        >
                          <ShieldAlert size={16} />
                          <span>Admin browsing mode (buying disabled)</span>
                        </div>
                      ) : (
                        <button
                          className="btn-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                        >
                          <ShoppingCart size={16} />
                          <span>Add to Cart</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {page < totalPages && (
              <div ref={observerTarget} style={{ textAlign: 'center', marginTop: '32px', marginBottom: '32px' }}>
                {loadingProducts ? (
                  <div style={{ color: 'var(--text-muted)' }}>Loading more products...</div>
                ) : (
                  <button
                    className="btn-secondary"
                    onClick={handleLoadMore}
                    style={{ padding: '12px 24px', borderRadius: '24px' }}
                  >
                    Load More Products
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'checkout' && user && (
          <Checkout
            user={user}
            cartItems={cartItems}
            onOrderPlaced={(orderedItemIds) => {
              const updatedCart = cartItems.filter(item => !orderedItemIds.includes(item.id));
              syncCart(updatedCart);
              setActiveTab('orders');
            }}
            onBackToStore={() => setActiveTab('home')}
            addToast={addToast}
            updateUserAddresses={(addrs) => updateUserSession({ ...user, addresses: addrs })}
          />
        )}

        {activeTab === 'profile' && user && (
          <UserProfile user={user} onUpdateUser={updateUserSession} addToast={addToast} />
        )}

        {activeTab === 'wishlist' && user && (
          <WishlistView
            user={user}
            onAddToCart={handleAddToCart}
            onRemoveWishlist={handleToggleWishlist}
            onProductClick={setSelectedProduct}
          />
        )}

        {activeTab === 'orders' && user && <UserOrders />}

        {activeTab === 'admin' && user && user.role === 'admin' && (
          <AdminPanel addToast={addToast} />
        )}
      </main>

      {/* Sign In / Sign Up Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          addToast={addToast}
        />
      )}

      {/* Product Details Modal */}
      <ProductModal
        product={selectedProduct}
        user={user}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
      />
    </div>
  );
}
