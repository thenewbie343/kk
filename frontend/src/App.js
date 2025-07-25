import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Minus, X, Coffee, Cookie, Clock, Mail, Phone, User, CheckCircle, Smartphone, Download, BarChart3, Users, DollarSign } from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Context for Cart
const CartContext = createContext();

const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (item) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      getTotalItems,
      getTotalPrice,
      clearCart,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};

const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

// PWA Install Button Component
const PWAInstallButton = () => {
  const [showInstall, setShowInstall] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      setInstallPrompt(null);
      setShowInstall(false);
    }
  };

  if (!showInstall || !installPrompt) return null;

  return (
    <motion.button
      onClick={handleInstallClick}
      className="fixed bottom-20 right-4 bg-amber-500 text-white p-3 rounded-full shadow-lg hover:bg-amber-600 z-50"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <Download size={20} />
    </motion.button>
  );
};

// Offline Detection Component
const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 z-50"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      📡 You're offline - Orders will sync when connected
    </motion.div>
  );
};

// Floating Cart Component
const FloatingCart = () => {
  const { cart, getTotalItems, isCartOpen, setIsCartOpen } = useCart();
  const totalItems = getTotalItems();

  if (totalItems === 0) return null;

  return (
    <motion.div
      className="fixed top-4 right-4 z-50"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <motion.button
        onClick={() => setIsCartOpen(true)}
        className="bg-amber-500 text-white p-4 rounded-full shadow-lg hover:bg-amber-600 relative"
        animate={{ rotate: totalItems > 0 ? [0, -10, 10, 0] : 0 }}
        transition={{ duration: 0.5 }}
      >
        <ShoppingCart size={24} />
        <motion.span
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          key={totalItems}
        >
          {totalItems}
        </motion.span>
      </motion.button>
    </motion.div>
  );
};

