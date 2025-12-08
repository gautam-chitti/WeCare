import React, { useState, useEffect } from 'react';
import { ShoppingCart, Pill, Plus, Check, FileText, BadgePercent, CreditCard, ArrowRight, X, MapPin } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { PrivacyMask } from './PrivacyMask';
import axios from 'axios';
import { getValidImageUrl } from '../utils/imageUrl';

export const PharmacyView: React.FC = () => {
    const { width, height } = useWindowSize();
    const [showConfetti, setShowConfetti] = useState(false);
    const [cart, setCart] = useState<any[]>([]);
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDelivery, setShowDelivery] = useState(false);

    useEffect(() => {
        const fetchPrescriptions = async () => {
            try {
                const res = await axios.get('/api/prescriptions', {
                     headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setPrescriptions(res.data);
            } catch (error) {
                console.error("Failed to fetch prescriptions", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPrescriptions();
    }, []);

    const addToCart = (meds: any[], prescriptionId: number) => {
        // Map backend medicine format to cart item
        const newItems = meds.map(m => ({
            ...m,
            price: Math.floor(Math.random() * 20) + 5, // Mock price
            prescriptionId
        }));
        
        // Avoid duplicates
        const uniqueItems = newItems.filter(item => !cart.find(c => c.name === item.name && c.prescriptionId === prescriptionId));
        
        if (uniqueItems.length > 0) {
            setCart([...cart, ...uniqueItems]);
        }
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        
        // Mock order functionality - in reality we would loop through unique prescription IDs and call /order endpoint
        // For demo, we just animate
        setShowDelivery(true);
        setShowConfetti(true);
        
        // Clear cart after delay
        setTimeout(() => {
            setCart([]);
            setShowConfetti(false);
        }, 5000);
    };
    
    const cartTotal = cart.reduce((acc, item) => acc + item.price, 0);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 lg:space-y-8 animate-fade-in relative min-h-[80vh]">
            {showConfetti && <Confetti width={width} height={height} numberOfPieces={200} recycle={false} />}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
                <div className="w-full md:w-auto">
                   <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">WeCare Pharmacy</h1>
                   <p className="text-slate-400">Order medicines directly from your prescriptions.</p>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-xl border border-white/5 mx-auto md:mx-0">
                    <MapPin className="w-5 h-5 text-cyan-400" />
                    <div className="text-sm text-left">
                        <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider">Delivering To</span>
                        <span className="text-white font-medium">Your Registered Address</span>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Prescriptions Column */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-emerald-500" />
                        My Prescriptions
                    </h2>
                    
                    {loading ? (
                        <div className="text-slate-500 text-center py-10">Loading prescriptions...</div>
                    ) : prescriptions.length === 0 ? (
                        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-8 text-center">
                            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">No Prescriptions Found</h3>
                            <p className="text-slate-400">Prescriptions sent by your doctor will appear here.</p>
                        </div>
                    ) : (
                        prescriptions.map((rx) => (
                            <div key={rx.id} className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 hover:bg-slate-800/50 transition-colors group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20">#{rx.id}</span>
                                        <span className="text-slate-400 text-sm">{new Date(rx.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white max-w-md">{rx.doctor?.name || "Unknown Doctor"}</h3>
                                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                                        <Building className="w-3 h-3" /> 
                                        {rx.pharmacyName}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => addToCart(rx.medicines, rx.id)}
                                    // Disable if all meds from this rx are already in cart
                                    disabled={rx.medicines.every((m: any) => cart.find(c => c.name === m.name && c.prescriptionId === rx.id))}
                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-bold rounded-xl transition-all flex items-center gap-2 text-sm"
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    {rx.medicines.every((m: any) => cart.find(c => c.name === m.name && c.prescriptionId === rx.id)) ? 'Added' : 'Order All'}
                                </button>
                            </div>
                            
                            <div className="space-y-3">
                                {rx.medicines.map((med: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-slate-950/30 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                <Pill className="w-4 h-4 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm">{med.name}</p>
                                                <p className="text-xs text-slate-500">{med.dosage} • {med.duration}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                           </div>
                        </div>
                    )))}
                    
                    {/* Promo Banner */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 p-6 md:p-8">
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Get 20% off your first order!</h3>
                                <p className="text-indigo-100">Use code <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded">WECARE20</span> at checkout.</p>
                            </div>
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                                <BadgePercent className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        {/* Background Deco */}
                         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    </div>
                </div>

                {/* Shopping Cart Side Panel */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-emerald-500" />
                            Your Cart
                        </h2>
                        
                        {cart.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShoppingCart className="w-6 h-6 text-slate-600" />
                                </div>
                                <p className="text-slate-500 font-medium">Your cart is empty</p>
                                <p className="text-xs text-slate-600 mt-1">Add medicines from your prescriptions</p>
                            </div>
                        ) : (
                            <>
                            <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                                {cart.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center group">
                                         <div>
                                             <p className="text-sm font-bold text-white">{item.name}</p>
                                             <p className="text-xs text-slate-500">Qty: 1</p>
                                         </div>
                                         <div className="flex items-center gap-3">
                                             <span className="text-sm font-bold text-emerald-400">${item.price.toFixed(2)}</span>
                                             <button 
                                                onClick={() => setCart(cart.filter((_, idx) => idx !== i))}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-all"
                                             >
                                                 <X className="w-4 h-4" />
                                             </button>
                                         </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="border-t border-white/10 pt-4 space-y-3">
                                <div className="flex justify-between text-slate-400 text-sm">
                                    <span>Subtotal</span>
                                    <span>${cartTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-slate-400 text-sm">
                                    <span>Delivery Fee</span>
                                    <span>$2.99</span>
                                </div>
                                <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-white/5">
                                    <span>Total</span>
                                    <span>${(cartTotal + 2.99).toFixed(2)}</span>
                                </div>
                                
                                <button 
                                    onClick={handleCheckout}
                                    className="w-full py-4 mt-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    Checkout <ArrowRight className="w-4 h-4" />
                                </button>
                                <p className="text-[10px] text-center text-slate-500 mt-2">
                                    Secure Payment by <span className="font-bold">Stripe Mock</span>
                                </p>
                            </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Delivery Overlay */}
            {showDelivery && (
                 <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md animate-fade-in">
                      <div className="relative w-full max-w-2xl text-center p-8">
                           {/* Road/Path */}
                           <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -translate-y-1/2 overflow-hidden">
                               <div className="w-20 h-full bg-emerald-500 blur-sm animate-[shimmer_2s_infinite]"></div>
                           </div>
                           
                           {/* Truck Animation */}
                           <div className="relative z-10 mb-8 animate-[drive_3s_ease-in-out_infinite]">
                                <img 
                                    src={getValidImageUrl('delvan.png')} 
                                    alt="Delivery Truck" 
                                    className="w-48 md:w-64 mx-auto object-contain drop-shadow-[0_20px_50px_rgba(16,185,129,0.3)]"
                                />
                           </div>

                           <div className="relative z-10 space-y-4 animate-fade-in-up">
                                <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">Order On Its Way!</h2>
                                <p className="text-xl text-emerald-400 font-medium">Estimated Delivery: 25 Minutes</p>
                                <p className="text-slate-500">Your medicines are being dispatched from <span className="text-white">HealthFirst Pharmacy</span> to your registered address.</p>
                                
                                <button 
                                    onClick={() => setShowDelivery(false)}
                                    className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors backdrop-blur-sm border border-white/10"
                                >
                                    Back to Pharmacy
                                </button>
                           </div>
                      </div>
                 </div>
            )}
            
            {/* Success Success Overlay */}
            {showConfetti && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
                      <div className="bg-slate-900 p-8 rounded-3xl border border-emerald-500/30 text-center shadow-2xl max-w-sm mx-4 transform animate-scale-in">
                           <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/40">
                               <Check className="w-10 h-10 text-slate-900 stroke-3" />
                           </div>
                           <h3 className="text-2xl font-bold text-white mb-2">Order Confirmed!</h3>
                           <p className="text-slate-400 mb-6">Your medicines are on the way. Expected delivery: <span className="text-white font-bold">Tomorrow, 2 PM</span>.</p>
                           <button onClick={() => setShowConfetti(false)} className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors">
                               Close
                           </button>
                      </div>
                 </div>
            )}
            
            <style>{`
                @keyframes drive {
                    0% { transform: translateX(-20px) rotate(-1deg); }
                    50% { transform: translateX(20px) rotate(1deg); }
                    100% { transform: translateX(-20px) rotate(-1deg); }
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(500%); }
                }
            `}</style>
        </div>
    );
};

function Building({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
            <path d="M9 22v-4h6v4"/>
            <path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
        </svg>
    )
}
