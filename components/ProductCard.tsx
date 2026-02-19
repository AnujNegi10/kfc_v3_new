
import React from 'react';
import { Plus, Flame } from 'lucide-react';
import { Product } from '../types';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-xl overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col relative"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] p-4 bg-white flex items-center justify-center ">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
        />

        {/* Floating Add Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onAdd(product)}
          className="absolute -bottom-6 right-4 z-20 w-12 h-12 bg-[#E4002B] text-white rounded-xl shadow-lg shadow-[#E4002B]/30 flex items-center justify-center transition-all"
        >
          <Plus className="w-8 h-8" />
        </motion.button>
      </div>

      {/* Content Section */}
      <div className="p-6 pt-8 flex flex-col gap-1">
        <h3 className="font-extrabold text-[18px] text-[#1a1a1a] uppercase leading-tight tracking-tight">
          {product.name}
        </h3>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg font-black text-gray-900">₹{product.price}</span>
          <span className="text-sm text-[#E4002B] line-through opacity-80">₹{Math.round(product.price * 1.25)}</span>
        </div>

        <div className="border-t border-gray-50 pt-4 mt-2">
          <p className="text-[13px] text-gray-500 font-medium mb-4">
            {product.description || "Freshly prepared KFC signature dish with our secret blend of herbs and spices."}
          </p>

          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center ${product.type === 'veg' ? 'border-green-600' : 'border-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${product.type === 'veg' ? 'bg-green-600' : 'bg-red-600'}`} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">
              {product.type === 'veg' ? 'Veg' : 'Non Veg'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
