
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingBag, ChevronRight, AlertCircle } from 'lucide-react';
import { CartItem, Product } from '../types';

interface CartSidebarProps {
    items: CartItem[];
    isOpen: boolean;
    onRemove: (id: string) => void;
    onAdd: (product: Product) => void;

}

const CartSidebar: React.FC<CartSidebarProps> = ({ items, isOpen, onRemove, onAdd, onClose }) => {
    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed top-0 right-0 w-full max-w-[400px] h-full bg-[#181a1b] border-l border-white/10 z-[100] flex flex-col shadow-2xl backdrop-blur-2xl"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-black italic tracking-tighter text-white">MY CART</h2>
                            <div className="flex items-center gap-4 mt-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E4002B]">Live Bucket</span>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                                    <span>View Offers</span>
                                    <ChevronRight className="w-3 h-3" />
                                </div>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                            <ShoppingBag className="w-5 h-5 text-white/60" />
                        </div>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                        {items.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                                <ShoppingBag className="w-16 h-16 mb-4" />
                                <p className="font-bold uppercase tracking-widest text-xs">Your bucket is empty</p>
                            </div>
                        ) : (
                            items.map((item) => (
                                <motion.div
                                    layout
                                    key={item.id}
                                    className="bg-white/[0.02] border border-white/5 rounded-3xl p-4 flex gap-4 group hover:border-[#E4002B]/20 transition-all"
                                >
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-black shrink-0 border border-white/5">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between py-1">
                                        <div>
                                            <h4 className="font-bold text-sm text-white leading-tight group-hover:text-[#E4002B] transition-colors">{item.name}</h4>
                                            <button
                                                onClick={() => onRemove(item.id)}
                                                className="text-[10px] font-black text-white/20 uppercase tracking-widest hover:text-[#E4002B] mt-1 transition-colors"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-1 border border-white/5">
                                                <button
                                                    onClick={() => onRemove(item.id)}
                                                    className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="text-xs font-black italic min-w-[12px] text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => onAdd(item)}
                                                    className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <span className="font-black italic text-sm text-white">₹{item.price * item.quantity}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>

                    {/* Footer / Summary */}
                    <div className="p-8 bg-white/[0.02] border-t border-white/5 space-y-6">
                        <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] font-bold text-orange-500/80 leading-relaxed uppercase tracking-wider">
                                Please pick you order from the desk after placing order
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-white/30 uppercase tracking-widest">{items.length} ITEMS</span>
                                <button className="text-[10px] font-black text-[#E4002B] uppercase tracking-widest">Add Promo</button>
                            </div>
                            <div className="flex justify-between items-center text-sm font-black italic">
                                <span className="text-white/40 uppercase tracking-widest text-xs">Final Total</span>
                                <span className="text-white">₹{total}</span>
                            </div>
                        </div>

                        <button className="w-full bg-[#E4002B] hover:bg-white hover:text-[#E4002B] text-white py-5 rounded-[2rem] font-black italic text-xl tracking-tighter shadow-2xl shadow-[#E4002B]/20 transition-all flex items-center justify-between px-8 group">
                            <span>CHECKOUT</span>
                            <span className="text-sm bg-black/20 px-4 py-1 rounded-full group-hover:bg-[#E4002B]/10 transition-colors">₹{total}</span>
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CartSidebar;
