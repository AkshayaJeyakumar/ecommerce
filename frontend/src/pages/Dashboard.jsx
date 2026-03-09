import { useEffect, useState, useContext } from 'react'
import { motion } from 'framer-motion'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import axios from 'axios'
import { AuthContext } from '../App'

ChartJS.register(ArcElement, Tooltip, Legend)

const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`

function StatCard({ icon, label, value, sub, color, delay = 0 }) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4"
                style={{ background: `${color}20` }}>
                {icon}
            </div>
            <div className="font-grotesk font-bold text-2xl text-white">{value}</div>
            <div className="text-xs mt-1" style={{ color: '#4a5580' }}>{label}</div>
            {sub && <div className="text-xs mt-2 font-semibold" style={{ color }}>{sub}</div>}
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5"
                style={{ background: color, transform: 'translate(30%,-30%)' }} />
        </motion.div>
    )
}

function productImgUrl(name) {
    const stopWords = new Set(['and', 'or', 'with', 'for', 'the', 'a', 'an', 'in', 'of'])
    const words = name.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w)).slice(0, 3)
    const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    return `https://loremflickr.com/80/80/${encodeURIComponent(words.join(','))}?lock=${hash}`
}

const COLORS = ['#6c63ff', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#14b8a6']

export default function Dashboard() {
    const { user } = useContext(AuthContext)
    const isAdmin = user?.role === 'admin'
    const [products, setProducts] = useState([])
    const [reviews, setReviews] = useState([])
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            axios.get('/api/products'),
            axios.get('/api/reviews'),
            isAdmin ? axios.get('/api/orders/all').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        ]).then(([p, r, o]) => {
            setProducts(p.data || [])
            setReviews(r.data?.reviews || [])
            setOrders(o.data || [])
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [isAdmin])

    // Derived data
    const trending = [...products].sort((a, b) => b.demand - a.demand).slice(0, 4)
    const topRated = [...products].sort((a, b) => b.rating - a.rating).slice(0, 4)
    const latestReviews = [...reviews].slice(0, 5)

    // Category distribution
    const catMap = {}
    products.forEach(p => { catMap[p.category] = (catMap[p.category] || 0) + 1 })
    const categories = Object.entries(catMap).sort((a, b) => b[1] - a[1])
    const maxCat = categories[0]?.[1] || 1

    const doughnutData = {
        labels: categories.map(([c]) => c),
        datasets: [{
            data: categories.map(([, n]) => n),
            backgroundColor: COLORS.slice(0, categories.length),
            borderWidth: 0,
        }]
    }

    const totalOrders = isAdmin ? orders.length : 0
    const pendingCount = isAdmin ? orders.filter(o => o.status === 'pending').length : 0
    const deliveredCount = isAdmin ? orders.filter(o => o.status === 'delivered').length : 0

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="w-10 h-10 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#6c63ff' }} />
        </div>
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="font-grotesk font-bold text-xl text-white">
                    {isAdmin ? '🛡 Admin Dashboard' : '👋 Welcome back, ' + (user?.name || 'there') + '!'}
                </h2>
                <p className="text-sm mt-1" style={{ color: '#4a5580' }}>
                    {isAdmin
                        ? `Platform overview · ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`
                        : 'Discover trending products and track your orders'}
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="📦" label="Total Products" value={products.length} sub={`${categories.length} categories`} color="#6c63ff" delay={0} />
                <StatCard icon="💬" label="Total Reviews" value={reviews.length}
                    sub={`${reviews.filter(r => r.sentiment === 'positive').length} positive`} color="#10b981" delay={0.06} />
                {isAdmin ? <>
                    <StatCard icon="🛒" label="Total Orders" value={totalOrders}
                        sub={`${pendingCount} pending`} color="#f59e0b" delay={0.12} />
                    <StatCard icon="✅" label="Delivered" value={deliveredCount}
                        sub="Successfully fulfilled" color="#0ea5e9" delay={0.18} />
                </> : <>
                    <StatCard icon="🔥" label="Trending Now" value={trending[0]?.name?.split(' ').slice(0, 2).join(' ') || '—'}
                        sub={`${trending[0]?.demand || 0}% demand`} color="#f59e0b" delay={0.12} />
                    <StatCard icon="⭐" label="Top Rated" value={topRated[0]?.name?.split(' ').slice(0, 2).join(' ') || '—'}
                        sub={`${topRated[0]?.rating || 0} stars`} color="#0ea5e9" delay={0.18} />
                </>}
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Category Distribution */}
                <div className="rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                    <div className="font-grotesk font-semibold text-white mb-4">📊 Category Distribution</div>
                    {categories.length > 0 ? <>
                        <div style={{ height: 160 }}>
                            <Doughnut data={doughnutData} options={{
                                responsive: true, maintainAspectRatio: false, cutout: '65%',
                                plugins: { legend: { display: false } }
                            }} />
                        </div>
                        <div className="mt-4 space-y-1.5">
                            {categories.slice(0, 5).map(([cat, count], i) => (
                                <div key={cat} className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                                    <span className="text-xs text-slate-400 flex-1 truncate">{cat}</span>
                                    <span className="text-xs font-semibold text-white">{count}</span>
                                </div>
                            ))}
                        </div>
                    </> : <div className="text-slate-500 text-sm text-center py-8">No products yet</div>}
                </div>

                {/* Trending Products */}
                <div className="rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                    <div className="font-grotesk font-semibold text-white mb-4">🔥 Trending Products</div>
                    <div className="space-y-3">
                        {trending.map((p, i) => (
                            <motion.div key={p._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                                className="flex items-center gap-3 p-2.5 rounded-xl"
                                style={{ background: 'rgba(30,34,64,0.3)', border: '1px solid rgba(30,34,64,0.6)' }}>
                                <img src={productImgUrl(p.name)} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                    onError={e => { e.target.src = `https://picsum.photos/seed/${encodeURIComponent(p.name)}/40/40` }} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold text-white truncate">{p.name}</div>
                                    <div className="text-xs mt-0.5" style={{ color: '#6c63ff' }}>{fmt(p.aiPrice)}</div>
                                </div>
                                <div className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                                    style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                                    {p.demand}%
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Top Rated Products */}
                <div className="rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                    <div className="font-grotesk font-semibold text-white mb-4">⭐ Top Rated</div>
                    <div className="space-y-3">
                        {topRated.map((p, i) => (
                            <motion.div key={p._id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                                className="flex items-center gap-3 p-2.5 rounded-xl"
                                style={{ background: 'rgba(30,34,64,0.3)', border: '1px solid rgba(30,34,64,0.6)' }}>
                                <img src={productImgUrl(p.name)} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                    onError={e => { e.target.src = `https://picsum.photos/seed/${encodeURIComponent(p.name)}/40/40` }} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold text-white truncate">{p.name}</div>
                                    <div className="text-xs mt-0.5" style={{ color: '#4a5580' }}>{p.category}</div>
                                </div>
                                <div className="text-xs font-semibold flex-shrink-0" style={{ color: '#f59e0b' }}>
                                    ⭐ {p.rating?.toFixed(1) || '—'}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Latest Reviews */}
            <div className="rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                <div className="font-grotesk font-semibold text-white mb-4">💬 Latest Reviews</div>
                {latestReviews.length === 0 ? (
                    <div className="text-center text-slate-500 py-6">No reviews yet.</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                        {latestReviews.map((r, i) => (
                            <motion.div key={r._id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                className="p-3 rounded-xl" style={{ background: 'rgba(30,34,64,0.3)', border: '1px solid #1e2240' }}>
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                            style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52e0)' }}>
                                            {(r.user?.name || 'A')[0]}
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-white">{r.user?.name || 'Anonymous'}</div>
                                            <div className="text-xs" style={{ color: '#f59e0b' }}>{'⭐'.repeat(Math.min(r.rating || 0, 5))}</div>
                                        </div>
                                    </div>
                                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                        style={{
                                            background: r.sentiment === 'positive' ? 'rgba(16,185,129,0.1)' : r.sentiment === 'negative' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                                            color: r.sentiment === 'positive' ? '#10b981' : r.sentiment === 'negative' ? '#ef4444' : '#f59e0b'
                                        }}>
                                        {r.sentiment || 'neutral'}
                                    </span>
                                </div>
                                <p className="text-xs mt-2 line-clamp-2" style={{ color: '#94a3b8' }}>{r.reviewText || r.text}</p>
                                <div className="text-xs mt-1.5" style={{ color: '#3a4070' }}>
                                    {r.product?.name || ''} · {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : ''}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Admin-only: AI Activity Feed */}
            {isAdmin && (
                <div className="rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                    <div className="font-grotesk font-semibold text-white mb-4">🤖 AI Activity Feed</div>
                    <div className="space-y-2">
                        {[
                            { icon: '📈', msg: `AI updated prices on ${products.length} products`, t: 'Today', c: '#6c63ff' },
                            { icon: '💬', msg: `${reviews.filter(r => r.sentiment === 'positive').length} positive reviews driving price adjustments`, t: 'Today', c: '#10b981' },
                            { icon: '🛒', msg: `${pendingCount} orders pending admin action`, t: 'Now', c: '#f59e0b' },
                            { icon: '📦', msg: `${products.filter(p => (p.stock || 0) <= 5).length} products at critically low stock`, t: 'Alert', c: '#ef4444' },
                        ].map((item, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                                className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(30,34,64,0.3)' }}>
                                <span className="text-lg">{item.icon}</span>
                                <div className="flex-1">
                                    <div className="text-sm text-slate-300">{item.msg}</div>
                                    <div className="text-xs mt-1" style={{ color: '#4a5580' }}>{item.t}</div>
                                </div>
                                <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: item.c }} />
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
