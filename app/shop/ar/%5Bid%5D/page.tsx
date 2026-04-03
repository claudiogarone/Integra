'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../../utils/supabase/client'
import { useParams } from 'next/navigation'
import { ShoppingCart, Share2, Maximize2, ShieldCheck, ArrowLeft } from 'lucide-react'

// Import Model Viewer via script per garantire compatibilità WebXR/QuickLook
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

export default function PublicARPage() {
    const { id } = useParams()
    const [product, setProduct] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchProduct = async () => {
            const { data, error } = await supabase.from('ecommerce_products').select('*').eq('id', id).single()
            if (!error) setProduct(data)
            setLoading(false)
        }
        fetchProduct()
    }, [id])

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
            <div className="w-12 h-12 border-4 border-teal-500 border-t-white rounded-full animate-spin mb-4"></div>
            <p className="font-bold uppercase tracking-widest text-xs">Carimento Esperienza AR...</p>
        </div>
    )

    if (!product || !product.ar_model_url) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-10 text-center">
            <ShieldCheck size={48} className="text-red-500 mb-6 opacity-50"/>
            <h1 className="text-2xl font-black mb-2">Modello Non Disponibile</h1>
            <p className="text-gray-400 text-sm max-w-xs">Questo prodotto non è abilitato per la realtà aumentata o il link è scaduto.</p>
            <button onClick={() => window.history.back()} className="mt-8 bg-white text-black px-6 py-3 rounded-full font-bold flex items-center gap-2"><ArrowLeft size={18}/> Torna allo Shop</button>
        </div>
    )

    return (
        <div className="flex flex-col min-h-screen bg-black overflow-hidden relative font-sans">
            
            {/* SCRIPT MODEL VIEWER (CDN) */}
            <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js"></script>

            <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
                <button onClick={() => window.history.back()} className="bg-black/40 backdrop-blur-md text-white p-3 rounded-full border border-white/20 shadow-xl hover:bg-black/60 transition"><ArrowLeft size={20}/></button>
                <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-xl flex flex-col">
                    <span className="text-[9px] font-black text-teal-400 uppercase tracking-widest leading-none">IntegraAR Experience</span>
                    <span className="text-xs font-bold text-white truncate max-w-[150px]">{product.name}</span>
                </div>
            </div>

            <div className="absolute top-6 right-6 z-20">
                <button className="bg-black/40 backdrop-blur-md text-white p-3 rounded-full border border-white/20 shadow-xl hover:bg-black/60 transition"><Share2 size={20}/></button>
            </div>

            {/* AREA 3D / AR VIEWER */}
            <div className="flex-1 relative flex items-center justify-center">
                <model-viewer
                    src={product.ar_model_url}
                    ar
                    ar-modes="webxr scene-viewer quick-look"
                    camera-controls
                    poster={product.image_url}
                    shadow-intensity="2"
                    exposure="1"
                    environment-image="neutral"
                    auto-rotate
                    style={{ width: '100%', height: '100%', '--poster-color': 'transparent' }}
                >
                    <button slot="ar-button" className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-teal-500 text-white px-10 py-5 rounded-full font-black text-lg shadow-[0_10px_30px_rgba(20,184,166,0.5)] flex items-center gap-3 hover:scale-105 transition duration-300">
                        <Maximize2 size={24}/> INQUADRA NEL TUO SPAZIO
                    </button>

                    <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-white/40 text-[9px] font-black uppercase tracking-widest pointer-events-none">
                        Ruota per esplorare in 3D
                    </div>
                </model-viewer>
            </div>

            {/* BARRA INFO PRODOTTO FLOATING */}
            <div className="p-8 pb-10 bg-gradient-to-t from-black via-black/90 to-transparent relative z-10">
                <div className="max-w-2xl mx-auto">
                    <div className="flex justify-between items-end mb-6">
                        <div className="flex-1">
                            <span className="text-teal-400 font-black text-[10px] uppercase tracking-[0.2em]">{product.category}</span>
                            <h2 className="text-3xl font-black text-white leading-tight mt-1">{product.name}</h2>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-400 text-[10px] uppercase font-bold">Prezzo Suggerito</p>
                            <p className="text-teal-400 font-black text-4xl">€{Number(product.price).toLocaleString('it-IT')}</p>
                        </div>
                    </div>
                    
                    <p className="text-gray-400 text-sm leading-relaxed mb-8 line-clamp-3">{product.description}</p>

                    <div className="flex gap-4">
                        <button className="flex-1 bg-white text-black py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-teal-50 transition shadow-xl"><ShoppingCart size={18}/> ACQUISTA ORA</button>
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-6 rounded-2xl">
                             <ShieldCheck size={18} className="text-teal-400"/>
                             <div className="flex flex-col">
                                 <span className="text-[8px] font-black text-white/30 uppercase tracking-tighter">Powered by</span>
                                 <span className="text-[10px] font-bold text-white/80">IntegraOS Vision</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                model-viewer {
                    background-color: transparent;
                }
                .dot {
                    display: block;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    border: none;
                    background-color: #14b8a6;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
                }
            `}</style>
        </div>
    )
}
