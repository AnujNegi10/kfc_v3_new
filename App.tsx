/// <reference types="vite/client" />
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { Mic, MicOff, AlertCircle, ShoppingBag, Flame, Sparkles, X, ChevronRight, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Category, Product, CartItem } from './types';
import { MENU_ITEMS, CATEGORIES } from './constants';
import Header from './components/Header';
import VoiceWaveform from './components/VoiceWaveform';
import CartSidebar from './components/CartSidebar';
import { encode, decode, decodeAudioData } from './utils/audio';
import MenuPage from './components/MenuPage';
import ProductCard from './components/ProductCard';
import PaymentBill from './components/PaymentBill';


type UIStage = 'IDLE' | 'MENU_PICKER' | 'UPSELL' | 'CART' | 'BILL';

const addToCartFunction: FunctionDeclaration = {
  name: 'addToCart',
  parameters: {
    type: Type.OBJECT,
    description: 'Adds an item to the shopping cart.',
    properties: {
      productId: {
        type: Type.STRING,
        description: 'The unique ID (e.g., "20", "1") or the name of the product. Users see these IDs as #ID on the menu cards. Always use this tool immediately if the user asks for a specific item.'
      },
      quantity: { type: Type.NUMBER, description: 'How many items to add. Defaults to 1.' }
    },
    required: ['productId']
  }
};

const removeFromCartFunction: FunctionDeclaration = {
  name: 'removeFromCart',
  parameters: {
    type: Type.OBJECT,
    description: 'Removes an item from the shopping cart.',
    properties: {
      productId: { type: Type.STRING, description: 'The unique ID or name of the product to remove.' },
      quantity: { type: Type.NUMBER, description: 'How many to remove. If not specified, removes 1.' }
    },
    required: ['productId']
  }
};

const showCategoryFunction: FunctionDeclaration = {
  name: 'showCategory',
  parameters: {
    type: Type.OBJECT,
    description: 'Shows items in the center of the screen. Always call this when the user asks for products.',
    properties: {
      category: { type: Type.STRING, enum: CATEGORIES, description: 'The category to display. Defaults to All.' },
      type: { type: Type.STRING, enum: ['veg', 'non_veg'], description: 'Filter by veg or non_veg.' },
      maxPrice: { type: Type.NUMBER, description: 'Filter by maximum price.' }
    },
    required: ['category']
  }
};

const clearCartFunction: FunctionDeclaration = {
  name: 'clearCart',
  parameters: {
    type: Type.OBJECT,
    description: 'Clears all items from the bucket.',
    properties: {},
  }
};

const showOffersFunction: FunctionDeclaration = {
  name: 'showOffers',
  parameters: {
    type: Type.OBJECT,
    description: 'Shows all available combos, buckets, and special offers. Use this when the user says they are finished, want to checkout, or ask for deals.',
    properties: {},
  }
};

const closeMenuFunction: FunctionDeclaration = {
  name: 'closeMenu',
  parameters: {
    type: Type.OBJECT,
    description: 'Closes any open menu or offer component and returns to the idle state. Use this when the user is done or wants to hide the menu.',
    properties: {},
  }
};

const checkoutFunction: FunctionDeclaration = {
  name: 'checkout',
  parameters: {
    type: Type.OBJECT,
    description: 'Call this when the user is done ordering and wants to pay or see the final bill. This shows the final summary.',
    properties: {},
  }
};

