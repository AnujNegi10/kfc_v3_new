import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus, Search, X } from 'lucide-react';
import { Category, Product } from '../types';
import { CATEGORIES, MENU_ITEMS } from '../constants';
import ProductCard from './ProductCard';
import CartSidebar from './CartSidebar';

interface MenuPageProps {
    onStartAI: () => void;
    onAddToCart: (product: Product) => void;
}
interface CartSidebarProps {
    items: any[];
    isOpen: boolean;
    onClose: () => void;
    onAdd: (product: Product) => void;
    onRemove: (id: string) => void;
}

const MenuPage: React.FC<MenuPageProps> = ({ onAddToCart, onStartAI }) => {
    const [activeCategory, setActiveCategory] = useState<Category>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [cart, setCart] = useState(products);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Fetch products from API whenever category changes
    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:8000/api/products?category=${activeCategory}`);
                const data = await res.json();
                if (!data.error) {
                    setProducts(data);
                }
            } catch (err) {
                console.error("Menu fetch failed:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, [activeCategory]);

    const filteredProducts = products.filter(item => {
        return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const handleAddToCart = (product: Product) => {
        setCart((prev) => {
            // Check if product already exists in cart
            const existing = prev.find(item => item.id === product.id);

            if (existing) {
                // Increase quantity if already in cart
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            // Add new item to cart
            return [
                ...prev,
                {
                    ...product,
                    quantity: 1,
                },
            ];
        });

        // IMPORTANT: open cart when item is added
        setIsCartOpen(true);
    };
    const handleRemoveFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };



    return (
        <div className="h-screen w-screen bg-[#181a1b] flex items-center justify-center p-2 md:p-6 font-inter overflow-hidden">
            <div className="relative w-full h-full max-w-[1500px] max-h-[950px] bg-[#181a1b] rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden flex flex-col md:flex-row">

                {/* AI Agent Button - Now positioned relative to the Menu Box */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onStartAI}
                    className="absolute top-6 right-6 z-[110] w-32 h-20 md:w-25 md:h-25 bg-[#181a1b] rounded-[2rem] flex flex-col items-center justify-center text-center border border-white/10 shadow-[0_0_40px_rgba(228,0,43,0.3)] group hover:border-[#E4002B]/40 transition-all duration-500"
                >
                    <div className="flex gap-1 items-center mb-2 h-4">
                        {[1, 2, 3].map(i => (
                            <motion.div
                                key={i}
                                animate={{ height: [4, 12, 4] }}
                                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                                className="w-1 bg-[#E4002B] rounded-full shadow-[0_0_10px_rgba(228,0,43,0.5)]"
                            />
                        ))}
                    </div>
                    <span className="text-[10px] md:text-[8px] font-black leading-tight text-white group-hover:text-white uppercase tracking-widest px-2">
                        ORDER WITH OUR <br /> AI AGENT
                    </span>
                </motion.button>

                {/* Sidebar Menu */}
                <aside className="w-full md:w-80 bg-[#181a1b] border-r border-white/5 flex flex-col p-8 pt-12 text-red-600">
                    <div className="mb-10">
                        <h1 className="text-5xl font-black italic tracking-tighter text-[#E4002B] leading-none">KFC</h1>
                        <p className="text-xl font-black italic uppercase tracking-tighter text-white/40">Menu</p>
                    </div>

                    <nav className="flex-1 flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat as Category)}
                                className={`text-left py-4 px-6 rounded-2xl font-black uppercase tracking-tight text-xs transition-all duration-300 ${activeCategory === cat
                                    ? 'bg-white text-[#E4002B] shadow-xl translate-x-1'
                                    : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                {cat.replace('_', ' ')}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Products Grid Section */}
                <main className="flex-1 flex flex-col bg-[#181a1b] overflow-hidden">
                    {/* Header with Search */}
                    <header className="px-10 py-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10">
                        <div>
                            <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-1 text-[#E4002B]">
                                {activeCategory.replace('_', ' ')}
                            </h2>
                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Selected Category</p>
                        </div>

                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Find some crispy food..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-2/3 bg-white border-2 border-transparent focus:border-[#E4002B] rounded-2xl py-4 pl-12 pr-4 text-sm font-black text-black placeholder-gray-400 transition-all outline-none"
                            />
                        </div>
                    </header>

                    {/* Scrolling Product Grid */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar bg-[#181a1b]">
                        <div className="grid grid-cols-1 sm:grid-cols-4 xl:grid-cols-4 gap-6">
                            <AnimatePresence mode="popLayout">
                                {filteredProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onAdd={onAddToCart}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                        {filteredProducts.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300 py-20">
                                <Search className="w-12 h-12 mb-4 opacity-10" />
                                <p className="font-bold italic uppercase tracking-tighter">No items found</p>
                            </div>
                        )}
                    </div>

                </main>
                <div className="overflow-y-auto">
                    <CartSidebar
                        items={cart}
                        isOpen={isCartOpen}   // cart opens/closes based on state
                        onClose={() => setIsCartOpen(false)} // user closes cart
                        onRemove={handleRemoveFromCart}
                        onAdd={handleAddToCart}
                    />

                </div>


            </div>
        </div>
    );
};

export default MenuPage;
