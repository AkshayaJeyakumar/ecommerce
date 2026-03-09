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

const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`

// ─── Cart Sidebar ───────────────────────────────────
function CartSidebar({ cart, open, onClose, onUpdate, onRemove, onCheckout }) {
  const [address, setAddress] = useState({ street: '', city: '', state: '', pincode: '' })
  const [step, setStep] = useState('cart') // 'cart' | 'address'
  const [placing, setPlacing] = useState(false)
  const [toast, setToast] = useState('')
  const { user } = useContext(AuthContext)

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)

  async function placeOrder() {
    if (!user) { setToast('Please login to place an order'); return }
    setPlacing(true)
    try {
      await axios.post('/api/orders', {
        items: cart.map(i => ({ product: i._id, name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
        totalAmount: total,
        address,
      })
      setToast('✅ Order placed successfully!')
      onCheckout()
      setStep('cart')
      setTimeout(() => { setToast(''); onClose() }, 2000)
    } catch (e) {
      setToast('❌ ' + (e.response?.data?.message || 'Order failed'))
    }
    setPlacing(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={onClose} />

          {/* Drawer */}
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col"
            style={{ background: '#080b1a', borderLeft: '1px solid #1e2240', boxShadow: '-20px 0 60px rgba(0,0,0,0.6)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1e2240' }}>
              <div>
                <div className="font-grotesk font-bold text-lg text-white">
                  {step === 'cart' ? '🛒 My Cart' : '📍 Delivery Address'}
                </div>
                {step === 'cart' && <div className="text-xs mt-0.5" style={{ color: '#4a5580' }}>{cart.length} item{cart.length !== 1 ? 's' : ''}</div>}
              </div>
              <button onClick={() => { step === 'address' ? setStep('cart') : onClose() }}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-lg"
                style={{ background: '#1e2240' }}>
                {step === 'address' ? '←' : '✕'}
              </button>
            </div>

            {/* Toast */}
            {toast && (
              <div className="mx-4 mt-3 px-4 py-3 rounded-xl text-sm font-semibold"
                style={{ background: toast.startsWith('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)', color: toast.startsWith('✅') ? '#10b981' : '#f43f5e', border: `1px solid ${toast.startsWith('✅') ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}` }}>
                {toast}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {step === 'cart' ? (
                cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                    <div className="text-5xl">🛍️</div>
                    <div className="text-slate-400">Your cart is empty</div>
                    <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52e0)' }}>
                      Browse Products
                    </button>
                  </div>
                ) : cart.map(item => (
                  <div key={item._id} className="flex items-center gap-3 p-3 rounded-2xl"
                    style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                    <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                      onError={e => { e.target.src = `https://picsum.photos/seed/${item._id}/60/60` }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{item.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: '#6c63ff' }}>{fmt(item.price)}</div>
                      {/* Qty controls */}
                      <div className="flex items-center gap-2 mt-2">
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
                ))
              ) : (
                /* Address form */
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
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="px-4 py-4" style={{ borderTop: '1px solid #1e2240' }}>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm" style={{ color: '#4a5580' }}>Total ({cart.length} items)</span>
                  <span className="font-grotesk font-bold text-xl text-white">{fmt(total)}</span>
                </div>
                {step === 'cart' ? (
                  <motion.button onClick={() => setStep('address')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="w-full py-3 rounded-xl font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52e0)', boxShadow: '0 8px 24px rgba(108,99,255,0.4)' }}>
                    Proceed to Checkout →
                  </motion.button>
                ) : (
                  <motion.button onClick={placeOrder} disabled={placing} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="w-full py-3 rounded-xl font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 8px 24px rgba(16,185,129,0.4)' }}>
                    {placing ? '⏳ Placing Order...' : '✅ Place Order'}
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
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="products" element={<Products />} />
                <Route path="pricing" element={<PricingEngine />} />
                <Route path="simulator" element={<PriceSimulator />} />
                <Route path="sentiment" element={<Sentiment />} />
                <Route path="competitor" element={<Competitor />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="admin" element={<AdminPanel />} />
                <Route path="workflow" element={<Workflow />} />
                <Route path="settings" element={<Settings />} />
                <Route path="my-dashboard" element={<UserDashboard />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </CartContext.Provider>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  )
}
