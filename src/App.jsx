import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabaseClient'; 
import './App.css';
import MenuDashboard from './components/MenuDashboard'; 
import OrderManagement from './components/OrderManagement'; 
import MyOrders from './components/MyOrders';
import SettingsManagement from './components/SettingsManagement';
import ProfileManagement from './components/ProfileManagement';
import CheckoutModal from './components/CheckoutModal';
import ReportsDashboard from './components/ReportsDashboard';
import UserManagement from './components/UserManagement';
import POSView from './components/POSView';
import CustomerManagement from './components/CustomerManagement';
import PromotionManagement from './components/PromotionManagement';
import KitchenDisplay from './components/KitchenDisplay';
import WhatsAppDashboard from './components/WhatsAppDashboard';

// --- Ícones (SVGs) ---
const MenuIcon = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg> );
const UserIcon = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> );
const ShoppingBagIcon = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-2Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> );
const LogInIcon = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg> );
const SettingsIcon = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2.4l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1 0 2.4l.15-.08a2 2 0 0 0 .73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V4a2 2 0 0 0-2-2.02z"/><circle cx="12" cy="12" r="3"/></svg> );
const ClipboardListIcon = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg> );
const UtensilsCrossedIcon = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.4 1.4a3 3 0 0 0 4.2 0L22 8"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"/><path d="m2.1 2.1 6.4 6.4"/></svg> );
const HistoryIcon = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg> );
const SearchIcon = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> );
const LogOutIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);
const BarChartIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>);
const UsersIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const HardDriveIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/></svg>);
const Users2Icon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 19a6 6 0 0 0-12 0"/><circle cx="8" cy="10" r="4"/><path d="M22 19a6 6 0 0 0-6-6 4 4 0 1 0 0-8"/></svg>);
const TagIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>);
const ChefHatIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 21a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2Z"/><path d="M5 10V8c0-3.87 3.13-7 7-7s7 3.13 7 7v2"/><path d="M12 10v11"/></svg>);
const MessageCircleIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>);


// --- Componente de Autenticação em Modal ---
const AuthModal = ({ isOpen, onClose, storeName }) => {
    const [loading, setLoading] = useState(false); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
    if (!isOpen) return null;
    const handleLogin = async (e) => { e.preventDefault(); setLoading(true); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) alert(error.error_description || error.message); else onClose(); setLoading(false); };
    const handleSignUp = async (e) => { e.preventDefault(); setLoading(true); const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: `Cliente ${email.split('@')[0]}`, role: 'customer' } } }); if (error) alert(error.error_description || error.message); else { alert('Cadastro realizado! Verifique seu email para confirmar a conta antes de fazer login.'); onClose(); } setLoading(false); };
  return ( <div className="cart-modal-overlay modal-overlay-centered" onClick={onClose}> <div className="login-card" style={{height: 'auto'}} onClick={(e) => e.stopPropagation()}> <UtensilsCrossedIcon className="icon-large" style={{ color: 'var(--primary-color)' }}/> <h2>{storeName}</h2> <p>Para continuar, acesse sua conta ou crie um novo cadastro.</p> <form className="login-form"> <input type="email" placeholder="seu-email@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} /> <input type="password" placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} /> <div className="login-actions"> <button onClick={handleLogin} className="btn btn-customer" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button> <button onClick={handleSignUp} className="btn btn-admin" disabled={loading}>{loading ? 'Cadastrando...' : 'Criar Conta'}</button> </div> </form> </div> </div> );
};

