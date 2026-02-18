
import React from 'react';
import { ShoppingBag, Mic, Menu, User } from 'lucide-react';

interface HeaderProps {
  cartCount: number;
  onCartToggle: () => void;
  isVoiceActive: boolean;
}

const Header: React.FC<HeaderProps> = ({ cartCount, onCartToggle, isVoiceActive }) => {
  return (
    <header className={`absolute top-0 left-0 right-0 h-24 z-50 px-8 flex items-center justify-between pointer-events-none transition-all duration-700 ${isVoiceActive ? 'mr-[400px]' : ''}`}>
      <div className="flex items-center gap-8 pointer-events-auto">
        <h1 className="text-5xl font-black text-[#E4002B] tracking-tighter italic select-none">KFC</h1>
      </div>

      <div className="flex items-center gap-4 pointer-events-auto">
        <button className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
          <User className="w-5 h-5 text-white/40" />
        </button>
        <button
          onClick={onCartToggle}
          className="relative group h-12 bg-[#E4002B] text-white px-6 rounded-2xl flex items-center gap-3 shadow-xl shadow-[#E4002B]/20 transition-all hover:scale-105 active:scale-95"
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="font-black italic tracking-tighter text-lg">{cartCount}</span>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
