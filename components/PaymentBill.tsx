
import React from 'react';
import { Check, Receipt, CreditCard, ChevronRight } from 'lucide-react';
import { CartItem } from '../types';

interface PaymentBillProps {
    items: CartItem[];
    onPay: () => void;
}

const PaymentBill: React.FC<PaymentBillProps> = ({ items, onPay }) => {
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const total = subtotal;

    return (
        <div className="fixed inset-0 z-[200] bg-[#181a1b] flex items-center justify-center p-4 font-inter">
            <div className="w-full h-full max-w-lg bg-[#181a3b] border-2 border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(228,0,43,0.1)] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-[#E4002B] p-8 text-center relative overflow-hidden">
                    <div className="w-16 h-16 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-xl">
                        <Check className="w-8 h-8 text-[#E4002B] stroke-[3px]" />
                    </div>
                    <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase">Order Confirmed!</h2>
                    <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-1">Thank you for choosing KFC</p>

                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 opacity-10 translate-x-1/4 -translate-y-1/4">
                        <Receipt className="w-32 h-32 rotate-12" />
                    </div>
                </div>

                {/* Bill Content */}
                <div className="p-8 flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Order Summary</span>
                        <span className="text-[10px] font-bold text-white/30">ID: #KFC-{Math.floor(Math.random() * 9000) + 1000}</span>
                    </div>

                    <div className="space-y-4">
                        {items.map((item) => (
                            <div key={item.id} className="flex justify-between items-start">
                                <div className="flex gap-3">
                                    <span className="text-sm font-black text-[#E4002B] italic">x{item.quantity}</span>
                                    <div>
                                        <h4 className="text-sm font-bold text-white uppercase leading-tight">{item.name}</h4>
                                        <span className="text-[10px] text-white/30 font-medium tracking-tight">Standard Portion</span>
                                    </div>
                                </div>
                                <span className="text-sm font-black italic text-white">₹{item.price * item.quantity}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto pt-6 border-t border-dashed border-white/20 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-white/40 font-medium">Subtotal</span>
                            <span className="text-white font-bold italic">₹{subtotal}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl mt-4">
                            <span className="text-lg font-black italic tracking-tighter text-[#E4002B]">GRAND TOTAL</span>
                            <span className="text-2xl font-black italic tracking-tighter text-white">₹{total}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Button */}
                <div className="p-8 pt-0">
                    <button
                        onClick={onPay}
                        className="w-full bg-[#E4002B] hover:bg-white hover:text-[#E4002B] text-white py-6 rounded-3xl font-black italic text-2xl tracking-tighter shadow-2xl shadow-[#E4002B]/30 transition-all flex items-center justify-center gap-4 group active:scale-95"
                    >
                        <CreditCard className="w-6 h-6" />
                        <span>CLICK TO PAY</span>
                        <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentBill;
