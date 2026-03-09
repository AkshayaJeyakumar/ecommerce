import { useEffect, useState, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { AuthContext } from '../App'

const CATEGORIES = ['Dresses', 'Bags', 'Skincare', 'Makeup', 'Electronic Gadgets', 'Pet Store', 'Kitchen Utensils', 'Hair Care']
const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`
const emptyProduct = { name: '', category: 'Dresses', basePrice: '', competitorPrice: '', stock: 100, inventory: 100, demand: 50, sentimentScore: 65, description: '' }

const ORDER_STATUS_META = {
    pending: { label: 'Pending', color: '#f59e0b', icon: '⏳' },
    accepted: { label: 'Accepted', color: '#0ea5e9', icon: '✅' },
    rejected: { label: 'Rejected', color: '#ef4444', icon: '❌' },
    shipped: { label: 'Shipped', color: '#6c63ff', icon: '📦' },
    out_for_delivery: { label: 'Out for Delivery', color: '#8b5cf6', icon: '🚚' },
    delivered: { label: 'Delivered', color: '#10b981', icon: '🎉' },
    return_requested: { label: 'Return Requested', color: '#f59e0b', icon: '↩️' },
    returned: { label: 'Returned', color: '#6b7280', icon: '↩️' },
    exchange_requested: { label: 'Exchange Requested', color: '#f59e0b', icon: '🔄' },
    exchanged: { label: 'Exchanged', color: '#10b981', icon: '🔄' },
    cancelled: { label: 'Cancelled', color: '#ef4444', icon: '🚫' },
}

export default function AdminPanel() {
    const { user } = useContext(AuthContext)
    const navigate = useNavigate()

    if (user?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-96 text-center">
                <div className="text-6xl mb-4">🔒</div>
                <h2 className="font-grotesk font-bold text-xl text-white mb-2">Admin Access Required</h2>
                <p className="text-sm mb-4" style={{ color: '#4a5580' }}>This page is restricted to admin users only.</p>
                <button onClick={() => navigate('/dashboard')}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52e0)' }}>
                    Back to Dashboard
                </button>
            </div>
        )
    }

    return <AdminPanelContent />
}

// ── Orders Tab ───────────────────────────────────────────────────────────────
function OrdersTab() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [note, setNote] = useState('')
    const [toast, setToast] = useState(null)

    function showToast(msg, ok = true) {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 3000)
    }

    async function loadOrders() {
        try {
            const r = await axios.get('/api/orders/all')
            setOrders(r.data)
        } catch (e) { }
        setLoading(false)
    }

    useEffect(() => { loadOrders() }, [])

    async function action(orderId, endpoint, extra = {}) {
        try {
            await axios.put(`/api/orders/${orderId}/${endpoint}`, extra)
            showToast(`✅ Order updated successfully`)
            loadOrders()
        } catch (e) {
            showToast('❌ ' + (e.response?.data?.message || 'Action failed'), false)
        }
    }

    const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

    const statusCounts = orders.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1
        return acc
    }, {})

    return (
        <div className="space-y-4">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-xl"
                        style={{ background: '#0f1224', border: `1px solid ${toast.ok ? 'rgba(16,185,129,0.4)' : 'rgba(244,63,94,0.4)'}`, color: toast.ok ? '#10b981' : '#f43f5e' }}>
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Summary stats */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {[
                    { key: 'pending', label: 'Pending' },
                    { key: 'accepted', label: 'Accepted' },
                    { key: 'shipped', label: 'Shipped' },
                    { key: 'out_for_delivery', label: 'Out Delivery' },
                    { key: 'delivered', label: 'Delivered' },
                    { key: 'return_requested', label: 'Returns' },
                ].map(s => {
                    const meta = ORDER_STATUS_META[s.key]
                    return (
                        <button key={s.key} onClick={() => setFilter(f => f === s.key ? 'all' : s.key)}
                            className="rounded-xl p-2.5 text-center transition-all"
                            style={{
                                background: filter === s.key ? `${meta.color}20` : '#0f1224',
                                border: `1px solid ${filter === s.key ? meta.color : '#1e2240'}`,
                            }}>
                            <div className="text-lg">{meta.icon}</div>
                            <div className="font-bold text-base" style={{ color: meta.color }}>{statusCounts[s.key] || 0}</div>
                            <div className="text-xs" style={{ color: '#4a5580', fontSize: '9px' }}>{s.label}</div>
                        </button>
                    )
                })}
            </div>

            {/* Orders list */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#6c63ff' }} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-slate-500">No orders found</div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(order => {
                        const meta = ORDER_STATUS_META[order.status] || ORDER_STATUS_META.pending
                        return (
                            <motion.div key={order._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                className="rounded-2xl p-4" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>

                                {/* Order header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="text-sm font-mono font-semibold text-white">
                                            #{order._id?.slice(-8).toUpperCase()}
                                        </div>
                                        <div className="text-xs mt-0.5 flex items-center gap-2" style={{ color: '#4a5580' }}>
                                            <span>👤 {order.user?.name || 'Unknown'}</span>
                                            <span>·</span>
                                            <span>{order.user?.email}</span>
                                            <span>·</span>
                                            <span>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-grotesk font-bold text-white text-base">{fmt(order.totalAmount)}</div>
                                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
                                            style={{ background: `${meta.color}18`, color: meta.color }}>
                                            {meta.icon} {meta.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {order.items?.map((item, j) => (
                                        <div key={j} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg"
                                            style={{ background: 'rgba(30,34,64,0.6)', border: '1px solid #1e2240' }}>
                                            <span className="text-slate-200 font-medium">{item.name}</span>
                                            <span style={{ color: '#6c63ff' }}>× {item.quantity}</span>
                                            <span style={{ color: '#4a5580' }}>· {fmt(item.price)}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Address */}
                                {order.address?.city && (
                                    <div className="text-xs mb-3" style={{ color: '#4a5580' }}>
                                        📍 {[order.address.street, order.address.city, order.address.state, order.address.pincode].filter(Boolean).join(', ')}
                                    </div>
                                )}

                                {/* Return/Exchange reason */}
                                {order.returnReason && (
                                    <div className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171' }}>
                                        ↩️ Return reason: {order.returnReason}
                                    </div>
                                )}
                                {order.exchangeReason && (
                                    <div className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(249,115,22,0.08)', color: '#fb923c' }}>
                                        🔄 Exchange reason: {order.exchangeReason}
                                    </div>
                                )}

                                {/* Action buttons */}
                                <div className="flex flex-wrap gap-2">
                                    {order.status === 'pending' && (
                                        <>
                                            <motion.button onClick={() => action(order._id, 'accept')}
                                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                                className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                                                style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                                                ✅ Accept Order
                                            </motion.button>
                                            <motion.button onClick={() => action(order._id, 'reject')}
                                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                                className="px-4 py-2 rounded-xl text-sm font-semibold"
                                                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                                                ❌ Reject
                                            </motion.button>
                                        </>
                                    )}
                                    {order.status === 'accepted' && (
                                        <motion.button onClick={() => action(order._id, 'ship')}
                                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                                            style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52e0)' }}>
                                            📦 Mark Shipped
                                        </motion.button>
                                    )}
                                    {order.status === 'shipped' && (
                                        <motion.button onClick={() => action(order._id, 'out-for-delivery')}
                                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                                            style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}>
                                            🚚 Send to Delivery
                                        </motion.button>
                                    )}
                                    {order.status === 'return_requested' && (
                                        <motion.button onClick={() => action(order._id, 'confirm-return')}
                                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                                            style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
                                            ↩️ Confirm Return
                                        </motion.button>
                                    )}
                                    {order.status === 'exchange_requested' && (
                                        <motion.button onClick={() => action(order._id, 'confirm-exchange')}
                                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                                            style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                                            🔄 Confirm Exchange
                                        </motion.button>
                                    )}
                                    {['delivered', 'returned', 'exchanged', 'rejected', 'cancelled'].includes(order.status) && (
                                        <span className="text-xs px-3 py-2 rounded-xl" style={{ color: '#4a5580', background: 'rgba(30,34,64,0.3)' }}>
                                            No actions required
                                        </span>
                                    )}
                                    {order.status === 'out_for_delivery' && (
                                        <span className="text-xs px-3 py-2 rounded-xl" style={{ color: '#8b5cf6', background: 'rgba(139,92,246,0.08)' }}>
                                            🚚 Waiting for customer to confirm delivery
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// ── Main AdminPanelContent ────────────────────────────────────────────────────
function AdminPanelContent() {
    const [activeTab, setActiveTab] = useState('inventory')
    const [products, setProducts] = useState([])
    const [showAddForm, setShowAddForm] = useState(false)
    const [newProduct, setNewProduct] = useState(emptyProduct)
    const [toast, setToast] = useState(null)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')
    const [users, setUsers] = useState([])
    const [orderCount, setOrderCount] = useState(0)
    // Restock state: { [productId]: { open: bool, qty: string } }
    const [restockMap, setRestockMap] = useState({})

    async function loadProducts() {
        const r = await axios.get('/api/products')
        setProducts(r.data)
    }

    useEffect(() => {
        loadProducts()
        axios.get('/api/analytics/users').then(r => setUsers(r.data)).catch(() => { })
        axios.get('/api/orders/all').then(r => {
            const pending = r.data.filter(o => o.status === 'pending').length
            setOrderCount(pending)
        }).catch(() => { })
    }, [])

    function openRestock(id) {
        setRestockMap(m => ({ ...m, [id]: { open: true, qty: '' } }))
    }
    function setRestockQty(id, qty) {
        setRestockMap(m => ({ ...m, [id]: { ...m[id], qty } }))
    }
    async function submitRestock(id, name) {
        const qty = parseInt(restockMap[id]?.qty)
        if (!qty || qty <= 0) { showToast('❌ Enter a valid quantity', false); return }
        try {
            const r = await axios.put(`/api/products/${id}/restock`, { quantity: qty })
            showToast(`✅ ${name} restocked! Stock now: ${r.data.product.stock}`)
            setRestockMap(m => ({ ...m, [id]: { open: false, qty: '' } }))
            loadProducts()
        } catch (e) { showToast('❌ ' + (e.response?.data?.message || 'Restock failed'), false) }
    }

    function showToast(msg, ok = true) {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 3500)
    }

    async function addProduct(e) {
        e.preventDefault()
        setSaving(true)
        try {
            const base = parseFloat(newProduct.basePrice)
            const comp = parseFloat(newProduct.competitorPrice) || base * 0.95
            const payload = {
                name: newProduct.name,
                category: newProduct.category,
                description: newProduct.description || `${newProduct.name} — premium quality.`,
                basePrice: base,
                currentPrice: base,
                aiPrice: base,
                competitorPrice: comp,
                stock: parseInt(newProduct.stock) || 100,
                inventory: parseInt(newProduct.inventory) || 100,
                demand: parseInt(newProduct.demand) || 50,
                sentimentScore: parseInt(newProduct.sentimentScore) || 65,
                image: `https://picsum.photos/seed/${encodeURIComponent(newProduct.name)}/400/280`,
                priceHistory: [{ price: base }],
            }
            const r = await axios.post('/api/products', payload)
            setProducts(p => [r.data.product, ...p])
            setNewProduct(emptyProduct)
            setShowAddForm(false)
            showToast(`✅ "${r.data.product.name}" added to ${r.data.product.category}!`)
        } catch (err) {
            showToast(`❌ ${err.response?.data?.message || err.message}`, false)
        }
        setSaving(false)
    }

    async function deleteProduct(id, name) {
        if (!window.confirm(`Remove "${name}"?`)) return
        await axios.delete(`/api/products/${id}`)
        setProducts(p => p.filter(x => x._id !== id))
        showToast(`🗑 "${name}" removed.`)
    }

    async function runAI() {
        await axios.post('/api/products/ai/simulate')
        const r = await axios.get('/api/products')
        setProducts(r.data)
        showToast('🤖 AI pricing simulation completed on all products!')
    }

    const filtered = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="space-y-5">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-xl"
                        style={{ background: '#0f1224', border: `1px solid ${toast.ok ? 'rgba(16,185,129,0.4)' : 'rgba(244,63,94,0.4)'}`, color: toast.ok ? '#10b981' : '#f43f5e' }}>
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-grotesk font-bold text-xl text-white">Admin Panel <span className="text-xs px-2 py-0.5 rounded-full ml-2" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>🛡 Admin</span></h2>
                    <p className="text-sm mt-1" style={{ color: '#4a5580' }}>Product management · Order fulfilment · {products.length} products</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={runAI} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                        style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}>
                        🤖 Run AI Update
                    </button>
                    <motion.button onClick={() => setShowAddForm(o => !o)}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                        style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52e0)' }}>
                        ＋ Add Product
                    </motion.button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                {[
                    { key: 'inventory', label: '📦 Inventory' },
                    { key: 'orders', label: `📋 Orders${orderCount > 0 ? ` · ${orderCount} pending` : ''}` },
                ].map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)}
                        className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                        style={activeTab === t.key
                            ? { background: 'linear-gradient(135deg,#6c63ff,#5a52e0)', color: 'white' }
                            : { color: '#4a5580' }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {activeTab === 'orders' ? <OrdersTab /> : (
                <>
                    {/* Add Product Form */}
                    <AnimatePresence>
                        {showAddForm && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden rounded-2xl" style={{ background: '#0f1224', border: '1px solid rgba(108,99,255,0.3)' }}>
                                <form onSubmit={addProduct} className="p-5">
                                    <div className="font-grotesk font-bold text-white mb-4">📦 Add New Product</div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="lg:col-span-1">
                                            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#4a5580' }}>Product Name *</label>
                                            <input type="text" required value={newProduct.name}
                                                onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
                                                placeholder="e.g. Floral Maxi Dress"
                                                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                                                style={{ background: '#1a1e38', border: '1px solid #1e2240' }} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#4a5580' }}>Base Price (₹) *</label>
                                            <input type="number" required min="1" value={newProduct.basePrice}
                                                onChange={e => setNewProduct(p => ({ ...p, basePrice: e.target.value }))}
                                                placeholder="e.g. 1299"
                                                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                                                style={{ background: '#1a1e38', border: '1px solid #1e2240' }} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#4a5580' }}>Competitor Price (₹)</label>
                                            <input type="number" value={newProduct.competitorPrice}
                                                onChange={e => setNewProduct(p => ({ ...p, competitorPrice: e.target.value }))}
                                                placeholder="e.g. 1199"
                                                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                                                style={{ background: '#1a1e38', border: '1px solid #1e2240' }} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#4a5580' }}>Stock Quantity</label>
                                            <input type="number" value={newProduct.stock}
                                                onChange={e => setNewProduct(p => ({ ...p, stock: e.target.value, inventory: e.target.value }))}
                                                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                                                style={{ background: '#1a1e38', border: '1px solid #1e2240' }} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#4a5580' }}>Initial Demand (%)</label>
                                            <input type="number" min="0" max="100" value={newProduct.demand}
                                                onChange={e => setNewProduct(p => ({ ...p, demand: e.target.value }))}
                                                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                                                style={{ background: '#1a1e38', border: '1px solid #1e2240' }} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#4a5580' }}>Category *</label>
                                            <select value={newProduct.category}
                                                onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))}
                                                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                                                style={{ background: '#1a1e38', border: '1px solid #1e2240' }}>
                                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="lg:col-span-3">
                                            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#4a5580' }}>Description (optional)</label>
                                            <input type="text" value={newProduct.description}
                                                onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))}
                                                placeholder="Brief product description"
                                                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                                                style={{ background: '#1a1e38', border: '1px solid #1e2240' }} />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 mt-4">
                                        <button type="submit" disabled={saving}
                                            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                                            style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52e0)' }}>
                                            {saving ? '⏳ Saving...' : '✓ Add Product'}
                                        </button>
                                        <button type="button" onClick={() => { setShowAddForm(false); setNewProduct(emptyProduct) }}
                                            className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                                            style={{ background: 'rgba(30,34,64,0.5)', color: '#6b7280' }}>Cancel</button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Products', value: products.length, icon: '📦', color: '#6c63ff' },
                            { label: 'Total Users', value: users.length || '—', icon: '👥', color: '#10b981' },
                            { label: 'Avg AI Price', value: products.length ? fmt(Math.round(products.reduce((s, p) => s + p.aiPrice, 0) / products.length)) : '—', icon: '💰', color: '#f59e0b' },
                            { label: 'Out of Stock', value: products.filter(p => (p.stock || 0) <= 0).length, icon: '🚨', color: '#ef4444' },
                        ].map((s, i) => (
                            <div key={s.label} className="rounded-2xl p-4" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                                <div className="text-2xl mb-2">{s.icon}</div>
                                <div className="font-grotesk font-bold text-2xl" style={{ color: s.color }}>{s.value}</div>
                                <div className="text-xs mt-1" style={{ color: '#4a5580' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Product table */}
                    <div className="rounded-2xl p-5 overflow-x-auto" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="font-grotesk font-bold text-white">📋 Product Inventory ({filtered.length})</div>
                            <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
                                className="px-3 py-1.5 rounded-xl text-xs text-white outline-none w-48"
                                style={{ background: '#1a1e38', border: '1px solid #1e2240' }} />
                        </div>
                        <table className="w-full text-sm" style={{ minWidth: 800 }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #1e2240' }}>
                                    {['Product', 'Category', 'Base Price', 'AI Price', 'Demand', 'Stock', 'Action'].map(h => (
                                        <th key={h} className="text-left pb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4a5580' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(p => {
                                    const stock = p.stock ?? p.inventory ?? 0
                                    const outOfStock = stock <= 0
                                    const rs = restockMap[p._id]
                                    return (
                                        <tr key={p._id} style={{ borderBottom: '1px solid rgba(30,34,64,0.5)', background: outOfStock ? 'rgba(239,68,68,0.04)' : undefined }}>
                                            <td className="py-3 font-medium text-xs max-w-xs truncate" style={{ color: outOfStock ? '#ef4444' : 'white' }}>
                                                {outOfStock && <span className="mr-1">🚨</span>}{p.name}
                                            </td>
                                            <td className="py-3"><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(108,99,255,0.1)', color: '#a5b4fc' }}>{p.category}</span></td>
                                            <td className="py-3 text-slate-400 text-xs">{fmt(p.basePrice)}</td>
                                            <td className="py-3 font-bold text-xs" style={{ color: '#6c63ff' }}>{fmt(p.aiPrice)}</td>
                                            <td className="py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-14 h-1.5 rounded-full" style={{ background: '#1e2240' }}>
                                                        <div className="h-full rounded-full" style={{ width: `${p.demand}%`, background: p.demand > 75 ? '#10b981' : p.demand > 45 ? '#f59e0b' : '#ef4444' }} />
                                                    </div>
                                                    <span className="text-xs text-slate-400">{p.demand}%</span>
                                                </div>
                                            </td>
                                            <td className="py-3 text-xs font-semibold" style={{ color: outOfStock ? '#ef4444' : stock < 20 ? '#f59e0b' : '#94a3b8' }}>
                                                {outOfStock ? '⚠ Out of Stock' : stock}
                                            </td>
                                            <td className="py-3">
                                                <div className="flex items-center gap-1.5">
                                                    {outOfStock || stock < 10 ? (
                                                        rs?.open ? (
                                                            <div className="flex items-center gap-1">
                                                                <input type="number" min="1" placeholder="Qty"
                                                                    value={rs.qty}
                                                                    onChange={e => setRestockQty(p._id, e.target.value)}
                                                                    className="w-14 px-2 py-1 rounded-lg text-xs text-white outline-none"
                                                                    style={{ background: '#1a1e38', border: '1px solid #1e2240' }} />
                                                                <button onClick={() => submitRestock(p._id, p.name)}
                                                                    className="text-xs px-2 py-1 rounded-lg font-semibold text-white"
                                                                    style={{ background: '#10b981' }}>✓</button>
                                                                <button onClick={() => setRestockMap(m => ({ ...m, [p._id]: { open: false, qty: '' } }))}
                                                                    className="text-xs px-2 py-1 rounded-lg" style={{ color: '#6b7280' }}>✕</button>
                                                            </div>
                                                        ) : (
                                                            <button onClick={() => openRestock(p._id)}
                                                                className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                                                                style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)' }}>
                                                                📦 Restock
                                                            </button>
                                                        )
                                                    ) : null}
                                                    <button onClick={() => deleteProduct(p._id, p.name)}
                                                        className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                                                        style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e' }}>
                                                        Remove
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    )
}
