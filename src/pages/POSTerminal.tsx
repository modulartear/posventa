import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Product, CartItem, CashRegister, SelectedCustomer } from '../types';
import { useAdmin } from '../contexts/AdminContext';
import { useAuth } from '../contexts/AuthContext';
import ProductCard from '../components/ProductCard';
import Cart from '../components/Cart';
import CheckoutModal from '../components/CheckoutModal';
import CashRegisterClosing from '../components/admin/CashRegisterClosing';
import ProductSelectionModal from '../components/ProductSelectionModal';
import { Search, Store, Power, LogOut } from 'lucide-react';
import { awardPoints } from '../services/points';
import { getCustomerByDni } from '../services/customers';

export default function POSTerminal() {
  const { token } = useParams<{ token: string }>();
  const { companyId } = useAuth();
  const { 
    products,
    cashRegisters,
    sessions,
    getCashRegisterByToken, 
    updateCashRegister,
    addSale,
    startSession,
    getOpenSession 
  } = useAdmin();
  const [cashRegister, setCashRegister] = useState<CashRegister | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showClosing, setShowClosing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    // Wait a bit for data to load from Supabase
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (token && cashRegisters.length > 0 && sessions.length >= 0) {
      const register = getCashRegisterByToken(token);
      console.log('Token recibido:', token);
      console.log('Caja encontrada:', register);
      console.log('Sesiones disponibles:', sessions);
      setCashRegister(register || null);
      setLoading(false);
      
      // Start session if cash register is active and no session exists
      if (register && register.isActive) {
        const existingSession = getOpenSession(register.id);
        console.log('Sesión existente para esta caja:', existingSession);
        if (!existingSession) {
          console.log('No hay sesión, creando una nueva...');
          startSession({
            cashRegisterId: register.id,
            cashRegisterName: register.name,
            employeeId: register.employeeId || '',
            employeeName: register.employeeName,
            openedAt: register.openedAt || new Date(),
            openingBalance: register.openingBalance,
          });
        }
      }
    }
  }, [token, cashRegisters, sessions, getCashRegisterByToken, getOpenSession, startSession]); // Espera a que cashRegisters y sessions se carguen

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Cargando...</h2>
          <p className="text-muted-foreground mt-2">Conectando con la base de datos</p>
        </div>
      </div>
    );
  }

  if (!cashRegister) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-2xl">
          <h1 className="text-3xl font-bold mb-4">Caja no encontrada</h1>
          <p className="text-muted-foreground mb-6">
            El link de acceso no es válido o la caja ha sido eliminada.
          </p>
          
          {/* Debug Info */}
          <div className="bg-gray-100 p-4 rounded-lg text-left text-sm">
            <p className="font-semibold mb-2">Información de Debug:</p>
            <p className="mb-1"><strong>Token recibido:</strong> {token || 'No hay token'}</p>
            <p className="mb-2"><strong>Cajas disponibles:</strong> {cashRegisters.length}</p>
            {cashRegisters.length > 0 && (
              <div className="mt-3">
                <p className="font-semibold mb-1">Tokens válidos:</p>
                <ul className="space-y-1 font-mono text-xs">
                  {cashRegisters.map(reg => (
                    <li key={reg.id} className="break-all">
                      • {reg.name}: <span className="text-blue-600">{reg.accessToken}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="mt-6">
            <a 
              href="/" 
              className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Volver al Panel Admin
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!cashRegister.isActive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Power className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h1 className="text-3xl font-bold mb-4">Caja Cerrada</h1>
          <p className="text-muted-foreground mb-2">
            La caja <strong>{cashRegister.name}</strong> está cerrada.
          </p>
          <p className="text-sm text-muted-foreground">
            Contacta al administrador para abrir la caja.
          </p>
        </div>
      </div>
    );
  }

  const categories = ['Todos', ...new Set(products.map((p) => p.category))];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.stock > 0;
  });

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const processSale = async (
    product: Product,
    quantity: number,
    paymentMethod: 'cash' | 'card' | 'qr',
    receivedAmount?: number,
    dni?: string
  ) => {
    if (!cashRegister) return;
    
    const appliedPrice = paymentMethod === 'cash' ? product.cashPrice : product.cardPrice;
    const total = appliedPrice * quantity;
    const change = receivedAmount ? receivedAmount - total : 0;
    
    // Create cart item
    const cartItem: CartItem = {
      ...product,
      quantity,
      appliedPrice
    };
    
    // Create sale record
    const sale = {
      id: `sale_${Date.now()}`,
      cashRegisterId: cashRegister.id,
      cashRegisterName: cashRegister.name,
      employeeId: cashRegister.employeeId || '',
      employeeName: cashRegister.employeeName,
      date: new Date(),
      items: [cartItem],
      subtotal: total,
      total: total,
      paymentMethod: paymentMethod,
      receivedAmount: paymentMethod === 'cash' ? receivedAmount : undefined,
      change: paymentMethod === 'cash' ? change : undefined,
    };

    // Save sale
    await addSale(sale);
    
    // Update cash register balance (only cash affects the register)
    if (paymentMethod === 'cash') {
      updateCashRegister(cashRegister.id, {
        currentBalance: cashRegister.currentBalance + total,
      });
    }

    // Award loyalty points if DNI is provided and company is known
    if (dni && companyId) {
      try {
        const customer = await getCustomerByDni(companyId, dni);
        if (customer) {
          const result = await awardPoints(companyId, customer.customer.id, sale.id, total, [cartItem]);
          if (result) {
            let message = `¡${customer.customer.name || 'Cliente'} ganó ${result.pointsEarned} puntos!\nNuevo saldo: ${result.newBalance} puntos`;
            if (result.rewardAvailable && result.rewardLabel) {
              message += `\n\n🎁 Recompensa: ${result.rewardLabel}`;
            }
            alert(message);
          }
        }
      } catch (error) {
        console.error('Error awarding points (venta rápida):', error);
      }
    }

    // Sale processed successfully - no alert needed
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    const product = products.find(p => p.id === id);
    if (product && quantity > product.stock) {
      alert('No hay suficiente stock disponible');
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const removeItem = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowCheckout(true);
  };

  const handleConfirmPayment = async (method: 'cash' | 'card' | 'qr', receivedAmount?: number, customer?: SelectedCustomer) => {
    if (!cashRegister) return;
    
    const total = cart.reduce((sum, item) => sum + item.appliedPrice * item.quantity, 0);
    const change = receivedAmount ? receivedAmount - total : 0;
    
    // Create sale record
    const sale = {
      id: `sale_${Date.now()}`,
      cashRegisterId: cashRegister.id,
      cashRegisterName: cashRegister.name,
      employeeId: cashRegister.employeeId || '',
      employeeName: cashRegister.employeeName,
      date: new Date(),
      items: cart,
      subtotal: total,
      total: total,
      paymentMethod: method,
      receivedAmount: method === 'cash' ? receivedAmount : undefined,
      change: method === 'cash' ? change : undefined,
    };

    // Save sale to database
    await addSale(sale);
    
    // Award loyalty points if customer is selected
    if (customer && companyId) {
      try {
        const result = await awardPoints(companyId, customer.customer.id, sale.id, total, cart);
        if (result) {
          let message = `¡${customer.customer.name || 'Cliente'} ganó ${result.pointsEarned} puntos!\nNuevo saldo: ${result.newBalance} puntos`;
          if (result.rewardAvailable && result.rewardLabel) {
            message += `\n\n🎁 Recompensa: ${result.rewardLabel}`;
          }
          alert(message);
        }
      } catch (error) {
        console.error('Error awarding points:', error);
      }
    }
    
    // Update cash register balance (only cash affects the register)
    if (method === 'cash') {
      updateCashRegister(cashRegister.id, {
        currentBalance: cashRegister.currentBalance + total,
      });
    }

    // Sale processed successfully - clear cart and close modal
    setCart([]);
    setShowCheckout(false);
  };

  const handleClosingConfirm = () => {
    // closeSession already updates the cash register status
    // No need to update it here again
    setShowClosing(false);
    alert('Caja cerrada exitosamente. Puedes cerrar esta ventana.');
  };

  const handleCloseCashRegister = () => {
    if (cart.length > 0) {
      alert('Debes completar o cancelar la venta actual antes de cerrar la caja.');
      return;
    }
    setShowClosing(true);
  };

  const total = cart.reduce((sum, item) => sum + item.appliedPrice * item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Store className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">{cashRegister.name}</h1>
                <p className="text-sm text-muted-foreground">
                  Cajero: {cashRegister.employeeName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Productos: {filteredProducts.length}</p>
                <p className="text-sm text-muted-foreground">En carrito: {cart.length}</p>
              </div>
              <button
                onClick={handleCloseCashRegister}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                title="Cerrar Caja"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden sm:inline">Cerrar Caja</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleProductClick}
                />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                <p className="text-muted-foreground">No se encontraron productos</p>
              </div>
            )}
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Cart
                items={cart}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeItem}
                onCheckout={handleCheckout}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Product Selection Modal */}
      {selectedProduct && (
        <ProductSelectionModal
          product={selectedProduct}
          onConfirm={async (quantity, paymentMethod, receivedAmount, dni) => {
            await processSale(selectedProduct, quantity, paymentMethod, receivedAmount, dni);
            setSelectedProduct(null);
          }}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutModal
          items={cart}
          total={total}
          onClose={() => setShowCheckout(false)}
          onConfirm={handleConfirmPayment}
        />
      )}

      {/* Closing Modal */}
      {showClosing && (
        <CashRegisterClosing
          cashRegister={cashRegister}
          onClose={() => setShowClosing(false)}
          onConfirm={handleClosingConfirm}
        />
      )}
    </div>
  );
}