// --- Painel de Administração ---
const AdminDashboard = ({ storeName, session, logoUrl }) => {
    const [activeTab, setActiveTab] = useState('orders');
    const handleLogout = async () => { await supabase.auth.signOut(); };
    const renderContent = () => { 
        switch(activeTab) { 
            case 'orders': return <OrderManagement />; 
            case 'cozinha': return <KitchenDisplay session={session} />;
            case 'whatsapp': return <WhatsAppDashboard session={session} />;
            case 'menu': return <MenuDashboard />; 
            case 'promotions': return <PromotionManagement />; 
            case 'reports': return <ReportsDashboard />; 
            case 'customers': return <CustomerManagement />; 
            case 'users': return <UserManagement />; 
            case 'pdv': return <POSView session={session} />; 
            case 'settings': return <SettingsManagement />; 
            default: return null; 
        } 
    };
  return ( <div className="admin-layout"> <aside className="sidebar"> <div className="sidebar-header">{logoUrl ? <img src={logoUrl} alt="Logo" /> : <UtensilsCrossedIcon style={{height: '2rem', width: '2rem'}} />}<span>{storeName}</span></div> <nav className="sidebar-nav"> <button onClick={() => setActiveTab('orders')} className={activeTab === 'orders' ? 'active' : ''}><ClipboardListIcon /> Pedidos</button> <button onClick={() => setActiveTab('cozinha')} className={activeTab === 'cozinha' ? 'active' : ''}><ChefHatIcon /> Cozinha</button> <button onClick={() => setActiveTab('whatsapp')} className={activeTab === 'whatsapp' ? 'active' : ''}><MessageCircleIcon /> WhatsApp</button> <button onClick={() => setActiveTab('pdv')} className={activeTab === 'pdv' ? 'active' : ''}><HardDriveIcon /> PDV</button> <button onClick={() => setActiveTab('menu')} className={activeTab === 'menu' ? 'active' : ''}><MenuIcon /> Cardápio</button> <button onClick={() => setActiveTab('promotions')} className={activeTab === 'promotions' ? 'active' : ''}><TagIcon /> Promoções</button> <button onClick={() => setActiveTab('customers')} className={activeTab === 'customers' ? 'active' : ''}><Users2Icon /> Clientes</button> <button onClick={() => setActiveTab('reports')} className={activeTab === 'reports' ? 'active' : ''}><BarChartIcon /> Relatórios</button> <button onClick={() => setActiveTab('users')} className={activeTab === 'users' ? 'active' : ''}><UsersIcon /> Equipa</button> <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'active' : ''}><SettingsIcon /> Configurações</button> </nav> <div className="sidebar-footer"><button onClick={handleLogout}><LogOutIcon /> Sair</button></div> </aside> <main className="main-content">{renderContent()}</main> </div> );
};

// --- Visão do Caixa ---
const CaixaDashboard = ({ storeName, session, logoUrl }) => {
    const [activeView, setActiveView] = useState('pdv');
    const handleLogout = async () => { await supabase.auth.signOut(); };
    const renderContent = () => {
        if (activeView === 'pdv') return <POSView session={session} />;
        if (activeView === 'orders') return <OrderManagement />;
        if (activeView === 'cozinha') return <KitchenDisplay session={session} />;
        return null;
    }
    return ( <div className="admin-layout"> <aside className="sidebar"> <div className="sidebar-header">{logoUrl ? <img src={logoUrl} alt="Logo" /> : <UtensilsCrossedIcon style={{height: '2rem', width: '2rem'}} />}<span>{storeName}</span></div> <nav className="sidebar-nav"> <button onClick={() => setActiveView('pdv')} className={activeView === 'pdv' ? 'active' : ''}><HardDriveIcon /> PDV</button> <button onClick={() => setActiveView('orders')} className={activeView === 'orders' ? 'active' : ''}><ClipboardListIcon /> Pedidos</button> <button onClick={() => setActiveView('cozinha')} className={activeView === 'cozinha' ? 'active' : ''}><ChefHatIcon /> Cozinha</button> </nav> <div className="sidebar-footer"><button onClick={handleLogout}><LogOutIcon /> Sair</button></div> </aside> <main className="main-content">{renderContent()}</main> </div> );
};

// --- Visão da Cozinha ---
const KitchenDashboard = ({ storeName, session, logoUrl }) => {
    const handleLogout = async () => { await supabase.auth.signOut(); };
    return ( <div className="admin-layout"> <aside className="sidebar"> <div className="sidebar-header">{logoUrl ? <img src={logoUrl} alt="Logo" /> : <UtensilsCrossedIcon style={{height: '2rem', width: '2rem'}} />}<span>{storeName}</span></div> <nav className="sidebar-nav"> <button className="active"><ChefHatIcon /> Cozinha</button> </nav> <div className="sidebar-footer"><button onClick={handleLogout}><LogOutIcon /> Sair</button></div> </aside> <main className="main-content"><KitchenDisplay session={session} /></main> </div> );
};

