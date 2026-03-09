import { createContext, useContext, useState, useCallback } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { BrowserRouter } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import PricingEngine from './pages/PricingEngine'
import PriceSimulator from './pages/PriceSimulator'
import Sentiment from './pages/Sentiment'
import Competitor from './pages/Competitor'
import Analytics from './pages/Analytics'
import AdminPanel from './pages/AdminPanel'
import Workflow from './pages/Workflow'
import Settings from './pages/Settings'
import UserDashboard from './pages/UserDashboard'
import PriceAlerts from './pages/PriceAlerts'
import UserProfile from './pages/UserProfile'
import UserManagement from './pages/UserManagement'
import CartPage from './pages/CartPage'
import Recommendations from './pages/Recommendations'
import MyReviews from './pages/MyReviews'
import axios from 'axios'

export const AuthContext = createContext(null)
export const ThemeContext = createContext('dark')
export const CartContext = createContext(null)

export function useAuth() { return useContext(AuthContext) }
export function useCart() { return useContext(CartContext) }

// ─── Axios global token injector ───────────────────
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('ai_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

function ProtectedRoute({ children }) {
  const { user } = useContext(AuthContext)
  return user ? children : <Navigate to="/login" replace />
}

// Admin-only: redirect regular users to dashboard
function AdminRoute({ children }) {
  const { user } = useContext(AuthContext)
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

// User-only: redirect admins to their panel
function UserRoute({ children }) {
  const { user } = useContext(AuthContext)
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  return children
}

const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`

// ─── Cart Sidebar ─────────────────────────────────────────────────────────────
function CartSidebar({ cart, open, onClose, onUpdate, onRemove, onCheckout }) {
  const [address, setAddress] = useState({ street: '', city: '', state: '', pincode: '' })
  const [step, setStep] = useState('cart') // 'cart' | 'address' | 'payment'
  const [payMethod, setPayMethod] = useState(null)
  const [placing, setPlacing] = useState(false)
  const [toast, setToast] = useState('')
  const { user } = useContext(AuthContext)

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const discount = Math.round(subtotal * 0.02)
  const total = subtotal - discount

  const STEP_LABELS = { cart: '🛒 My Cart', address: '📍 Delivery Address', payment: '💳 Payment' }
  const PREV = { address: 'cart', payment: 'address' }

  const UPI_APPS = [
    { id: 'gpay', label: 'Google Pay', icon: '🟢', color: '#4285F4' },
    { id: 'phonepe', label: 'PhonePe', icon: '🟣', color: '#5f259f' },
    { id: 'paytm', label: 'Paytm', icon: '🔵', color: '#00baf2' },
    { id: 'bhim', label: 'BHIM UPI', icon: '🇮🇳', color: '#ff6600' },
  ]

  async function createRazorpayOrder() {
    const { data } = await axios.post('/api/payment/create-order', {
      amount: total,
      receipt: `rcpt_${Date.now()}`,
    })
    return data
  }

  async function placeOrderInDB(paymentId = null, method = 'COD') {
    await axios.post('/api/orders', {
      items: cart.map(i => ({ product: i._id, name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
      totalAmount: total,
      address,
      paymentMethod: method,
      paymentId,
    })
  }

  async function handlePayNow() {
    if (!user) { setToast('Please login first'); return }
    if (!address.street || !address.city || !address.pincode) {
      setToast('Please fill in your address first'); return
    }
    setPlacing(true)
    try {
      if (payMethod === 'cod') {
        await placeOrderInDB(null, 'COD')
        setToast('✅ Order placed! Pay on delivery.')
        onCheckout(); setStep('cart'); setPayMethod(null)
        setTimeout(() => { setToast(''); onClose() }, 2500)
        setPlacing(false); return
      }

      // Razorpay for UPI, card, netbanking
      const order = await createRazorpayOrder()

      if (order.mock) {
        // Demo mode — no Razorpay keys configured
        await placeOrderInDB(`demo_${Date.now()}`, payMethod)
        setToast('✅ Order placed! (Payment simulated in demo mode)')
        onCheckout(); setStep('cart'); setPayMethod(null)
        setTimeout(() => { setToast(''); onClose() }, 2500)
        setPlacing(false); return
      }

      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'AI Price Store',
        description: `Order for ${cart.length} item${cart.length !== 1 ? 's' : ''}`,
        order_id: order.id,
        prefill: { name: user.name, email: user.email },
        theme: { color: '#6c63ff' },
        method: payMethod === 'card' ? { card: true, upi: false, netbanking: false }
          : payMethod === 'netbanking' ? { netbanking: true, card: false, upi: false }
            : { upi: true },
        handler: async (response) => {
          try {
            await placeOrderInDB(response.razorpay_payment_id, payMethod)
            await axios.post('/api/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }).catch(() => { })
            setToast('✅ Payment successful! Order placed.')
            onCheckout(); setStep('cart'); setPayMethod(null)
            setTimeout(() => { setToast(''); onClose() }, 2500)
          } catch { setToast('❌ Order failed after payment. Contact support.') }
        },
        modal: { ondismiss: () => { setPlacing(false) } }
      }

      if (!window.Razorpay) {
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.onload = () => { const rzp = new window.Razorpay(options); rzp.open() }
        document.body.appendChild(script)
      } else {
        const rzp = new window.Razorpay(options)
        rzp.open()
      }
    } catch (e) {
      setToast('❌ ' + (e.response?.data?.message || 'Payment failed. Please retry.'))
      setPlacing(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
            onClick={onClose} />

          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col"
            style={{ background: '#080b1a', borderLeft: '1px solid #1e2240', boxShadow: '-20px 0 60px rgba(0,0,0,0.6)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1e2240' }}>
              <div>
                <div className="font-grotesk font-bold text-lg text-white">{STEP_LABELS[step]}</div>
                {step === 'cart' && <div className="text-xs mt-0.5" style={{ color: '#4a5580' }}>{cart.length} item{cart.length !== 1 ? 's' : ''}</div>}
              </div>
              <button onClick={() => PREV[step] ? setStep(PREV[step]) : onClose()}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-lg"
                style={{ background: '#1e2240' }}>
                {PREV[step] ? '←' : '✕'}
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 px-5 py-2" style={{ borderBottom: '1px solid rgba(30,34,64,0.5)' }}>
              {['cart', 'address', 'payment'].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
                    style={{ background: step === s ? '#6c63ff' : ['cart', 'address', 'payment'].indexOf(step) > i ? '#10b981' : '#1e2240', color: 'white' }}>
                    {['cart', 'address', 'payment'].indexOf(step) > i ? '✓' : i + 1}
                  </div>
                  <span className="text-xs capitalize" style={{ color: step === s ? '#a5b4fc' : '#4a5580' }}>{s}</span>
                  {i < 2 && <div className="w-6 h-px" style={{ background: ['cart', 'address', 'payment'].indexOf(step) > i ? '#10b981' : '#1e2240' }} />}
                </div>
              ))}
            </div>

            {/* Toast */}
            {toast && (
              <div className="mx-4 mt-3 px-4 py-3 rounded-xl text-sm font-semibold"
                style={{ background: toast.startsWith('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)', color: toast.startsWith('✅') ? '#10b981' : '#f43f5e', border: `1px solid ${toast.startsWith('✅') ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}` }}>
                {toast}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {step === 'cart' && (
                cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                    <div className="text-5xl">🛍️</div>
                    <div className="text-slate-400">Your cart is empty</div>
                    <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52e0)' }}>
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item._id} className="flex items-center gap-3 p-3 rounded-2xl"
                        style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                        <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                          onError={e => { e.target.src = `https://picsum.photos/seed/${item._id}/60/60` }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white truncate">{item.name}</div>
                          <div className="text-xs mt-0.5" style={{ color: '#6c63ff' }}>{fmt(item.price)}</div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <button onClick={() => onUpdate(item._id, item.quantity - 1)}
                              className="w-6 h-6 rounded-lg text-white text-sm font-bold flex items-center justify-center"
                              style={{ background: '#1e2240' }}>−</button>
                            <span className="text-sm text-white font-semibold">{item.quantity}</span>
                            <button onClick={() => onUpdate(item._id, item.quantity + 1)}
                              className="w-6 h-6 rounded-lg text-white text-sm font-bold flex items-center justify-center"
                              style={{ background: '#1e2240' }}>+</button>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold text-white">{fmt(item.price * item.quantity)}</div>
                          <button onClick={() => onRemove(item._id)} className="text-xs mt-1" style={{ color: '#ef4444' }}>Remove</button>
                        </div>
                      </div>
                    ))}
                    {/* Order summary */}
                    <div className="p-3 rounded-xl space-y-1" style={{ background: 'rgba(30,34,64,0.3)' }}>
                      <div className="flex justify-between text-xs"><span style={{ color: '#4a5580' }}>Subtotal</span><span className="text-slate-300">{fmt(subtotal)}</span></div>
                      <div className="flex justify-between text-xs"><span style={{ color: '#4a5580' }}>2% Member Discount</span><span style={{ color: '#10b981' }}>−{fmt(discount)}</span></div>
                      <div className="flex justify-between text-xs"><span style={{ color: '#4a5580' }}>Delivery</span><span style={{ color: '#10b981' }}>FREE</span></div>
                      <div className="flex justify-between text-sm font-bold pt-1" style={{ borderTop: '1px solid #1e2240' }}>
                        <span className="text-white">Total</span><span style={{ color: '#6c63ff' }}>{fmt(total)}</span>
                      </div>
                    </div>
                  </div>
                )
              )}

              {step === 'address' && (
                <div className="space-y-3">
                  {[
                    { key: 'street', label: 'Street / Flat / Area', placeholder: '12 MG Road, Apt 4B' },
                    { key: 'city', label: 'City', placeholder: 'Bengaluru' },
                    { key: 'state', label: 'State', placeholder: 'Karnataka' },
                    { key: 'pincode', label: 'Pincode', placeholder: '560001' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#4a5580' }}>{f.label}</label>
                      <input value={address[f.key]} onChange={e => setAddress(a => ({ ...a, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                        style={{ background: '#1a1e38', border: '1px solid #1e2240' }}
                        onFocus={e => e.target.style.borderColor = '#6c63ff'}
                        onBlur={e => e.target.style.borderColor = '#1e2240'} />
                    </div>
                  ))}
                </div>
              )}

              {step === 'payment' && (
                <div className="space-y-4">
                  <p className="text-xs" style={{ color: '#4a5580' }}>Choose your preferred payment method</p>

                  {/* UPI section */}
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#4a5580' }}>📱 UPI Apps</div>
                    <div className="grid grid-cols-2 gap-2">
                      {UPI_APPS.map(app => (
                        <button key={app.id} onClick={() => setPayMethod(app.id)}
                          className="flex items-center gap-2 p-3 rounded-xl text-sm font-semibold transition-all"
                          style={{
                            background: payMethod === app.id ? `${app.color}20` : '#0f1224',
                            border: `1px solid ${payMethod === app.id ? app.color : '#1e2240'}`,
                            color: payMethod === app.id ? 'white' : '#94a3b8'
                          }}>
                          <span className="text-xl">{app.icon}</span>
                          <span className="text-xs">{app.label}</span>
                          {payMethod === app.id && <span className="ml-auto">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Other methods */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#4a5580' }}>💳 Other Methods</div>
                    {[
                      { id: 'card', label: 'Credit / Debit Card', icon: '💳', sub: 'Visa, Mastercard, RuPay' },
                      { id: 'netbanking', label: 'Net Banking', icon: '🏦', sub: 'All major Indian banks' },
                      { id: 'cod', label: 'Cash on Delivery', icon: '💵', sub: 'Pay when you receive' },
                    ].map(m => (
                      <button key={m.id} onClick={() => setPayMethod(m.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-sm transition-all"
                        style={{
                          background: payMethod === m.id ? 'rgba(108,99,255,0.1)' : '#0f1224',
                          border: `1px solid ${payMethod === m.id ? '#6c63ff' : '#1e2240'}`
                        }}>
                        <span className="text-xl">{m.icon}</span>
                        <div className="flex-1 text-left">
                          <div className="text-sm font-semibold" style={{ color: payMethod === m.id ? 'white' : '#94a3b8' }}>{m.label}</div>
                          <div className="text-xs" style={{ color: '#4a5580' }}>{m.sub}</div>
                        </div>
                        {payMethod === m.id && <span style={{ color: '#6c63ff' }}>✓</span>}
                      </button>
                    ))}
                  </div>

                  {/* Order summary recap */}
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(108,99,255,0.05)', border: '1px solid rgba(108,99,255,0.15)' }}>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#4a5580' }}>Order Total</span>
                      <span className="font-grotesk font-bold" style={{ color: '#6c63ff' }}>{fmt(total)}</span>
                    </div>
                    <div className="text-xs mt-1" style={{ color: '#4a5580' }}>
                      📍 {address.street ? `${address.city}, ${address.pincode}` : 'Address set'}
                    </div>
                  </div>
                  <div className="text-xs text-center" style={{ color: '#4a5580' }}>🔒 Secured by Razorpay · 256-bit SSL encryption</div>
                </div>
              )}
            </div>

            {/* Footer CTA */}
            {cart.length > 0 && (
              <div className="px-4 py-4" style={{ borderTop: '1px solid #1e2240' }}>
                {step === 'cart' && (
                  <motion.button onClick={() => setStep('address')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="w-full py-3 rounded-xl font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52e0)', boxShadow: '0 8px 24px rgba(108,99,255,0.4)' }}>
                    Proceed to Checkout →
                  </motion.button>
                )}
                {step === 'address' && (
                  <motion.button
                    onClick={() => {
                      if (!address.street || !address.city || !address.pincode) { setToast('Please fill all address fields'); return }
                      setToast(''); setStep('payment')
                    }}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="w-full py-3 rounded-xl font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52e0)', boxShadow: '0 8px 24px rgba(108,99,255,0.4)' }}>
                    Continue to Payment →
                  </motion.button>
                )}
                {step === 'payment' && (
                  <motion.button onClick={handlePayNow} disabled={placing || !payMethod}
                    whileHover={{ scale: payMethod ? 1.02 : 1 }} whileTap={{ scale: payMethod ? 0.97 : 1 }}
                    className="w-full py-3 rounded-xl font-semibold text-white"
                    style={{
                      background: placing ? '#1e2240' : payMethod ? 'linear-gradient(135deg,#10b981,#059669)' : '#1e2240',
                      boxShadow: payMethod && !placing ? '0 8px 24px rgba(16,185,129,0.4)' : 'none',
                      cursor: payMethod && !placing ? 'pointer' : 'not-allowed'
                    }}>
                    {placing ? '⏳ Processing...' : payMethod ? `Pay ${fmt(total)} →` : 'Select a Payment Method'}
                  </motion.button>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}


export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ai_user')) } catch { return null }
  })
  const [theme] = useState('dark')
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)

  const login = useCallback((userData, token) => {
    localStorage.setItem('ai_user', JSON.stringify(userData))
    localStorage.setItem('ai_token', token)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('ai_user')
    localStorage.removeItem('ai_token')
    setUser(null)
    setCart([])
  }, [])

  function addToCart(product) {
    setCart(prev => {
      const existing = prev.find(i => i._id === product._id)
      if (existing) return prev.map(i => i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { ...product, quantity: 1 }]
    })
    setCartOpen(true)
  }

  function updateQty(id, qty) {
    if (qty < 1) return removeFromCart(id)
    setCart(prev => prev.map(i => i._id === id ? { ...i, quantity: qty } : i))
  }

  function removeFromCart(id) {
    setCart(prev => prev.filter(i => i._id !== id))
  }

  function clearCart() { setCart([]) }

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <ThemeContext.Provider value={theme}>
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, cartCount, cartOpen, setCartOpen }}>
          <BrowserRouter>
            <CartSidebar
              cart={cart}
              open={cartOpen}
              onClose={() => setCartOpen(false)}
              onUpdate={updateQty}
              onRemove={removeFromCart}
              onCheckout={clearCart}
            />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />

                {/* ── COMMON ── */}
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="products" element={<Products />} />

                {/* ── ADMIN-ONLY ── */}
                <Route path="pricing" element={<AdminRoute><PricingEngine /></AdminRoute>} />
                <Route path="simulator" element={<AdminRoute><PriceSimulator /></AdminRoute>} />
                <Route path="sentiment" element={<AdminRoute><Sentiment /></AdminRoute>} />
                <Route path="competitor" element={<AdminRoute><Competitor /></AdminRoute>} />
                <Route path="analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
                <Route path="admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
                <Route path="admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
                <Route path="workflow" element={<AdminRoute><Workflow /></AdminRoute>} />
                <Route path="settings" element={<AdminRoute><Settings /></AdminRoute>} />

                {/* ── USER-ONLY ── */}
                <Route path="my-dashboard" element={<UserRoute><UserDashboard defaultTab="orders" /></UserRoute>} />
                <Route path="my-orders" element={<UserRoute><UserDashboard defaultTab="orders" /></UserRoute>} />
                <Route path="my-reviews" element={<UserRoute><MyReviews /></UserRoute>} />
                <Route path="my-cart" element={<UserRoute><CartPage /></UserRoute>} />
                <Route path="alerts" element={<UserRoute><PriceAlerts /></UserRoute>} />
                <Route path="recommendations" element={<UserRoute><Recommendations /></UserRoute>} />
                <Route path="profile" element={<UserRoute><UserProfile /></UserRoute>} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </CartContext.Provider>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  )
}
