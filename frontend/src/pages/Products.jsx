import { useState, useEffect, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { AuthContext, CartContext } from '../App'

const categories = ['All', 'Dresses', 'Bags', 'Skincare', 'Makeup', 'Electronic Gadgets', 'Pet Store', 'Kitchen Utensils', 'Hair Care']
const demandColor = d => d > 75 ? '#10b981' : d > 45 ? '#f59e0b' : '#ef4444'
const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`

function productImgUrl(name, category) {
    const stopWords = new Set(['and', 'or', 'with', 'for', 'the', 'a', 'an', 'in', 'of', 'set', 'kit', 'pack', 'ml', 'gm', 'kg', 'pc', 'nos', 'pieces', 'litre', 'ltr', 'liters'])
    const words = name.toLowerCase()
        .replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w) && !/^\d+$/.test(w)).slice(0, 3)
    const keyword = words.join(',') || category
    const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    return `https://loremflickr.com/400/280/${encodeURIComponent(keyword)}?lock=${hash}`
}

function ProductCard({ product, onWishlist, wishlist, isAdmin }) {
    const delta = ((product.aiPrice - product.basePrice) / product.basePrice * 100).toFixed(1)
    const wished = wishlist?.includes(product._id)
    const { addToCart } = useContext(CartContext)
    const imgUrl = productImgUrl(product.name, product.category)
    const [added, setAdded] = useState(false)

    function handleAddToCart() {
        // Fix NaN: explicitly set price = aiPrice so cart totals compute correctly
        addToCart({ ...product, price: product.aiPrice, image: imgUrl })
        setAdded(true)
        setTimeout(() => setAdded(false), 1500)
    }

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, boxShadow: '0 20px 60px rgba(108,99,255,0.2)' }}
            className="rounded-2xl overflow-hidden transition-all"
            style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
            <div className="relative" style={{ height: 160 }}>
                <img src={imgUrl} alt={product.name} className="w-full h-full object-cover"
                    onError={e => { e.target.src = `https://picsum.photos/seed/${encodeURIComponent(product.name)}/400/280` }} />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(5,7,20,0.8),transparent)' }} />
                <span className="absolute top-2 left-2 text-xs px-2 py-1 rounded-lg font-semibold"
                    style={{ background: 'rgba(108,99,255,0.7)', color: 'white', backdropFilter: 'blur(6px)' }}>
                    {product.category}
                </span>
                <button onClick={() => onWishlist(product._id)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-lg"
                    style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }}>
                    {wished ? '❤️' : '🤍'}
                </button>
                <span className="absolute bottom-2 right-2 text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ background: parseFloat(delta) >= 0 ? 'rgba(16,185,129,0.8)' : 'rgba(244,63,94,0.8)', color: 'white' }}>
                    {parseFloat(delta) >= 0 ? '+' : ''}{delta}%
                </span>
            </div>
            <div className="p-4">
                <h3 className="text-sm font-semibold text-white leading-tight mb-1 truncate">{product.name}</h3>
                {product.subCategory && <div className="text-xs mb-2" style={{ color: '#6c63ff' }}>{product.subCategory}</div>}
                <div className="flex items-baseline gap-2 mb-3">
                    <span className="font-grotesk font-bold text-lg" style={{ color: '#6c63ff' }}>{fmt(product.aiPrice)}</span>
                    <span className="text-xs line-through" style={{ color: '#4a5580' }}>{fmt(product.basePrice)}</span>
                </div>
                <div className="space-y-1.5 mb-3">
                    <div className="flex justify-between text-xs">
                        <span style={{ color: '#4a5580' }}>Demand</span>
                        <span style={{ color: demandColor(product.demand) }}>{product.demand}%</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: '#1e2240' }}>
                        <div className="h-full rounded-full" style={{ width: `${product.demand}%`, background: demandColor(product.demand) }} />
                    </div>
                    <div className="flex justify-between text-xs">
                        <span style={{ color: '#4a5580' }}>Competitor</span>
                        <span style={{ color: '#94a3b8' }}>{fmt(product.competitorPrice)}</span>
                    </div>
                </div>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1 text-xs">
                        <span className="text-yellow-400">⭐</span>
                        <span style={{ color: '#94a3b8' }}>{product.rating?.toFixed(1)}</span>
                        {product.reviewCount > 0 && <span style={{ color: '#4a5580' }}>({product.reviewCount})</span>}
                    </div>
                    <span className="text-xs" style={{ color: product.stock < 20 ? '#ef4444' : '#4a5580' }}>
                        {product.stock < 20 ? `⚠ ${product.stock} left` : `✓ In Stock`}
                    </span>
                </div>
                {isAdmin ? (
                    <div className="w-full py-2 rounded-xl text-sm font-semibold text-center"
                        style={{ background: 'rgba(30,34,64,0.6)', color: '#4a5580', border: '1px solid #1e2240' }}>
                        👁️ View Only
                    </div>
                ) : (
                    <motion.button onClick={handleAddToCart}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        className="w-full py-2 rounded-xl text-sm font-semibold text-white transition-all"
                        style={{ background: added ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#6c63ff,#5a52e0)' }}>
                        {added ? '✅ Added to Cart!' : '🛒 Add to Cart'}
                    </motion.button>
                )}
            </div>
        </motion.div>
    )
}

