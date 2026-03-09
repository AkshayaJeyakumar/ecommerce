import { useContext } from 'react'
import { motion } from 'framer-motion'
import { CartContext, AuthContext } from '../App'
import { useNavigate } from 'react-router-dom'

const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`

export default function CartPage() {
    const { cart, removeFromCart, updateQty, setCartOpen } = useContext(CartContext)
    const { user } = useContext(AuthContext)
    const navigate = useNavigate()

    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)

    function openCheckout() {
        setCartOpen(true)
        navigate('/products')
    }

    return (
        <div className="space-y-5 max-w-3xl">
            <div>
                <h2 className="font-grotesk font-bold text-xl text-white">🛒 My Cart</h2>
                <p className="text-sm mt-1" style={{ color: '#4a5580' }}>
                    {cart.length > 0 ? `${cart.length} item${cart.length !== 1 ? 's' : ''} in your cart` : 'Your cart is empty'}
                </p>
            </div>

            {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 rounded-2xl"
                    style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                    <div className="text-6xl mb-4">🛍️</div>
                    <div className="text-white font-semibold mb-2">Your cart is empty</div>
                    <p className="text-sm mb-6" style={{ color: '#4a5580' }}>Browse products and add items to your cart</p>
                    <motion.button onClick={() => navigate('/products')}
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                        style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52e0)' }}>
                        Browse Products
                    </motion.button>
                </div>
            ) : (
                <>
                    {/* Cart items */}
                    <div className="space-y-3">
                        {cart.map(item => (
                            <motion.div key={item._id} layout
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-4 p-4 rounded-2xl"
                                style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                                <img src={item.image} alt={item.name}
                                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                                    onError={e => { e.target.src = `https://picsum.photos/seed/${item._id}/64/64` }} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-white truncate">{item.name}</div>
                                    <div className="text-xs mt-0.5" style={{ color: '#4a5580' }}>{item.category}</div>
                                    <div className="text-sm font-bold mt-1" style={{ color: '#6c63ff' }}>{fmt(item.price)}</div>
                                </div>
                                {/* Qty controls */}
                                <div className="flex items-center gap-2">
                                    <button onClick={() => updateQty(item._id, item.quantity - 1)}
                                        className="w-8 h-8 rounded-xl font-bold text-white flex items-center justify-center"
                                        style={{ background: '#1e2240' }}>−</button>
                                    <span className="text-white font-semibold w-6 text-center">{item.quantity}</span>
                                    <button onClick={() => updateQty(item._id, item.quantity + 1)}
                                        className="w-8 h-8 rounded-xl font-bold text-white flex items-center justify-center"
                                        style={{ background: '#1e2240' }}>+</button>
                                </div>
                                <div className="text-right flex-shrink-0 ml-2">
                                    <div className="text-sm font-bold text-white">{fmt(item.price * item.quantity)}</div>
                                    <button onClick={() => removeFromCart(item._id)}
                                        className="text-xs mt-1" style={{ color: '#ef4444' }}>Remove</button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Order summary */}
                    <div className="rounded-2xl p-5" style={{ background: '#0f1224', border: '1px solid #1e2240' }}>
                        <div className="font-grotesk font-semibold text-white mb-4">Order Summary</div>
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span style={{ color: '#4a5580' }}>Subtotal ({cart.length} items)</span>
                                <span className="text-white">{fmt(total)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span style={{ color: '#4a5580' }}>Delivery</span>
                                <span className="text-green-400">FREE</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span style={{ color: '#4a5580' }}>Discount</span>
                                <span style={{ color: '#10b981' }}>−{fmt(Math.round(total * 0.02))}</span>
                            </div>
                            <div className="border-t pt-2 mt-2 flex justify-between" style={{ borderColor: '#1e2240' }}>
                                <span className="font-semibold text-white">Total</span>
                                <span className="font-grotesk font-bold text-xl" style={{ color: '#6c63ff' }}>
                                    {fmt(total - Math.round(total * 0.02))}
                                </span>
                            </div>
                        </div>
                        <motion.button onClick={openCheckout}
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            className="w-full py-3 rounded-xl font-semibold text-white"
                            style={{ background: 'linear-gradient(135deg,#6c63ff,#5a52e0)', boxShadow: '0 8px 24px rgba(108,99,255,0.35)' }}>
                            Proceed to Checkout →
                        </motion.button>
                        <p className="text-xs text-center mt-2" style={{ color: '#4a5580' }}>
                            🔒 Secure checkout with UPI, Cards & more
                        </p>
                    </div>
                </>
            )}
        </div>
    )
}
