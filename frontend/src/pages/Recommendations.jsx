import { useEffect, useState, useContext } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { CartContext } from '../App'
import { useNavigate } from 'react-router-dom'

const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`

function productImg(name) {
    const words = name.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2).slice(0, 3)
    const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    return `https://loremflickr.com/300/220/${encodeURIComponent(words.join(','))}?lock=${hash}`
}

const CATEGORIES = ['Dresses', 'Bags', 'Skincare', 'Makeup', 'Electronic Gadgets', 'Pet Store', 'Kitchen Utensils', 'Hair Care']

export default function Recommendations() {
    const { addToCart } = useContext(CartContext)
    const navigate = useNavigate()
    const [products, setProducts] = useState([])
    const [orders, setOrders] = useState([])
    const [selectedCat, setSelectedCat] = useState('All')
    const [loading, setLoading] = useState(true)
    const [addedId, setAddedId] = useState(null)

    useEffect(() => {
        Promise.all([
            axios.get('/api/products'),
            axios.get('/api/orders/my').catch(() => ({ data: [] })),
        ]).then(([p, o]) => {
            setProducts(p.data || [])
            setOrders(o.data || [])
            setLoading(false)
        })
    }, [])

    // Derive purchased categories for personalization
    const purchasedCategories = new Set(
        orders.flatMap(o => (o.items || []).map(i => i.product?.category)).filter(Boolean)
    )

    // "For You" = products from categories you've bought from, sorted by rating
    const forYou = products
        .filter(p => purchasedCategories.has(p.category) || purchasedCategories.size === 0)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 8)

    // New arrivals = sort by _id desc (newest ObjectId)
    const newArrivals = [...products].sort((a, b) => b._id > a._id ? 1 : -1).slice(0, 6)

    // Best sellers = top by reviewCount
    const bestSellers = [...products].sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0)).slice(0, 6)

    const filtered = selectedCat === 'All' ? products : products.filter(p => p.category === selectedCat)

    function handleAdd(p) {
        addToCart({ ...p, price: p.aiPrice, image: productImg(p.name) })
        setAddedId(p._id)
        setTimeout(() => setAddedId(null), 1500)
    }

    function ProductCard({ p }) {
        return (
            <motion.div whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(108,99,255,0.2)' }}
                className="rounded-2xl overflow-hidden cursor-pointer"
                style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                <div className="relative" style={{ height: 140 }}>
                    <img src={productImg(p.name)} alt={p.name} className="w-full h-full object-cover"
                        onError={e => { e.target.src = `https://picsum.photos/seed/${p._id}/300/220` }} />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(5,7,20,0.7),transparent)' }} />
                    <span className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-lg"
                        style={{ background: 'rgba(108,99,255,0.7)', color: 'white', backdropFilter: 'blur(4px)' }}>
                        {p.category}
                    </span>
                </div>
                <div className="p-3">
                    <div className="text-sm font-semibold text-white truncate mb-1">{p.name}</div>
                    <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs" style={{ color: '#f59e0b' }}>{'⭐'.repeat(Math.min(Math.round(p.rating || 0), 5))}</span>
                        <span className="text-xs" style={{ color: '#4a5580' }}>({p.reviewCount || 0})</span>
                    </div>
                    <div className="font-grotesk font-bold text-base mb-2" style={{ color: '#6c63ff' }}>{fmt(p.aiPrice)}</div>
                    <button onClick={() => handleAdd(p)}
                        className="w-full py-1.5 rounded-xl text-xs font-semibold text-white"
                        style={{ background: addedId === p._id ? '#10b981' : 'linear-gradient(135deg,#6c63ff,#5a52e0)' }}>
                        {addedId === p._id ? '✅ Added!' : '🛒 Add to Cart'}
                    </button>
                </div>
            </motion.div>
        )
    }

    if (loading) return (
        <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#6c63ff' }} />
        </div>
    )

    return (
        <div className="space-y-8">
            <div>
                <h2 className="font-grotesk font-bold text-xl text-white">✨ Personalized For You</h2>
                <p className="text-sm mt-1" style={{ color: '#4a5580' }}>
                    AI-curated recommendations based on your shopping history and preferences
                </p>
            </div>

            {/* For You section */}
            {forYou.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="font-grotesk font-semibold text-white">🎯 Picked For You</span>
                        <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(108,99,255,0.1)', color: '#a5b4fc' }}>
                            {purchasedCategories.size > 0 ? 'Based on your orders' : 'Top rated picks'}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {forYou.map(p => <ProductCard key={p._id} p={p} />)}
                    </div>
                </div>
            )}

            {/* Category filter */}
            <div>
                <div className="font-grotesk font-semibold text-white mb-3">🗂 Browse by Category</div>
                <div className="flex flex-wrap gap-2 mb-4">
                    {['All', ...CATEGORIES].map(c => (
                        <button key={c} onClick={() => setSelectedCat(c)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                            style={{
                                background: selectedCat === c ? 'rgba(108,99,255,0.2)' : '#0f1224',
                                color: selectedCat === c ? '#a5b4fc' : '#4a5580',
                                border: `1px solid ${selectedCat === c ? 'rgba(108,99,255,0.4)' : '#1e2240'}`
                            }}>
                            {c}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filtered.slice(0, 8).map(p => <ProductCard key={p._id} p={p} />)}
                </div>
            </div>

            {/* Best sellers */}
            <div>
                <div className="font-grotesk font-semibold text-white mb-3">🏆 Best Sellers</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {bestSellers.map(p => <ProductCard key={`bs-${p._id}`} p={p} />)}
                </div>
            </div>

            {/* New arrivals */}
            <div>
                <div className="font-grotesk font-semibold text-white mb-3">🆕 New Arrivals</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {newArrivals.map(p => <ProductCard key={`na-${p._id}`} p={p} />)}
                </div>
            </div>
        </div>
    )
}