export default function Products() {
    const { user } = useContext(AuthContext)
    const isAdmin = user?.role === 'admin'
    const { cartCount, setCartOpen } = useContext(CartContext)
    const [products, setProducts] = useState([])
    const [cat, setCat] = useState('All')
    const [search, setSearch] = useState('')
    const [sort, setSort] = useState('')
    const [loading, setLoading] = useState(true)
    const [wishlist, setWishlist] = useState([])

    useEffect(() => {
        setLoading(true)
        const params = {}
        if (cat !== 'All') params.category = cat
        if (search) params.q = search
        if (sort) params.sort = sort
        axios.get('/api/products', { params }).then(r => { setProducts(r.data); setLoading(false) })
    }, [cat, search, sort])

    useEffect(() => {
        if (user) axios.get('/api/orders/wishlist').then(r => setWishlist(r.data.map(p => p._id)))
    }, [user])

    async function toggleWishlist(productId) {
        if (!user) return
        const r = await axios.post(`/api/orders/wishlist/${productId}`)
        setWishlist(r.data.wishlist)
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-grotesk font-bold text-xl text-white">Product Marketplace</h2>
                    <p className="text-sm mt-1" style={{ color: '#4a5580' }}>{products.length} products · AI-adjusted prices in ₹</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Cart button — only for non-admin */}
                    {!isAdmin && (
                        <button onClick={() => setCartOpen(true)}
                            className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                            style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                            🛒 Cart
                            {cartCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
                                    style={{ background: '#6c63ff', color: 'white' }}>{cartCount}</span>
                            )}
                        </button>
                    )}
                    <select value={sort} onChange={e => setSort(e.target.value)}
                        className="px-3 py-2 rounded-xl text-sm text-white outline-none"
                        style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                        <option value="">Sort: Default</option>
                        <option value="price_asc">Price: Low → High</option>
                        <option value="price_desc">Price: High → Low</option>
                        <option value="rating">Top Rated</option>
                    </select>
                </div>
            </div>

            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2">🔍</span>
                <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white outline-none"
                    style={{ background: '#0f1224', border: '1px solid #1e2240' }} />
            </div>

            <div className="flex gap-2 flex-wrap">
                {categories.map(c => (
                    <button key={c} onClick={() => setCat(c)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                        style={cat === c ? { background: '#6c63ff', color: 'white' } : { background: '#0f1224', border: '1px solid #1e2240', color: '#4a5580' }}>
                        {c}
                    </button>
                ))}
            </div>

            {loading
                ? <div className="flex justify-center py-16"><div className="w-10 h-10 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#6c63ff' }} /></div>
                : products.length === 0
                    ? <div className="text-center py-16 text-slate-500">No products found</div>
                    : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {products.map(p => <ProductCard key={p._id} product={p} onWishlist={toggleWishlist} wishlist={wishlist} isAdmin={isAdmin} />)}
                    </div>
            }
        </div>
    )
}
