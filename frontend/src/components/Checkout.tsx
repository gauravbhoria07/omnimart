import { useState } from 'react';
import { MapPin, Plus, ShoppingBag, ArrowLeft, CreditCard, Lock, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../utils/api';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface UserType {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  addresses: string[];
}

interface CheckoutProps {
  user: UserType;
  cartItems: CartItem[];
  onOrderPlaced: (orderedItemIds: string[]) => void;
  onBackToStore: () => void;
  addToast: (message: string, type: 'success' | 'error') => void;
  updateUserAddresses: (addresses: string[]) => void;
}

export default function Checkout({
  user,
  cartItems,
  onOrderPlaced,
  onBackToStore,
  addToast,
  updateUserAddresses,
}: CheckoutProps) {
  const [selectedAddress, setSelectedAddress] = useState<string>(
    user.addresses && user.addresses.length > 0 ? user.addresses[0] : ''
  );
  const [newAddress, setNewAddress] = useState('');
  const [showNewAddressForm, setShowNewAddressForm] = useState(
    !(user.addresses && user.addresses.length > 0)
  );
  const [loading, setLoading] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(
    cartItems.map((item) => item.id)
  );

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState(user.name || '');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPercentage: number } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);

  const subtotal = cartItems
    .filter((item) => selectedItemIds.includes(item.id))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  const discountAmount = appliedPromo ? subtotal * (appliedPromo.discountPercentage / 100) : 0;
  const total = subtotal - discountAmount;

  // Formatters
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const parts = [];
    for (let i = 0; i < value.length; i += 4) {
      parts.push(value.slice(i, i + 4));
    }
    setCardNumber(parts.join(' '));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length >= 3) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setExpiryDate(value);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    setCvv(value);
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setValidatingPromo(true);
    setPromoError('');
    try {
      const data = await api.get(`/orders/promo/validate/${promoCode.trim()}`);
      setAppliedPromo(data);
      addToast(`Promo code ${data.code} applied!`, 'success');
    } catch (err: any) {
      setPromoError(err.message || 'Invalid or expired promo code');
      setAppliedPromo(null);
    } finally {
      setValidatingPromo(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (selectedItemIds.length === 0) {
      addToast('Please select at least one item to order', 'error');
      return;
    }

    const addressToUse = showNewAddressForm ? newAddress.trim() : selectedAddress;

    if (!addressToUse) {
      addToast('Please select or enter a shipping address', 'error');
      return;
    }

    // Basic Mock Payment Validation
    if (paymentMethod === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 15) {
        addToast('Please enter a valid card number', 'error');
        return;
      }
      if (expiryDate.length < 5 || cvv.length < 3 || !cardholderName) {
        addToast('Please complete all payment details', 'error');
        return;
      }
    }

    setLoading(true);
    setPaymentStatus('processing');
    setCurrentStep(3); // Move to Processing Step

    try {
      // Simulate Payment Delay based on method
      if (paymentMethod === 'card') {
        await new Promise(resolve => setTimeout(resolve, 2500));
      } else {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      setPaymentStatus('success');
      const itemsToOrder = cartItems.filter((item) => selectedItemIds.includes(item.id));
      const items = itemsToOrder.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      }));

      const payload: any = {
        items,
        address: addressToUse,
      };

      if (appliedPromo) {
        payload.promoCode = appliedPromo.code;
      }

      await api.post('/orders', payload);

      // Update saved addresses locally if it was a new address
      if (showNewAddressForm && !user.addresses.includes(newAddress.trim())) {
        const updatedAddresses = [...user.addresses, newAddress.trim()];
        updateUserAddresses(updatedAddresses);
      }

      // Show success animation briefly before resolving
      setTimeout(() => {
        addToast('Order placed successfully!', 'success');
        onOrderPlaced(selectedItemIds);
      }, 2000);

    } catch (err: any) {
      addToast(err.message || 'Failed to place order', 'error');
      setPaymentStatus('idle');
      setCurrentStep(2); // Go back to payment step on failure
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (selectedItemIds.length === 0) {
        addToast('Please select at least one item to order', 'error');
        return;
      }
      const addressToUse = showNewAddressForm ? newAddress.trim() : selectedAddress;
      if (!addressToUse) {
        addToast('Please select or enter a shipping address', 'error');
        return;
      }
      setCurrentStep(2);
    }
  };

  if (currentStep === 3) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '24px' }}>
        {paymentStatus === 'processing' ? (
          <>
            <Loader2 size={64} className="text-violet-500" style={{ animation: 'spin 1s linear infinite' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Processing your order...</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Please do not close or refresh this page.</p>
          </>
        ) : (
          <>
            <CheckCircle size={64} className="text-green-500" style={{ animation: 'bounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Payment Successful!</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Your order has been placed and is being processed.</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <button
        className="btn-secondary"
        onClick={onBackToStore}
        style={{ marginBottom: '24px', padding: '8px 16px', fontSize: '13px' }}
      >
        <ArrowLeft size={16} />
        Back to Store
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <h2 className="page-title" style={{ margin: 0 }}>Secure Checkout</h2>

        {/* Progress Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: currentStep >= 1 ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: currentStep >= 1 ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: currentStep >= 1 ? '#fff' : 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>1</div>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Shipping & Items</span>
          </div>
          <div style={{ width: '40px', height: '2px', background: currentStep >= 2 ? 'var(--accent-primary)' : 'var(--glass-border)' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: currentStep >= 2 ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: currentStep >= 2 ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: currentStep >= 2 ? '#fff' : 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>2</div>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Payment</span>
          </div>
        </div>
      </div>

      <div className="checkout-grid">
        {/* Left Side: Dynamic based on step */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {currentStep === 1 ? (
            <div className="dashboard-content">
              <h3 className="dashboard-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={20} className="text-violet-500" />
                <span>Shipping Address</span>
              </h3>

              {user.addresses && user.addresses.length > 0 && (
                <div className="address-cards-grid">
                  {user.addresses.map((addr, idx) => (
                    <div
                      key={idx}
                      className={`address-card ${!showNewAddressForm && selectedAddress === addr ? 'selected' : ''
                        }`}
                      onClick={() => {
                        setSelectedAddress(addr);
                        setShowNewAddressForm(false);
                      }}
                    >
                      <p style={{ fontSize: '14px', wordBreak: 'break-word' }}>{addr}</p>
                    </div>
                  ))}
                </div>
              )}

              <button
                className="btn-secondary"
                onClick={() => {
                  setShowNewAddressForm(true);
                  setSelectedAddress('');
                }}
                style={{
                  width: '100%',
                  marginBottom: '20px',
                  borderStyle: 'dashed',
                  borderWidth: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Plus size={16} />
                <span>Deliver to a New Address</span>
              </button>

              {showNewAddressForm && (
                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label htmlFor="address-textarea">Enter Address</label>
                  <textarea
                    id="address-textarea"
                    className="form-input"
                    rows={3}
                    style={{ resize: 'vertical', width: '100%', padding: '12px' }}
                    placeholder="Street Address, Apartment, City, State, ZIP Code"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    required
                  />
                </div>
              )}

              <button
                className="btn-primary"
                style={{ width: '100%', marginTop: '24px' }}
                onClick={nextStep}
              >
                Continue to Payment
              </button>
            </div>
          ) : (
            <div className="dashboard-content" style={{ marginTop: '0px' }}>
              {/* Payment Details Section */}
              <button
                className="btn-secondary"
                onClick={() => setCurrentStep(1)}
                style={{ padding: '6px 12px', fontSize: '12px', marginBottom: '20px' }}
              >
                <ArrowLeft size={14} /> Back to Shipping
              </button>
              <h3 className="dashboard-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={20} className="text-violet-500" />
                <span>Payment Method</span>
              </h3>

              <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="payment_method"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
                  />
                  <span style={{ fontWeight: paymentMethod === 'card' ? 600 : 400 }}>Credit Card</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="payment_method"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
                  />
                  <span style={{ fontWeight: paymentMethod === 'cod' ? 600 : 400 }}>Cash on Delivery</span>
                </label>
              </div>

              {paymentMethod === 'card' ? (
                <div style={{ background: 'var(--bg-tertiary)', padding: '20px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--glass-border)' }}>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="card-name">Cardholder Name</label>
                    <input
                      id="card-name"
                      type="text"
                      className="form-input"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="card-number">Card Number</label>
                    <div style={{ position: 'relative' }}>
                      <CreditCard size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                      <input
                        id="card-number"
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '40px', width: '100%' }}
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="0000 0000 0000 0000"
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label htmlFor="card-expiry">Expiry Date</label>
                      <input
                        id="card-expiry"
                        type="text"
                        className="form-input"
                        style={{ width: '100%' }}
                        value={expiryDate}
                        onChange={handleExpiryChange}
                        placeholder="MM/YY"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="card-cvv">CVV</label>
                      <input
                        id="card-cvv"
                        type="text"
                        className="form-input"
                        style={{ width: '100%' }}
                        value={cvv}
                        onChange={handleCvvChange}
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px', fontSize: '13px', color: '#71717a' }}>
                    <Lock size={14} />
                    <span>Payments are secure and encrypted.</span>
                  </div>
                </div>
              ) : (
                <div style={{ background: 'var(--bg-tertiary)', padding: '20px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--glass-border)', color: '#71717a', fontSize: '14px', lineHeight: '1.6' }}>
                  You have selected Cash on Delivery. You will pay for your order in full when it is delivered to your address. Please ensure you have the exact amount ready to avoid delays.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Order Summary */}
        <div className="dashboard-content" style={{ height: 'fit-content' }}>
          <h3 className="dashboard-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={20} className="text-violet-500" />
            <span>Order Summary</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            {cartItems.map((item) => {
              const isSelected = selectedItemIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '14px',
                    opacity: isSelected ? 1 : 0.5,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItemIds([...selectedItemIds, item.id]);
                        } else {
                          setSelectedItemIds(selectedItemIds.filter((id) => id !== item.id));
                        }
                      }}
                      style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <div>
                      <span style={{ fontWeight: 600 }}>{item.name}</span>
                      <span style={{ color: '#71717a', marginLeft: '8px' }}>
                        x{item.quantity}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', marginBottom: '24px' }}>
            {currentStep === 2 && (
              <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Promo Code"
                  style={{ flex: 1, textTransform: 'uppercase' }}
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  disabled={validatingPromo || !!appliedPromo}
                />
                <button
                  className="btn-secondary"
                  onClick={handleApplyPromo}
                  disabled={validatingPromo || !promoCode.trim() || !!appliedPromo}
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  {validatingPromo ? '...' : appliedPromo ? 'Applied' : 'Apply'}
                </button>
              </div>
            )}

            {promoError && (
              <p style={{ color: 'var(--error)', fontSize: '13px', marginBottom: '16px' }}>{promoError}</p>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
              <span style={{ fontWeight: 600 }}>${subtotal.toFixed(2)}</span>
            </div>

            {appliedPromo && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px', color: 'var(--success)' }}>
                <span>Discount ({appliedPromo.code})</span>
                <span style={{ fontWeight: 600 }}>-${discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid var(--glass-border)',
              fontSize: '18px',
              fontWeight: 700
            }}>
              <span>Total</span>
              <span style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-primary)', fontSize: '24px' }}>
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          {currentStep === 2 && (
            <button
              className="btn-primary"
              style={{ width: '100%', padding: '14px', position: 'relative', overflow: 'hidden', marginTop: '24px' }}
              onClick={handlePlaceOrder}
              disabled={loading}
            >
              {paymentStatus === 'processing' ? 'Processing Payment...' : paymentStatus === 'success' ? 'Success!' : 'Pay & Place Order'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
