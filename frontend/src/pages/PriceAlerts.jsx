import { useEffect, useState, useContext } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { CartContext } from '../App'

const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`

function productImg(name) {
    const words = name.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2).slice(0, 3)
    const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    return `https://loremflickr.com/300/200/${encodeURIComponent(words.join(','))}?lock=${hash}`
}

function ProductMiniCard({ product }) {
    const { addToCart } = useContext(CartContext)
    const [added, setAdded] = useState(false)
    function handleAdd() {
        addToCart({ ...product, price: product.aiPrice, image: productImg(product.name) })
        setAdded(true)
        setTimeout(() => setAdded(false), 1500)
    }
    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -3 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
            <img src={productImg(product.name)} alt={product.name} className="w-full object-cover"
                style={{ height: 140 }}
                onError={e => { e.target.src = `https://picsum.photos/seed/${encodeURIComponent(product.name)}/300/200` }} />
            <div className="p-3">
                <div className="text-sm font-semibold text-white truncate">{product.name}</div>
                <div className="text-xs mt-0.5" style={{ color: '#4a5580' }}>{product.category}</div>
                <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs" style={{ color: '#f59e0b' }}>{'⭐'.repeat(Math.min(Math.round(product.rating || 0), 5))}</span>
                    <span className="text-xs" style={{ color: '#4a5580' }}>({product.reviewCount || 0})</span>
                </div>
                <div className="font-grotesk font-bold mt-1" style={{ color: '#6c63ff' }}>{fmt(product.aiPrice)}</div>
                <button onClick={handleAdd}
                    className="w-full mt-2 py-1.5 rounded-xl text-xs font-semibold text-white transition-all"
                    style={{ background: added ? '#10b981' : 'linear-gradient(135deg,#6c63ff,#5a52e0)' }}>
                    {added ? '✅ Added!' : '🛒 Add to Cart'}
                </button>
            </div>
        </motion.div>
    )
}

export default function PriceAlerts() {
    const [wishlist, setWishlist] = useState([])
    const [trending, setTrending] = useState([])
    const [recommended, setRecommended] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            axios.get('/api/orders/wishlist').catch(() => ({ data: [] })),
            axios.get('/api/products'),
        ]).then(([w, p]) => {
            const allProducts = p.data || []
            setWishlist(w.data || [])
            setTrending([...allProducts].sort((a, b) => b.demand - a.demand).slice(0, 6))
            setRecommended([...allProducts].sort((a, b) => b.rating - a.rating).slice(0, 6))
            setLoading(false)
        })
    }, [])

    if (loading) return (
        <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#6c63ff' }} />
        </div>
    )

    return (
        <div className="space-y-8">
            <div>
                <h2 className="font-grotesk font-bold text-xl text-white">🔔 Price Drop Alerts & Recommendations</h2>
                <p className="text-sm mt-1" style={{ color: '#4a5580' }}>AI-powered picks based on demand, ratings, and your wishlist</p>
            </div>

            {/* Wishlist alerts */}
            {wishlist.length > 0 && (
                <div>
                    <div className="font-grotesk font-semibold text-white mb-3 flex items-center gap-2">
                        ❤️ Wishlist Price Monitor
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e' }}>{wishlist.length} items</span>
                    </div>
                    <div className="space-y-3">
                        {wishlist.map((p, i) => {
                            const drop = ((p.basePrice - p.aiPrice) / p.basePrice * 100).toFixed(1)
                            const isDown = parseFloat(drop) > 0
                            return (
                                <motion.div key={p._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                    className="flex items-center gap-4 p-4 rounded-2xl"
                                    style={{ background: '#0f1224', border: `1px solid ${isDown ? 'rgba(16,185,129,0.25)' : '#1e2240'}` }}>
                                    <img src={productImg(p.name)} alt={p.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                                        onError={e => { e.target.src = `https://picsum.photos/seed/${p.name}/60/60` }} />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-white truncate">{p.name}</div>
                                        <div className="text-xs mt-0.5" style={{ color: '#4a5580' }}>{p.category}</div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className="font-grotesk font-bold" style={{ color: '#6c63ff' }}>{fmt(p.aiPrice)}</div>
                                        {isDown ? (
                                            <div className="text-xs font-semibold mt-0.5" style={{ color: '#10b981' }}>↓ {drop}% off!</div>
                                        ) : (
                                            <div className="text-xs mt-0.5" style={{ color: '#4a5580' }}>Watching...</div>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Trending */}
            <div>
                <div className="font-grotesk font-semibold text-white mb-3">🔥 Trending Right Now</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {trending.map(p => <ProductMiniCard key={p._id} product={p} />)}
                </div>
            </div>

            {/* Recommended */}
            <div>
                <div className="font-grotesk font-semibold text-white mb-1">✨ Highly Rated for You</div>
                <p className="text-xs mb-3" style={{ color: '#4a5580' }}>AI-curated picks with the best customer ratings</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {recommended.map(p => <ProductMiniCard key={p._id} product={p} />)}
                </div>
            </div>
        </div>
    )
}