const App: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeStage, setActiveStage] = useState<UIStage>('IDLE');
  const [displayCategory, setDisplayCategory] = useState<Category>('All');
  const [vegFilter, setVegFilter] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [status, setStatus] = useState<'idle' | 'listening' | 'speaking' | 'error'>('idle');
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<Product[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handleAddToCartRef = useRef<any>(null);
  const handleRemoveFromCartRef = useRef<any>(null);
  const handleClearCartRef = useRef<any>(null);

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + (Number(i.price) * i.quantity), 0), [cart]);
  const cartRef = useRef<CartItem[]>([]);
  useEffect(() => { cartRef.current = cart; }, [cart]);

  const [isHovering, setIsHovering] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(true);

  // Fetch products from DB
  const fetchProducts = useCallback(async (cat: string, type: string | null, maxPrice: number | null) => {
    setLoading(true);
    try {
      let url = `http://localhost:8000/api/products?category=${cat}`;
      if (type) url += `&type=${type}`;
      if (maxPrice) url += `&max_price=${maxPrice}`;

      const res = await fetch(url);
      const data = await res.json();
      if (!data.error) {
        setProducts(data);
        productsRef.current = data;
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeStage === 'MENU_PICKER') {
      fetchProducts(displayCategory, vegFilter, priceFilter);
    }
  }, [displayCategory, vegFilter, priceFilter, activeStage, fetchProducts]);

  // Auto-scroll logic for the Menu Picker
  useEffect(() => {
    let interval: any;
    let direction: 'down' | 'up' = 'down';

    if (activeStage === 'MENU_PICKER' && scrollRef.current && !loading && !isHovering) {
      interval = setInterval(() => {
        if (scrollRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

          // Only scroll if there's overflow
          if (scrollHeight <= clientHeight) return;

          if (direction === 'down') {
            if (scrollTop + clientHeight >= scrollHeight - 2) {
              direction = 'up';
            } else {
              scrollRef.current.scrollBy({ top: 1, behavior: 'auto' });
            }
          } else {
            if (scrollTop <= 2) {
              direction = 'down';
            } else {
              scrollRef.current.scrollBy({ top: -2, behavior: 'auto' });
            }
          }
        }
      }, 30);
    }
    return () => clearInterval(interval);
  }, [activeStage, loading, isHovering, products]);

  const handleAddToCart = useCallback((product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => String(item.id) === String(product.id));
      if (existing) {
        return prev.map(item => String(item.id) === String(product.id) ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...product, quantity }];
    });

    // Cart update logic only. Stage management is handled by AI tools.
  }, [cart]);

  const handleRemoveFromCart = useCallback((productId: string, quantity?: number) => {
    setCart(prev => {
      const existing = prev.find(item =>
        String(item.id).toLowerCase() === productId.toLowerCase() ||
        item.name.toLowerCase() === productId.toLowerCase()
      );

      if (existing) {
        // If no quantity specified, or quantity to remove >= current quantity, remove entire item
        if (quantity === undefined || existing.quantity <= quantity) {
          return prev.filter(item => item.id !== existing.id);
        }
        // Otherwise decrement
        return prev.map(item => item.id === existing.id ? { ...item, quantity: item.quantity - quantity } : item);
      }
      return prev;
    });
  }, []);

  const handleClearCart = useCallback(() => {
    setCart([]);
  }, []);

  useEffect(() => {
    handleAddToCartRef.current = handleAddToCart;
    handleRemoveFromCartRef.current = handleRemoveFromCart;
    handleClearCartRef.current = handleClearCart;
  }, [handleAddToCart, handleRemoveFromCart, handleClearCart]);

  const stopVoiceSession = async () => {
    // Stop all playing audio sources
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) { /* already stopped */ }
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    // Close the Gemini session
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) { console.warn('Session close error:', e); }
      sessionRef.current = null;
    }

    // Stop all microphone tracks to release the mic
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close input AudioContext
    if (audioContextRef.current) {
      try { await audioContextRef.current.close(); } catch (e) { /* already closed */ }
      audioContextRef.current = null;
    }

    // Close output AudioContext
    if (outputAudioContextRef.current) {
      try { await outputAudioContextRef.current.close(); } catch (e) { /* already closed */ }
      outputAudioContextRef.current = null;
    }

    setIsVoiceActive(false);
    setStatus('idle');
    console.log('[Cleanup] Voice session fully stopped and all resources released.');
  };

  const startVoiceSession = async () => {
    if (isVoiceActive) { await stopVoiceSession(); return; }

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        console.error("VITE_GEMINI_API_KEY is not set");
        setStatus('error');
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsVoiceActive(true);
            setStatus('listening');
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.toolCall) {
              const functionResponses = [];
              for (const fc of message.toolCall.functionCalls) {
                let response = "ok";
                if (fc.name === 'addToCart') {
                  const rawInput = (fc.args.productId as string)?.toUpperCase() || "";
                  const inputId = rawInput.replace(/\s+and\s+/g, ' & ');
                  const searchStr = inputId.toLowerCase();

                  // Search in current products (using ref for latest data)
                  let product = productsRef.current.find(m =>
                    String(m.id).toLowerCase() === searchStr ||
                    m.name.toLowerCase() === searchStr
                  );

                  if (!product) {
                    product = productsRef.current.find(m =>
                      m.name.toLowerCase().includes(searchStr) ||
                      searchStr.includes(m.name.toLowerCase())
                    );
                  }

                  // DB Search Fallback: Use fuzzy search endpoint
                  if (!product) {
                    try {
                      console.log(`[AI] Product "${inputId}" not in view. Fuzzy searching DB...`);
                      const res = await fetch(`http://localhost:8000/api/products/search?q=${encodeURIComponent(inputId)}`);
                      const searchData = await res.json();

                      if (searchData && Array.isArray(searchData) && searchData.length > 0) {
                        // CRITICAL: If there's an EXACT name match, use it immediately and skip ambiguity
                        const exactMatch = searchData.find((item: any) => item.name.toUpperCase() === inputId.toUpperCase());

                        if (exactMatch) {
                          product = exactMatch;
                          console.log(`[AI] Exact fuzzy match found: ${product.name}`);
                        } else if (searchData.length > 1 && searchData.length <= 4) {
                          const options = searchData.map((item: any) => item.name).join(', ');
                          response = `I found multiple versions: ${options}. Please ask the user which one they would like to add.`;
                          console.log(`[AI-Tool] Ambiguity found: ${options}`);
                          // No product set, so AI will react to the response string
                        } else {
                          // Pick top match
                          product = searchData[0];
                          console.log(`[AI] Using top match: ${product.name}`);
                        }
                      } else {
                        console.log(`[AI] No fuzzy match found for "${inputId}"`);
                        response = `Sorry, I couldn't find a product matching "${inputId}".`;
                      }
                    } catch (err) {
                      console.error("Fuzzy search failed", err);
                      response = "Error searching for product.";
                    }
                  }

                  if (product) {
                    const qtyToAdd = (fc.args.quantity as number) || 1;

                    // 1. Update the actual cart state
                    if (handleAddToCartRef.current) {
                      handleAddToCartRef.current(product, qtyToAdd);
                    }

                    // 2. Calculate the NEW bucket for the immediate AI response
                    let newBucket: CartItem[] = [];
                    const existingIdx = cartRef.current.findIndex(item => String(item.id) === String(product!.id));

                    if (existingIdx > -1) {
                      newBucket = cartRef.current.map((item, idx) =>
                        idx === existingIdx ? { ...item, quantity: item.quantity + qtyToAdd } : item
                      );
                    } else {
                      newBucket = [...cartRef.current, { ...product, quantity: qtyToAdd }];
                    }

                    const newTotal = newBucket.reduce((s, i) => s + (Number(i.price) * i.quantity), 0);
                    response = `Added ${product.name}. Entire Bucket now: ${newBucket.map(i => `${i.quantity}x ${i.name}`).join(', ')}. Total: ₹${newTotal}.`;
                    console.log(`[AI-Tool] addToCart: Updated Total ₹${newTotal}`, newBucket);

                    // CRITICAL: Synchronously update the ref so the next tool call in this loop has the latest data
                    cartRef.current = newBucket;
                  } else {
                    response = `Sorry, I couldn't find a product matching "${inputId}".`;
                  }
                } else if (fc.name === 'removeFromCart') {
                  const inputId = (fc.args.productId as string)?.toLowerCase();
                  const qtyToRemove = fc.args.quantity as number;

                  if (handleRemoveFromCartRef.current) {
                    handleRemoveFromCartRef.current(inputId, qtyToRemove);

                    // Synchronously calculate for response
                    const existing = cartRef.current.find(item =>
                      String(item.id).toLowerCase() === inputId ||
                      item.name.toLowerCase() === inputId
                    );

                    let newBucket: CartItem[] = cartRef.current;
                    if (existing) {
                      if (!qtyToRemove || existing.quantity <= qtyToRemove) {
                        newBucket = cartRef.current.filter(item => item.id !== existing.id);
                      } else {
                        newBucket = cartRef.current.map(item =>
                          item.id === existing.id ? { ...item, quantity: item.quantity - qtyToRemove } : item
                        );
                      }
                    }

                    const newTotal = newBucket.reduce((s, i) => s + (Number(i.price) * i.quantity), 0);
                    response = `Removed ${inputId}. Total: ₹${newTotal}.`;
                    console.log(`[AI-Tool] removeFromCart: Total ${newTotal}`, newBucket);

                    // CRITICAL: Synchronously update the ref
                    cartRef.current = newBucket;
                  } else {
                    response = "Error removing item.";
                  }
                } else if (fc.name === 'clearCart') {
                  if (handleClearCartRef.current) handleClearCartRef.current();
                  cartRef.current = []; // CRITICAL sync
                  response = "Bucket cleared. Total: ₹0.";
                  console.log(`[AI-Tool] clearCart: Total 0`);
                } else if (fc.name === 'showCategory') {
                  const cat = (fc.args.category || 'All') as Category;
                  const type = fc.args.type as string;
                  const maxPrice = fc.args.maxPrice as number;

                  setDisplayCategory(cat);
                  setVegFilter(type || null);
                  setPriceFilter(maxPrice || null);
                  setActiveStage('MENU_PICKER');
                  response = `Showing ${cat}.`;
                } else if (fc.name === 'showOffers') {
                  setDisplayCategory('epic_saver');
                  setVegFilter(null);
                  setPriceFilter(null);
                  setActiveStage('MENU_PICKER');
                  response = "Here are our epic saver deals!";
                } else if (fc.name === 'closeMenu') {
                  setActiveStage('IDLE');
                  response = "Closing the menu.";
                } else if (fc.name === 'checkout') {
                  const currentTotal = cartRef.current.reduce((s, item) => s + (Number(item.price) * item.quantity), 0);
                  let suggestion = "";

                  try {
                    // Try to fetch Epic Saver items to compare
                    const res = await fetch(`http://localhost:8000/api/products?category=epic_saver`);
                    const saverItems = await res.json();

                    if (saverItems && Array.isArray(saverItems) && saverItems.length > 0) {
                      // Find items close to currentTotal (e.g. difference <= 50)
                      const closeItems = saverItems.filter(item => {
                        const diff = Math.abs(item.price - currentTotal);
                        // Suggest if it's slightly more expensive but better value, or very close in price
                        return diff > 0 && diff <= 50;
                      });

                      if (closeItems.length > 0) {
                        const bestItem = closeItems[0];
                        suggestion = ` Wait! Your total is ₹${currentTotal}. You can get the "${bestItem.name}" for just ₹${bestItem.price}, which is almost the same! Want to add it instead?`;
                      }
                    }
                  } catch (err) {
                    console.error("Epic Saver matching failed:", err);
                  }

                  setActiveStage('BILL');
                  response = `Proceeding to checkout. Total: ₹${currentTotal}. Here is your final bill summary.${suggestion}`;
                }
                functionResponses.push({
                  id: fc.id,
                  name: fc.name,
                  response: { result: response }
                });
              }
              if (functionResponses.length > 0) {
                sessionPromise.then(s => s.sendToolResponse({ functionResponses }));
              }
            }
            if (message.serverContent?.outputTranscription) {
              setTranscription(prev => prev + message.serverContent!.outputTranscription!.text);
            }
            if (message.serverContent?.turnComplete) setTranscription('');

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              setStatus('speaking');
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setStatus('listening');
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onerror: () => { setStatus('error'); stopVoiceSession(); },
          onclose: () => stopVoiceSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are the KFC India Smart Voice Assistant.
        The UI is a minimalist immersive terminal.

        PERSONA AND IDENTITY
        - You are a FEMALE Indian assistant with an energetic, warm, and witty personality.
        - Feminine first-person Hindi verbs ALWAYS.
          - Correct: "dikhati hoon", "karti hoon", "deti hoon", "bata sakti hoon", "suggest karungi", "khol deti hoon".
          - Forbidden: "dikhaunga", "karta hoon", "kar deta hoon", "bolunga" — masculine forms are strictly forbidden.
        - ADDRESS: Do NOT try to detect gender from voice. Always use neutral terms like "aap", "ji", or no honorific. Never use "Sir" or "Ma'am" unless the user explicitly tells you their gender or name.

        LANGUAGE MIRRORING (CRITICAL — EVERY SINGLE TURN)
        - You MUST reply in the EXACT SAME language the user used in their CURRENT message. Not the previous message. Not the first message. The CURRENT one.
        - If user says something in Hindi → your reply MUST be in Hindi.
        - If user says something in English → your reply MUST be in English.
        - If user says something in Hinglish → your reply MUST be in Hinglish.
        - If user switches from Hindi to English mid-conversation, you switch to English IMMEDIATELY in that same reply.
        - If user switches from English to Hindi mid-conversation, you switch to Hindi IMMEDIATELY in that same reply.
        - Product names can stay in English regardless of language, but the sentence framing must match the user's language.
        - SELF-CHECK EVERY TURN: "What language did the user just speak? Am I replying in that exact language?" If not, fix it before responding.
        - Feminine grammar applies to all Hindi/Hinglish responses without exception.
        - All responses must be grammatically correct — no broken phrasing in any language.

        NAMING CONVENTION
        - Always write '&' instead of 'and' in product names (e.g., "Burger & Pepsi Meal", "Rice & Gravy").

        KNOWLEDGE AND CART RULES
        - TOTAL PRICE RULE (ABSOLUTE — ZERO EXCEPTIONS):
          * After every tool call (addToCart, removeFromCart, checkout), you receive a response containing: "Total: ₹Y."
          * You MUST extract the number after "Total: ₹" and speak EXACTLY that number. 
          * BATCHED CALLS: If the user adds multiple items at once (e.g., "Add 2 Pepsi and 1 Burger"), you will call the tool multiple times. You receive multiple responses. You MUST ONLY speak the total from the VERY LAST RESPONSE of the turn. Ignore previous totals.
          * If a tool response is missing the total (e.g. error or product not found), do NOT mention any total or price in your reply.
          * NEVER do arithmetic. NEVER guess. NEVER use your own memory of past prices. The latest tool response is the ONLY source of truth.
          * NEVER apologize for a wrong total. Just read the one from the tool.

        - QUANTITY: Default to 1 unless the user specifies otherwise.
        - GRAMMAR: Every response must be grammatically clean and natural in its language.

        SPECIAL HANDLING

        1. KIDS AND FAMILY CONTEXT:
          - If user mentions ordering for children or asks what is good for kids in any language, infer that children prefer non-spicy and mild options.
          - Recommend accordingly without being asked. Suggest items like Chicken Strips, Popcorn Chicken, Soft Serve, etc.
          - Frame it naturally: explain that spicy items are for adults and you are picking the gentler options for the little ones.

        2. COMPETITOR PRODUCT SCOPING:
          - If user asks about a product from another brand such as McDonald's, Domino's, Burger King, or Subway, politely decline with personality.
          - Never acknowledge competitor superiority.
          - Redirect immediately to the closest relevant KFC category using showCategory().
          - Your response should feel warm and playful, not dismissive — make them excited about KFC's equivalent instead.
        3. - EXACT INTENT MATCHING: If the user asks for a generic item (e.g., "Pepsi", "water", "fries") that exists as a standalone product, always add the standalone item — never substitute a combo or bundled dish that contains that item. If multiple sizes exist (small, medium, large), ask the user to clarify the size before adding. Do not infer a combo unless the user explicitly asks for one.
        
        CRITICAL RESPONSE TRIGGERS

        1. GREETING:
          - ACTION: Immediately call showCategory(category="All").
          - Respond with a warm, brand-appropriate welcome in the user's LOCKED language.

        2. COMBO UPSELL — DYNAMIC AND VARIED:
          - Trigger A: User adds 2 or more of the same item (quantity >= 2).
          - Trigger B: Cart contains Burger or Chicken plus Fries or Snack plus Drink.
          - DO NOT call showCategory() immediately. Instead, verbally suggest the combo/meal idea and ASK the user: "Would you like me to show you some combos/meals?"
          - Only call showCategory(category="Combo") or showCategory(category="Meal") AFTER the user says yes.
          - CREATIVE RULE: Every time this trigger fires, you MUST compose a fresh, original line on the spot. Do not use a template. Do not repeat any previous upsell line from the same session. The tone can be playful, clever, excited, or friendly — vary it each time.
          - CONFIRMATION RULE: Always ask the user before showing anything or adding anything. Act only after they confirm.

        3. MISSING DRINK AT CHECKOUT:
          - If cart has food but no beverage, flag it before proceeding.
          - DO NOT call showCategory() immediately. Instead, verbally mention it and ASK the user: "Should I show you the drinks menu?"
          - Only call showCategory(category="Beverages") AFTER the user says yes.
          - CREATIVE RULE: Compose a fresh, original line every time this fires — never repeat. React naturally, like a friend who just noticed something.

        4. MISSING DESSERT SUGGESTION:
          - Suggest a dessert toward the end of the order if none is in the cart.
          - DO NOT call showCategory() immediately. Instead, verbally suggest it and ASK the user: "Want me to show you some desserts?"
          - Only call showCategory(category="Desserts") AFTER the user says yes.
          - CREATIVE RULE: Write an original, in-the-moment line. Do not reuse previous dessert suggestions. Frame it as a genuine, enthusiastic recommendation — not a scripted upsell.

          GOLDEN RULE FOR TRIGGERS 2, 3, AND 4: NEVER forcefully open the menu popup. Always ASK first, then show only if the user agrees. Your phrasing should feel like it was composed right now for this specific customer. Variety in structure, vocabulary, and emotional tone is the goal.

        5. CHECKOUT SUMMARY:
          - Trigger: User says "I'm done", "Place my order", "Show me the bill", or confirms they are finished.
          - ACTION: Call checkout().
          - Before calling checkout, deliver a clear order summary in the user's language. List every item with quantity and individual price. State the final total clearly. Then confirm you are placing the order.

        6. RECOMMENDATIONS:
          - For vague requests such as "suggest something" or "kuch accha dikhao", call showCategory(category="All").
          - You may ask Veg or Non-Veg preference after showing the menu, not before.
          - For kids, default to non-spicy and mild options without asking.

        INTERACTION ROBUSTNESS
        - If user names a specific product, call addToCart() immediately — no unnecessary clarifying questions.
        - If user names MULTIPLE products (e.g., "2 Pepsi, 3 Mojito, 5 Burgers"), you MUST call addToCart() multiple times in the same turn, once for each unique product mentioned.
        - If user asks for a category, call showCategory() immediately. Veg or Non-Veg clarification can come after.
        - Never withhold the menu to ask filter questions first.
        - Call showOffers() only for explicit deal, offer, or saver requests or during checkout.
        - Never just talk — always pair your response with a UI action: showCategory, addToCart, showOffers, or checkout.

        PRODUCT NAME RULES:
        - Just pass the product name as spoken by the user. The backend does smart fuzzy matching.
        - Do NOT modify or guess product names. Pass the user's words directly.
        - Use '&' instead of 'and' in product names.

        MENU CATEGORIES:
        ${CATEGORIES.join(', ')}`,
          tools: [
            { functionDeclarations: [addToCartFunction, removeFromCartFunction, showCategoryFunction, clearCartFunction, showOffersFunction, closeMenuFunction, checkoutFunction] }
          ],
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } } }
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      setStatus('error');
    }
  };

  const currentMenuItems = MENU_ITEMS.filter(item => {
    if (displayCategory === 'All') return true;
    if (displayCategory === 'Offers') return item.category === 'Combos' || item.category === 'Buckets';
    return item.category === displayCategory;
  });

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#181a1b] text-white relative flex flex-col font-inter">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#E4002B22_0%,_transparent_60%)] opacity-40" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
      </div>

      <Header
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onCartToggle={() => setActiveStage(activeStage === 'CART' ? 'IDLE' : 'CART')}
        isVoiceActive={isVoiceActive}
      />
      <AnimatePresence>
        {showMainMenu && (
          <motion.div
            key="main-menu"
            initial={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[100]"
          >
            <MenuPage
              onAddToCart={handleAddToCart}
              onStartAI={() => {
                setShowMainMenu(false);
                startVoiceSession();
              }}
            />
          </motion.div>
        )}

      </AnimatePresence>

      <main className={`flex-1 relative flex flex-col items-center justify-center p-6 z-10 transition-all duration-700 ${isVoiceActive ? 'mr-[400px]' : ''}`}>

        <AnimatePresence mode="wait">
          {activeStage === 'IDLE' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center text-center"
            >
              <div className="relative mb-12">
                <motion.div
                  animate={{ scale: isVoiceActive ? [1, 1.4, 1] : 1, opacity: isVoiceActive ? [0.2, 0.4, 0.2] : 0.1 }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-[-60px] rounded-full bg-[#E4002B] blur-[100px]"
                />
                <button
                  onClick={startVoiceSession}
                  className={`relative w-40 h-40 rounded-[2.5rem] bg-[#181a1b] border border-white/10 flex items-center justify-center shadow-2xl transition-all duration-700 ${isVoiceActive ? 'border-[#E4002B]/50' : 'hover:border-white/20'}`}
                >
                  <div className="flex gap-1 items-end h-10">
                    {[1, 2, 3, 4, 5].map(i => (
                      <motion.div
                        key={i}
                        animate={{ height: isVoiceActive ? [8, 32, 8] : 8 }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                        className={`w-1.5 rounded-full ${isVoiceActive ? 'bg-[#E4002B]' : 'bg-white/10'}`}
                      />
                    ))}
                  </div>
                </button>
              </div>
              <h1 className="text-2xl md:text-2xl font-black italic tracking-tighter mb-4 opacity-80">
                {isVoiceActive ? "LISTENING..." : "KFC AI AGENT"}
              </h1>
              {transcription && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-medium italic tracking-tight"
                >
                  "{transcription}"
                </motion.div>
              )}
            </motion.div>
          )}

          {activeStage === 'MENU_PICKER' && (
            <motion.div
              key="picker"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-5xl bg-[#181a1b]/80 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-8 shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#E4002B] flex items-center justify-center shadow-lg shadow-[#E4002B]/20">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black italic tracking-tighter text-white">
                      KFC {displayCategory.toUpperCase()}
                    </h2>
                    <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Menu</p>
                  </div>
                </div>
                <button onClick={() => setActiveStage('IDLE')} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-5 h-5 text-white/20" />
                </button>
              </div>

              <div
                ref={scrollRef}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                className="grid grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar transition-all"
              >
                {products.length === 0 && !loading && (
                  <div className="col-span-4 text-center py-10 text-white/20 italic">No products found matching filters.</div>
                )}
                {products.map((item) => (
                  <ProductCard
                    key={item.id}
                    product={item}
                    onAdd={handleAddToCart}
                  />
                ))}
              </div>
              <div className="mt-8 pt-4 border-t border-white/5 text-center">
                <p className="text-[10px] text-white/20 uppercase font-bold tracking-[0.3em]">Say "Add Classic Zinger" or "Show Buckets"</p>
              </div>
            </motion.div>
          )}

          {activeStage === 'CART' && (
            <motion.div
              key="cart"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="w-full max-w-md bg-[#0A0A0A] border border-[#E4002B]/30 rounded-[2.5rem] p-10 shadow-[0_0_100px_rgba(228,0,43,0.15)] text-center relative overflow-hidden"
            >
              <motion.div
                animate={{ y: [-100, 400] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#E4002B] to-transparent z-0 opacity-40"
              />

              <div className="relative z-10">
                <div className="w-20 h-20 bg-[#E4002B] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-[#E4002B]/30">
                  <ShoppingBag className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-black italic tracking-tighter mb-2">ITEM ADDED</h3>
                <p className="text-white/40 text-sm mb-8 font-medium">Updating your bucket in real-time...</p>

                <div className="space-y-3 mb-8">
                  {cart.slice(-2).map((item, i) => (
                    <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={`${item.id}-${i}`} className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
                      <span className="text-xs font-bold">{item.name}</span>
                      <span className="text-xs font-black text-[#E4002B]">₹{item.price}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="text-3xl font-black italic tracking-tighter">
                  TOTAL: ₹{cartTotal}
                </div>
              </div>
            </motion.div>
          )}

          {activeStage === 'UPSELL' && (
            <motion.div
              key="upsell"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-xl w-full bg-[#E4002B] p-1 bg-gradient-to-br from-[#E4002B] to-black rounded-[3rem]"
            >
              <div className="bg-[#181a1b] rounded-[2.9rem] p-12 text-center overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <ShoppingBag className="w-32 h-32 -rotate-12" />
                </div>
                <div className="bg-[#E4002B]/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Flame className="w-8 h-8 text-[#E4002B]" />
                </div>
                <h3 className="text-4xl font-black italic tracking-tighter mb-4">EPIC SAVER OFFER</h3>
                <p className="text-white/60 mb-8 max-w-xs mx-auto text-sm leading-relaxed">Your order is eligible for the <span className="text-white font-bold text-lg block">Epic Saver Combo</span> upgrade at just <span className="text-[#E4002B] font-black">₹299</span>.</p>

                <div className="flex gap-4 relative z-10">
                  <button onClick={() => setActiveStage('IDLE')} className="flex-1 py-4 text-white/40 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors">No Thanks</button>
                  <button onClick={() => {
                    const combo = MENU_ITEMS.find(i => i.id === 'co2');
                    if (combo) {
                      setCart(prev => [...prev, { ...combo, quantity: 1 }]);
                      setActiveStage('CART');
                      setTimeout(() => setActiveStage('IDLE'), 3000);
                    }
                  }} className="flex-1 py-4 bg-[#E4002B] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[#E4002B]/20">ADD COMBO</button>
                </div>
              </div>
            </motion.div>
          )}
          {activeStage === 'BILL' && (
            <PaymentBill
              items={cart}
              onPay={() => {
                setCart([]);
                stopVoiceSession();
                setShowMainMenu(true);
                setActiveStage('IDLE');
                setIsVoiceActive(false);
              }}
            />

          )}
        </AnimatePresence>
      </main>

      {/* Floating Status Bar */}
      <footer className={`h-24 px-12 flex items-center justify-between z-20 pointer-events-none transition-all duration-700 ${isVoiceActive ? 'mr-[400px]' : ''}`}>
        <div className="flex items-center gap-6 pointer-events-auto">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-1">Status</span>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${status === 'listening' ? 'bg-[#E4002B] animate-pulse' : 'bg-white/20'}`} />
              <span className="text-xs font-black italic tracking-tighter">{status.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-10 pointer-events-auto">
          <VoiceWaveform active={status === 'listening' || status === 'speaking'} />

          <div className="h-12 w-px bg-white/10" />

          <button onClick={() => setActiveStage('CART')} className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-1">Bucket Total</span>
            <span className="text-2xl font-black italic tracking-tighter text-[#E4002B]">₹{cartTotal}</span>
          </button>
        </div>
      </footer>

      <CartSidebar
        items={cart}
        isOpen={isVoiceActive && activeStage !== 'BILL'}
        onRemove={(id) => handleRemoveFromCart(id, 1)}
        onAdd={(product) => handleAddToCart(product, 1)}
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
        body { overflow: hidden; background: #181a1b; }
        @keyframes drift { from { transform: translateY(0); } to { transform: translateY(-50%); } }
      `}</style>
    </div>
  );
};

export default App;