// Cart Modal
const CartModal = () => {
  const { 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    updateQuantity, 
    removeFromCart, 
    getTotalPrice 
  } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl p-6 max-w-md w-full max-h-96 overflow-y-auto glassmorphism"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Your Cart</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Your cart is empty</p>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {cart.map((item) => (
                    <motion.div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{item.name}</h3>
                        <p className="text-amber-600 font-bold">${item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 hover:bg-red-100 text-red-500 rounded"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xl font-bold">Total:</span>
                    <span className="text-xl font-bold text-amber-600">
                      ${getTotalPrice().toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Navigation Component
const Navigation = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <motion.nav 
      className="fixed top-0 left-0 right-0 bg-white bg-opacity-95 backdrop-blur-md z-40 shadow-sm"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <motion.h1 
            className="text-xl md:text-2xl font-bold text-amber-600 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/')}
          >
            Artisan Bakery & Café
          </motion.h1>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-6">
            {[
              { name: 'Home', path: '/' },
              { name: 'Café', path: '/cafe' },
              { name: 'Bakery', path: '/bakery' },
              { name: 'Admin', path: '/admin' }
            ].map((item) => (
              <motion.button
                key={item.name}
                onClick={() => navigate(item.path)}
                className="text-gray-700 hover:text-amber-600 font-medium transition-colors"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {item.name}
              </motion.button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <div className="w-6 h-6 flex flex-col justify-around">
              <span className="w-full h-0.5 bg-gray-800"></span>
              <span className="w-full h-0.5 bg-gray-800"></span>
              <span className="w-full h-0.5 bg-gray-800"></span>
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="md:hidden mt-4 py-4 border-t"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {[
                { name: 'Home', path: '/' },
                { name: 'Café', path: '/cafe' },
                { name: 'Bakery', path: '/bakery' },
                { name: 'Admin', path: '/admin' }
              ].map((item) => (
                <motion.button
                  key={item.name}
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 text-gray-700 hover:text-amber-600 font-medium"
                  whileTap={{ scale: 0.95 }}
                >
                  {item.name}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

// Floating Animation Component
const FloatingElement = ({ children, delay = 0 }) => (
  <motion.div
    animate={{
      y: [0, -20, 0],
      rotate: [0, 5, -5, 0]
    }}
    transition={{
      duration: 6,
      repeat: Infinity,
      delay
    }}
  >
    {children}
  </motion.div>
);

// Home Page Component
const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1509042239860-f550ce710b93)',
            filter: 'brightness(0.4)'
          }}
        />
        
        {/* Floating Elements */}
        <FloatingElement delay={0}>
          <div className="absolute top-20 left-10 md:left-20 text-4xl md:text-6xl">🥐</div>
        </FloatingElement>
        <FloatingElement delay={1}>
          <div className="absolute top-40 right-16 md:right-32 text-3xl md:text-5xl">☕</div>
        </FloatingElement>
        <FloatingElement delay={2}>
          <div className="absolute bottom-40 left-20 md:left-40 text-3xl md:text-4xl">🧁</div>
        </FloatingElement>
        <FloatingElement delay={3}>
          <div className="absolute bottom-32 right-10 md:right-20 text-4xl md:text-5xl">🍞</div>
        </FloatingElement>

        <div className="relative z-10 text-center text-white px-4">
          <motion.h1
            className="text-4xl md:text-6xl lg:text-8xl font-bold mb-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            Freshly Baked
          </motion.h1>
          
          <motion.h2
            className="text-2xl md:text-3xl lg:text-5xl font-light mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            Every Day
          </motion.h2>

          <motion.p
            className="text-lg md:text-xl mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            Experience the perfect blend of traditional baking and modern café culture. 
            Artisan breads, pastries, and specialty coffee crafted with passion.
          </motion.p>

          <motion.div
            className="space-y-4 md:space-y-0 md:space-x-6 md:flex md:justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.9 }}
          >
            <motion.button
              onClick={() => navigate('/cafe')}
              className="w-full md:w-auto bg-amber-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-amber-600 transition-colors flex items-center justify-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Coffee size={24} />
              <span>Explore Café</span>
            </motion.button>
            
            <motion.button
              onClick={() => navigate('/bakery')}
              className="w-full md:w-auto bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-gray-800 transition-colors flex items-center justify-center space-x-2 mt-4 md:mt-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Cookie size={24} />
              <span>Visit Bakery</span>
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto px-6">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-800"
            data-aos="fade-up"
          >
            Why Choose Artisan?
          </motion.h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🌾",
                title: "Premium Ingredients",
                description: "We source only the finest organic flours, Belgian chocolates, and fresh local ingredients."
              },
              {
                icon: "👨‍🍳",
                title: "Master Bakers",
                description: "Our skilled artisans bring decades of traditional baking expertise to every creation."
              },
              {
                icon: "⏰",
                title: "Fresh Daily",
                description: "Everything is baked fresh daily, ensuring the highest quality and taste."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="text-center p-6 md:p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow tilt-card"
                data-aos="fade-up"
                data-aos-delay={index * 200}
                whileHover={{ y: -10 }}
              >
                <div className="text-4xl md:text-6xl mb-4">{feature.icon}</div>
                <h3 className="text-xl md:text-2xl font-bold mb-4 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Our Bakery Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div data-aos="fade-right">
              <img
                src="https://images.unsplash.com/photo-1534432182912-63863115e106"
                alt="Fresh artisan breads"
                className="rounded-2xl shadow-2xl w-full h-96 object-cover"
              />
            </motion.div>
            <motion.div data-aos="fade-left">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
                🍞 Artisan Bakery
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                Every morning at 4 AM, our master bakers begin the ancient ritual of bread making. 
                Using traditional techniques passed down through generations, we craft each loaf 
                with patience, precision, and passion.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🌾</div>
                  <div>
                    <h4 className="font-bold text-gray-800">Freshly Baked Breads</h4>
                    <p className="text-gray-600 text-sm">Sourdough, multigrain, ciabatta - baked fresh daily</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🥐</div>
                  <div>
                    <h4 className="font-bold text-gray-800">Flaky Croissants</h4>
                    <p className="text-gray-600 text-sm">Buttery, golden croissants with 72-hour fermentation</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🧁</div>
                  <div>
                    <h4 className="font-bold text-gray-800">Artisan Pastries</h4>
                    <p className="text-gray-600 text-sm">Danish, éclairs, and seasonal specialties</p>
                  </div>
                </div>
              </div>

              <motion.button
                onClick={() => navigate('/bakery')}
                className="bg-amber-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-amber-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                View Bakery Menu
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Our Café Section */}
      <section className="py-20 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div data-aos="fade-right" className="order-2 md:order-1">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
                ☕ Specialty Café
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                Our café is where comfort meets sophistication. From expertly crafted coffee 
                to hearty savory items, we serve soul-warming food that brings people together. 
                Every cup is brewed to perfection, every bite made with love.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">☕</div>
                  <div>
                    <h4 className="font-bold text-gray-800">Premium Coffee</h4>
                    <p className="text-gray-600 text-sm">Single-origin beans, expert roasting, perfect brewing</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🥪</div>
                  <div>
                    <h4 className="font-bold text-gray-800">Fresh Patties & Sandwiches</h4>
                    <p className="text-gray-600 text-sm">Savory meat patties, veggie burgers, gourmet sandwiches</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🍰</div>
                  <div>
                    <h4 className="font-bold text-gray-800">Sweet Treats</h4>
                    <p className="text-gray-600 text-sm">Cakes, muffins, cookies - perfect with your coffee</p>
                  </div>
                </div>
              </div>

              <motion.button
                onClick={() => navigate('/cafe')}
                className="bg-amber-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-amber-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Explore Café Menu
              </motion.button>
            </motion.div>

            <motion.div data-aos="fade-left" className="order-1 md:order-2">
              <img
                src="https://images.unsplash.com/photo-1509042239860-f550ce710b93"
                alt="Specialty café beverages"
                className="rounded-2xl shadow-2xl w-full h-96 object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Daily Specials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <motion.div className="text-center mb-16" data-aos="fade-up">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Today's Special Delights
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Every day brings new flavors and fresh creations. Here's what our chefs 
              are excited to share with you today.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                emoji: "🍖",
                title: "Spiced Meat Patties",
                description: "Juicy beef patties seasoned with our secret blend of spices, served on fresh brioche buns",
                time: "Available all day",
                price: "$8.99"
              },
              {
                emoji: "🌱",
                title: "Garden Veggie Burger",
                description: "House-made veggie patty with quinoa, black beans, and fresh herbs. Served with avocado",
                time: "Lunch special",
                price: "$7.99"
              },
              {
                emoji: "🥖",
                title: "Fresh Sourdough Loaf",
                description: "Our signature sourdough with a perfect crust and tangy, airy interior. Baked this morning",
                time: "Limited quantity",
                price: "$6.50"
              }
            ].map((special, index) => (
              <motion.div
                key={index}
                className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow"
                data-aos="fade-up"
                data-aos-delay={index * 200}
                whileHover={{ y: -5 }}
              >
                <div className="text-5xl mb-4">{special.emoji}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{special.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{special.description}</p>
                <div className="space-y-2">
                  <p className="text-amber-600 font-semibold">{special.time}</p>
                  <p className="text-2xl font-bold text-gray-800">{special.price}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Process Section */}
      <section className="py-20 bg-gradient-to-r from-amber-100 to-orange-100">
        <div className="container mx-auto px-6">
          <motion.div className="text-center mb-16" data-aos="fade-up">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              From Dawn to Delight
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Every day at Artisan Bakery & Café begins before sunrise. Here's how we create 
              the magic that ends up on your plate.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                time: "4:00 AM",
                title: "Dough Preparation",
                description: "Our bakers start mixing, kneading, and shaping tomorrow's bread",
                icon: "👨‍🍳"
              },
              {
                time: "6:00 AM", 
                title: "Fresh Baking",
                description: "Ovens fire up, filling the air with the aroma of fresh bread and pastries",
                icon: "🔥"
              },
              {
                time: "8:00 AM",
                title: "Café Opens",
                description: "First coffee is brewed, patties are prepared, doors open to welcome you",
                icon: "☕"
              },
              {
                time: "All Day",
                title: "Continuous Quality", 
                description: "Fresh batches throughout the day, ensuring everything is at its peak",
                icon: "✨"
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                className="text-center"
                data-aos="fade-up"
                data-aos-delay={index * 200}
                whileHover={{ scale: 1.05 }}
              >
                <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-3xl">{step.icon}</span>
                </div>
                <div className="bg-amber-500 text-white py-1 px-3 rounded-full text-sm font-semibold mb-3 inline-block">
                  {step.time}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <motion.div className="text-center mb-16" data-aos="fade-up">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-gray-600 text-lg">
              Don't just take our word for it - hear from our happy customers!
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                rating: "★★★★★",
                text: "The best croissants in town! Flaky, buttery, and always fresh. Their coffee is exceptional too.",
                item: "Regular customer"
              },
              {
                name: "Mike Chen", 
                rating: "★★★★★",
                text: "I come here every morning for their meat patties. Perfectly seasoned and always cooked to perfection!",
                item: "Café enthusiast"
              },
              {
                name: "Emma Davis",
                rating: "★★★★★", 
                text: "The sourdough bread is absolutely divine. You can taste the love and craftsmanship in every bite.",
                item: "Bread lover"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-gray-50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                data-aos="fade-up"
                data-aos-delay={index * 200}
                whileHover={{ y: -5 }}
              >
                <div className="text-amber-500 text-xl mb-3">{testimonial.rating}</div>
                <p className="text-gray-700 italic mb-4 leading-relaxed">"{testimonial.text}"</p>
                <div className="border-t pt-4">
                  <p className="font-bold text-gray-800">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.item}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PWA Installation Prompt */}
      <section className="py-16 bg-amber-50 text-center">
        <div className="container mx-auto px-6">
          <motion.div
            className="max-w-2xl mx-auto"
            data-aos="fade-up"
          >
            <Smartphone className="mx-auto text-amber-600 mb-4" size={48} />
            <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
              Get Our Mobile App!
            </h3>
            <p className="text-gray-600 mb-6 text-sm md:text-base">
              Install our app for faster ordering, offline access, and exclusive mobile offers.
              Works on all devices - no app store required!
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle size={20} />
                <span className="text-sm">Works offline</span>
              </div>
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle size={20} />
                <span className="text-sm">Fast & secure</span>
              </div>
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle size={20} />
                <span className="text-sm">Always up to date</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

// Menu Item Component
const MenuItem = ({ item }) => {
  const { addToCart } = useCart();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleAddToCart = () => {
    const cartItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category
    };
    
    addToCart(cartItem);
    
    // If offline, store in pending orders
    if (!isOnline) {
      const pendingOrders = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
      pendingOrders.push({
        id: Date.now(),
        data: cartItem,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('pendingOrders', JSON.stringify(pendingOrders));
    }
  };

  return (
    <motion.div
      className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow tilt-card"
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
      
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg md:text-xl font-bold text-gray-800">{item.name}</h3>
          <span className="text-xl md:text-2xl font-bold text-amber-600">${item.price.toFixed(2)}</span>
        </div>
        
        <p className="text-gray-600 mb-4 leading-relaxed text-sm md:text-base">{item.description}</p>
        
        {item.ingredients && item.ingredients.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">Ingredients:</p>
            <div className="flex flex-wrap gap-1">
              {item.ingredients.map((ingredient, index) => (
                <span
                  key={index}
                  className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full"
                >
                  {ingredient}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <motion.button
          onClick={handleAddToCart}
          className="w-full bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors flex items-center justify-center space-x-2 disabled:bg-gray-400"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={!isOnline && !item.available}
        >
          <Plus size={20} />
          <span>{isOnline ? 'Add to Cart' : 'Add (Offline)'}</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

// Café Page Component
const Cafe = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCafeMenu = async () => {
      try {
        const response = await fetch(`${API}/menu/cafe`);
        const data = await response.json();
        setMenuItems(data);
      } catch (error) {
        console.error('Error fetching cafe menu:', error);
        // Load from cache if available
        const cached = localStorage.getItem('cafe-menu');
        if (cached) {
          setMenuItems(JSON.parse(cached));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCafeMenu();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section 
        className="h-64 md:h-96 flex items-center justify-center relative"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1447933601403-0c6688de566e)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40" />
        <div className="relative z-10 text-center text-white px-4">
          <motion.h1
            className="text-3xl md:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            ☕ Café Menu
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Expertly crafted beverages for every taste
          </motion.p>
        </div>
      </section>

      {/* Menu Grid */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {menuItems.map((item, index) => (
              <div key={item.id} data-aos="fade-up" data-aos-delay={index * 100}>
                <MenuItem item={item} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// Bakery Page Component
const Bakery = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBakeryMenu = async () => {
      try {
        const response = await fetch(`${API}/menu/bakery`);
        const data = await response.json();
        setMenuItems(data);
      } catch (error) {
        console.error('Error fetching bakery menu:', error);
        // Load from cache if available
        const cached = localStorage.getItem('bakery-menu');
        if (cached) {
          setMenuItems(JSON.parse(cached));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBakeryMenu();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section 
        className="h-64 md:h-96 flex items-center justify-center relative"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1534432182912-63863115e106)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40" />
        <div className="relative z-10 text-center text-white px-4">
          <motion.h1
            className="text-3xl md:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            🥖 Bakery Menu
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Freshly baked artisan breads and pastries
          </motion.p>
        </div>
      </section>

      {/* Menu Grid */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {menuItems.map((item, index) => (
              <div key={item.id} data-aos="fade-up" data-aos-delay={index * 100}>
                <MenuItem item={item} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// Admin Panel Component
const AdminPanel = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [ordersResponse, statsResponse] = await Promise.all([
        fetch(`${API}/admin/orders`),
        fetch(`${API}/admin/stats`)
      ]);
      
      if (ordersResponse.ok && statsResponse.ok) {
        setOrders(await ordersResponse.json());
        setStats(await statsResponse.json());
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`${API}/admin/orders/export`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bakery_orders.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your bakery orders and view analytics</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'orders', label: 'Orders', icon: ShoppingCart }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <motion.div
                className="bg-white p-6 rounded-2xl shadow-lg"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.total_orders || 0}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <ShoppingCart className="text-blue-600" size={24} />
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-white p-6 rounded-2xl shadow-lg"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Today's Orders</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.today_orders || 0}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <Users className="text-green-600" size={24} />
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-white p-6 rounded-2xl shadow-lg"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Today's Revenue</p>
                    <p className="text-2xl font-bold text-gray-800">${(stats.today_revenue || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-amber-100 p-3 rounded-full">
                    <DollarSign className="text-amber-600" size={24} />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
                <button
                  onClick={handleExportCSV}
                  className="bg-amber-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-600 transition-colors flex items-center space-x-2"
                >
                  <Download size={18} />
                  <span>Export CSV</span>
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Order ID</th>
                      <th className="text-left py-3 px-2">Customer</th>
                      <th className="text-left py-3 px-2">Items</th>
                      <th className="text-left py-3 px-2">Total</th>
                      <th className="text-left py-3 px-2">Pickup Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats.recent_orders || []).map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2 font-medium">#{order.id.substring(0, 8)}</td>
                        <td className="py-3 px-2">{order.customer_name}</td>
                        <td className="py-3 px-2 text-sm">
                          {order.items.slice(0, 2).map(item => item.name).join(', ')}
                          {order.items.length > 2 && `... +${order.items.length - 2} more`}
                        </td>
                        <td className="py-3 px-2 font-semibold text-amber-600">${order.total_amount.toFixed(2)}</td>
                        <td className="py-3 px-2 text-sm">{new Date(order.pickup_time).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">All Orders ({orders.length})</h2>
              <button
                onClick={handleExportCSV}
                className="bg-amber-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-600 transition-colors flex items-center space-x-2"
              >
                <Download size={18} />
                <span>Export CSV</span>
              </button>
            </div>

            <div className="space-y-4">
              {orders.map((order) => (
                <motion.div
                  key={order.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-bold text-lg">#{order.id.substring(0, 8)}</h3>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                          {order.status || 'Pending'}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Customer:</span> {order.customer_name}</p>
                        <p><span className="font-medium">Email:</span> {order.customer_email}</p>
                        <p><span className="font-medium">Phone:</span> {order.customer_phone}</p>
                        <p><span className="font-medium">Pickup:</span> {new Date(order.pickup_time).toLocaleString()}</p>
                        <p><span className="font-medium">Ordered:</span> {new Date(order.order_date).toLocaleString()}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Items Ordered:</h4>
                      <div className="space-y-1 text-sm">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{item.quantity}x {item.name}</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t mt-2 pt-2">
                        <div className="flex justify-between font-bold">
                          <span>Total:</span>
                          <span className="text-amber-600">${order.total_amount.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      {order.special_requests && (
                        <div className="mt-2">
                          <p className="text-sm"><span className="font-medium">Special Requests:</span></p>
                          <p className="text-sm text-gray-600 italic">{order.special_requests}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
const Checkout = () => {
  const { cart, getTotalPrice, clearCart } = useCart();
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    pickup_time: '',
    special_requests: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const orderData = {
      ...formData,
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category
      })),
      total_amount: getTotalPrice()
    };

    try {
      if (isOnline) {
        const response = await fetch(`${API}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(orderData)
        });

        if (response.ok) {
          const order = await response.json();
          setOrderDetails(order);
          setOrderSubmitted(true);
          clearCart();
        }
      } else {
        // Store offline order
        const offlineOrder = {
          id: Date.now().toString(),
          ...orderData,
          offline: true,
          timestamp: new Date().toISOString()
        };
        
        const pendingOrders = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
        pendingOrders.push({ id: offlineOrder.id, data: offlineOrder });
        localStorage.setItem('pendingOrders', JSON.stringify(pendingOrders));
        
        setOrderDetails(offlineOrder);
        setOrderSubmitted(true);
        clearCart();
      }
    } catch (error) {
      console.error('Error submitting order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0 && !orderSubmitted) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">Your cart is empty</h2>
          <button
            onClick={() => navigate('/')}
            className="bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-600"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (orderSubmitted && orderDetails) {
    return (
      <div className="min-h-screen pt-20 bg-gradient-to-b from-green-50 to-white">
        <div className="container mx-auto px-6 py-12">
          <motion.div
            className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
              </motion.div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                Order {orderDetails.offline ? 'Saved' : 'Confirmed'}!
              </h1>
              <p className="text-gray-600">
                {orderDetails.offline 
                  ? 'Order saved offline - will sync when connected' 
                  : 'Thank you for your order. We\'ll have it ready for pickup!'
                }
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 md:p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Order Details</h2>
              <div className="space-y-2 mb-4 text-sm md:text-base">
                <p><span className="font-semibold">Order ID:</span> {orderDetails.id}</p>
                <p><span className="font-semibold">Name:</span> {orderDetails.customer_name}</p>
                <p><span className="font-semibold">Email:</span> {orderDetails.customer_email}</p>
                <p><span className="font-semibold">Phone:</span> {orderDetails.customer_phone}</p>
                <p><span className="font-semibold">Pickup Time:</span> {orderDetails.pickup_time}</p>
              </div>

              <h3 className="font-bold text-gray-800 mb-3">Items Ordered:</h3>
              <div className="space-y-2">
                {orderDetails.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm md:text-base">
                    <span>{item.quantity}x {item.name}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>${orderDetails.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => navigate('/')}
                className="bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center">
            Complete Your Order
          </h1>
          
          {!isOnline && (
            <div className="mb-6 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
              <p className="text-yellow-800 text-sm">
                📡 You're offline. Your order will be saved and processed when you're back online.
              </p>
            </div>
          )}
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg h-fit">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b text-sm md:text-base">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-gray-500 ml-2">x{item.quantity}</span>
                    </div>
                    <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg md:text-xl font-bold">
                  <span>Total:</span>
                  <span className="text-amber-600">${getTotalPrice().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Checkout Form */}
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Your Information</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-1">
                    <User size={16} />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm md:text-base"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-1">
                    <Mail size={16} />
                    <span>Email</span>
                  </label>
                  <input
                    type="email"
                    name="customer_email"
                    value={formData.customer_email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm md:text-base"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-1">
                    <Phone size={16} />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    name="customer_phone"
                    value={formData.customer_phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm md:text-base"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-1">
                    <Clock size={16} />
                    <span>Pickup Time</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="pickup_time"
                    value={formData.pickup_time}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm md:text-base"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    name="special_requests"
                    value={formData.special_requests}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm md:text-base"
                    placeholder="Any special instructions..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 disabled:bg-gray-400 transition-colors"
                >
                  {isSubmitting ? 'Processing...' : isOnline ? 'Place Order' : 'Save Order (Offline)'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Page Transition Component
const PageTransition = ({ children }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -300 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Main App Component
function App() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      offset: 100
    });
  }, []);

  return (
    <CartProvider>
      <div className="App">
        <BrowserRouter>
          <Navigation />
          <OfflineIndicator />
          <FloatingCart />
          <PWAInstallButton />
          <CartModal />
          
          <PageTransition>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/cafe" element={<Cafe />} />
              <Route path="/bakery" element={<Bakery />} />
              <Route path="/checkout" element={<Checkout />} />
            </Routes>
          </PageTransition>
        </BrowserRouter>
      </div>
    </CartProvider>
  );
}

export default App;