// --- Componente do Carrinho de Compras ---
const ShoppingCartModal = ({ isOpen, onClose, cart, updateCart, onCheckout }) => {
    if (!isOpen) return null;
    const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const handleQuantityChange = (productId, newQuantity) => { if (newQuantity < 1) { updateCart(cart.filter(item => item.id !== productId)); } else { updateCart(cart.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item)); } };
    return ( <div className="cart-modal-overlay" onClick={onClose}> <div className="cart-modal-content" onClick={(e) => e.stopPropagation()}> <div className="cart-header"><h2>Meu Carrinho</h2><button onClick={onClose}>&times;</button></div> <div className="cart-body"> {cart.length === 0 ? <p>Seu carrinho está vazio.</p> : cart.map(item => ( <div key={item.id} className="cart-item"> <div className="cart-item-image" style={{backgroundImage: `url(${item.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center'}} /> <div className="cart-item-details"> <div className="cart-item-info"> <h4>{item.name}</h4> <p>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}</p> </div> <div className="cart-item-actions"> <button onClick={() => handleQuantityChange(item.id, item.quantity - 1)}>-</button> <span>{item.quantity}</span> <button onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>+</button> <button className="cart-item-remove-btn" onClick={() => updateCart(cart.filter(i => i.id !== item.id))}>Remover</button> </div> </div> </div> ))} </div> {cart.length > 0 && ( <div className="cart-footer"> <div className="cart-total"><span>Total</span><span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</span></div> <button onClick={onCheckout} className="btn btn-customer">Continuar</button> </div> )} </div> </div> );
};

// --- Visão Principal (Pública e do Cliente) ---
const MainView = ({ session, profile, storeName, logoUrl, storeSettings, setShowAuthModal, onProfileUpdate }) => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [productsResponse, categoriesResponse, promotionsResponse] = await Promise.all([ 
                supabase.from('products').select('*'), 
                supabase.from('categories').select('*'),
                supabase.from('promotions').select('*').eq('is_active', true)
            ]);
            if (productsResponse.data) setProducts(productsResponse.data);
            if (categoriesResponse.data) setCategories(categoriesResponse.data);
            if (promotionsResponse.data) setPromotions(promotionsResponse.data);
            setLoading(false);
        };
        fetchData();
    }, []);
    
    useEffect(() => {
        if (promotions.length > 1) {
            const timer = setTimeout(() => {
                setCurrentSlide((prevSlide) => (prevSlide + 1) % promotions.length);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [currentSlide, promotions.length]);

    const handleLogout = async () => { await supabase.auth.signOut(); };

    const handleAddToCart = (product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) { return prevCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item); } 
            else { return [...prevCart, { ...product, quantity: 1 }]; }
        });
    };

    const handleCheckout = () => {
        if (!session) { setShowAuthModal(true); return; }
        if (!profile || !profile.address || !profile.phone || !profile.cpf || !profile.full_name || !profile.cep || !profile.number || !profile.neighborhood) {
            alert("Por favor, complete o seu perfil antes de finalizar o pedido.");
            setIsCartOpen(false); setIsProfileOpen(true);
        } else {
            setIsCartOpen(false); setIsCheckoutOpen(true);
        }
    };

    const onOrderPlaced = () => { setCart([]); setIsCheckoutOpen(false); };

    const filteredProducts = products
        .filter(p => {
            if (selectedCategory === 'promotions') return p.is_on_sale;
            return selectedCategory ? p.category_id === selectedCategory : true;
        })
        .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <>
      <ShoppingCartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cart={cart} updateCart={setCart} onCheckout={handleCheckout} />
      {session && <MyOrders isOpen={isMyOrdersOpen} onClose={() => setIsMyOrdersOpen(false)} session={session} />}
      {session && <ProfileManagement isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} session={session} onProfileUpdate={onProfileUpdate} />}
      {session && <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} cart={cart} session={session} storeSettings={storeSettings} onOrderPlaced={onOrderPlaced} />}
      
      <div className="customer-view">
        <header className="customer-header">
          <div className="logo">{logoUrl ? <img src={logoUrl} alt="Logo" /> : <UtensilsCrossedIcon style={{height: '2rem', width: '2rem'}} />}<h1>{storeName}</h1></div>
          <div className="customer-actions">
            {session ? (
              <>
                <button onClick={() => setIsMyOrdersOpen(true)} title="Meus Pedidos"><HistoryIcon /></button>
                <div className="cart-button-wrapper"><button onClick={() => setIsCartOpen(true)} title="Meu Carrinho"><ShoppingBagIcon /></button>{cart.length > 0 && <div className="cart-item-count">{cart.length}</div>}</div>
                <button onClick={() => setIsProfileOpen(true)} title="Meu Perfil"><UserIcon /></button>
                <button onClick={handleLogout} title="Sair"><LogOutIcon /></button>
              </>
            ) : (
                <>
                <div className="cart-button-wrapper"><button onClick={() => setIsCartOpen(true)} title="Meu Carrinho"><ShoppingBagIcon /></button>{cart.length > 0 && <div className="cart-item-count">{cart.length}</div>}</div>
                <button onClick={() => setShowAuthModal(true)} title="Login / Criar Conta"><LogInIcon/></button>
                </>
            )}
          </div>
        </header>
        <main className="customer-main">
          {promotions.length > 0 && (
              <div className="promotions-carousel">
                  <div className="promotions-slider" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                      {promotions.map(promo => (
                          <div key={promo.id} className="promotion-slide">
                              <img src={promo.image_url} alt={promo.title || 'Promoção'} />
                          </div>
                      ))}
                  </div>
              </div>
          )}

          <h2>Nosso Cardápio</h2>
          <p>Escolha entre nossas delícias e faça seu pedido!</p>
          {loading ? <p>Carregando...</p> : (
            <>
              <div className="search-container">
                  <SearchIcon className="search-icon" style={{width: '1.2rem', height: '1.2rem'}}/>
                  <input type="text" placeholder="Pesquisar no cardápio..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="category-filters">
                  <button onClick={() => setSelectedCategory(null)} className={`category-btn ${selectedCategory === null ? 'active' : ''}`}>Todos</button>
                  {storeSettings.show_promotions_section && products.some(p => p.is_on_sale) && (
                      <button onClick={() => setSelectedCategory('promotions')} className={`category-btn ${selectedCategory === 'promotions' ? 'active' : ''}`}>Promoções</button>
                  )}
                  {categories.map(cat => ( <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}>{cat.name}</button> ))}
              </div>
              <div className="menu-grid">
                {filteredProducts.length > 0 ? filteredProducts.map(product => (
                    <div key={product.id} className="menu-item-card">
                       {product.is_on_sale && <div className="promotion-badge">PROMOÇÃO</div>}
                       <div className="item-image-placeholder" style={{backgroundImage: `url(${product.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center'}}>{!product.image_url && 'Imagem do Prato'}</div>
                       <div className="item-details">
                          <h3>{product.name}</h3>
                          <p>{product.description}</p>
                          <div className="item-footer">
                              <div>
                                  {product.is_on_sale ? (
                                      <>
                                          <span className="original-price">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}</span>
                                          <span className="item-price">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.sale_price)}</span>
                                      </>
                                  ) : (
                                      <span className="item-price">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}</span>
                                  )}
                              </div>
                              <button onClick={() => handleAddToCart(product)} className="btn btn-add">Adicionar</button>
                          </div>
                       </div>
                    </div>
                )) : <p>Nenhum produto encontrado.</p>}
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
};

// --- Componente Principal da Aplicação ---
export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [storeSettings, setStoreSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const fetchProfile = useCallback(async (currentSession) => {
    if (!currentSession) { 
      setProfile(null); 
      return; 
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', currentSession.user.id).single();
    setProfile(data);
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        await fetchProfile(session);
      }
      
      const { data: settingsData } = await supabase.from('store_settings').select('*').eq('id', 1).single();
      const currentSettings = settingsData || { store_name: "Sabor Digital", primary_color: '#f59e0b', secondary_color: '#4f46e5' };
      setStoreSettings(currentSettings);

      if (settingsData) {
        document.documentElement.style.setProperty('--primary-color', settingsData.primary_color);
        document.documentElement.style.setProperty('--primary-color-hover', `${settingsData.primary_color}dd`);
        document.documentElement.style.setProperty('--secondary-color', settingsData.secondary_color);
        document.documentElement.style.setProperty('--secondary-color-hover', `${settingsData.secondary_color}dd`);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        setSession(newSession);
        if (newSession) {
          await fetchProfile(newSession);
        } else {
          setProfile(null);
        }
      });
      
      setLoading(false);
      return () => subscription.unsubscribe();
    };
    initializeApp();
  }, [fetchProfile]);

  const storeName = storeSettings?.store_name || "Sabor Digital";
  const logoUrl = storeSettings?.logo_url;

  if (loading) return <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>A carregar...</div>;

  switch (profile?.role) {
    case 'admin':
      return <AdminDashboard session={session} storeName={storeName} logoUrl={logoUrl} />;
    case 'caixa':
      return <CaixaDashboard session={session} storeName={storeName} logoUrl={logoUrl} />;
    case 'garcom':
      return <POSView session={session} />;
    case 'cozinha':
      return <KitchenDashboard session={session} storeName={storeName} logoUrl={logoUrl} />;
    default:
      return (
        <>
          <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} storeName={storeName} />
          <MainView session={session} profile={profile} storeName={storeName} logoUrl={logoUrl} storeSettings={storeSettings} setShowAuthModal={setShowAuthModal} onProfileUpdate={() => fetchProfile(session)} />
        </>
      );
  }
}