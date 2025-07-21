'use client';
"use client";
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
  // Handle Escape/Enter globally when overlay is open and no results
 


type Product = {
  id: number;
  codebar: string;
  name: string;
  buyPrice: number;
  price: number;
  quantity: number;
};

interface User {
  id: number;
  username: string;
  displayName?: string;
  role: string;
  createdAt?: string;
}


type CartItem = {
  product: Product;
  quantity: number;
  tempQty?: string;
};
type TicketSummary = {
  displayName: string;
  ticketCount: number;
};


// Ticket Modal component with keyboard shortcuts
import React from 'react';
interface TicketModalProps {
  lastSale: CartItem[];
  onClose: () => void;
}
const TicketModal: React.FC<TicketModalProps> = ({ lastSale, onClose }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        window.print();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);
  
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4 text-center uppercase">🧾 Sale Ticket - supperete anes amrane </h2>
        <table className="w-full text-sm mb-4 bg-white">
          <thead>
            <tr className="bg-white">
              <th className=" px-2 py-1">#</th>
              <th className=" px-2 py-1">Product</th>
              <th className=" px-2 py-1">Qty</th>
              <th className=" px-2 py-1">Price</th>
              <th className=" px-2 py-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {lastSale.map((item, idx) => (
              <tr key={item.product.id} className='bg-white'>
                <td className=" px-2 py-1 text-center">{idx + 1}</td>
                <td className=" px-2 py-1">{item.product.name}</td>
                <td className=" px-2 py-1 text-center">{item.quantity}</td>
                <td className=" px-2 py-1 text-center">{item.product.price}</td>
                <td className=" px-2 py-1 text-center">{item.product.price * item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-center text-lg font-semibold mb-2">Total: {lastSale.reduce((sum, item) => sum + item.product.price * item.quantity, 0)} DZD</div>
        <div className="text-center text-green-700 font-bold mb-4">Thank you for your purchase!</div>
        <div className="flex justify-center">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={onClose}
          >Close</button>
        </div>
        <div className="text-center text-xs text-gray-400 mt-2">Press <b>P</b> to print, <b>Enter</b> to continue</div>
      </div>
    </div>
  );
}

// Main page component
const SalesPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [message, setMessage] = useState('');
  const [searchInput, setSearchInput] = useState({ codebar: '', name: '', qty: 1 });
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  // Modal for custom price
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [customPrice, setCustomPrice] = useState('');
  // Ticket modal
  const [showTicket, setShowTicket] = useState(false);
  const [lastSale, setLastSale] = useState<CartItem[]>([]);
  // User logic
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('userId');
  const [user, setUser] = useState<User | null>(null);
  const [userError, setUserError] = useState("");
  const [ticketData, setTicketData] = useState<TicketSummary[]>([]);

useEffect(() => {
  fetch('http://localhost:3001/api/sales/today-tickets-by-user')
    .then(res => res.json())
    .then(setTicketData);
}, []);




  useEffect(() => {
    if (!userId) {
      setUserError("No user selected. Please login.");
      setTimeout(() => router.push("/"), 1500);
      return;
    }
    fetch(`http://localhost:3001/api/users/${encodeURIComponent(userId)}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: User) => setUser(data))
      .catch(() => {
        setUserError("User not found. Please login again.");
        setTimeout(() => router.push("/"), 1500);
      });
  }, [userId, router]);


  const [carts, setCarts] = useState<CartItem[]>([]);
const [heldSales, setHeldSales] = useState<CartItem[][]>([]);

const handleHoldSale = () => {
  if (cart.length === 0) return;
  setHeldSales([...heldSales, cart]);
  setCarts([]); // clear current cart for new customer
};


   useEffect(() => {
    if (!(showSearchOverlay && searchResults.length === 0)) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
      setShowSearchOverlay(false);
      setTimeout(() => {
        const codebarInput = document.querySelector('input[placeholder="Type codebar..."') as HTMLInputElement;
        codebarInput?.focus();
      }, 50);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showSearchOverlay, searchResults.length]);
  useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    // Only trigger if ticket is not already open and there is a lastSale
    if ((e.key === 'p' || e.key === 'P') && !showTicket && lastSale.length > 0) {
      e.preventDefault();
      setShowTicket(true);
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [showTicket, lastSale]);

  useEffect(() => {
    fetch('http://localhost:3001/api/products')
      .then(res => res.json())
      .then(data => setProducts(data));
  }, []);

  // Add to cart or increment quantity (allow negative stock), remove from search results, and refocus input
  useEffect(() => {
    const handleGlobalKeyUp = (e: KeyboardEvent) => {
      // Confirm sale on Shift key up (avoids browser ignoring Shift keydown)
      if (
        e.key === 'Shift' &&
        !showTicket &&
        cart.length > 0
      ) {
        e.preventDefault();
        confirmSale();
      }
    };
    window.addEventListener('keyup', handleGlobalKeyUp);
    return () => window.removeEventListener('keyup', handleGlobalKeyUp);
  }, [cart, showTicket]);

  const addToCart = (product: Product, qty: number = 1) => {
    setCart(prevCart => {
      const exists = prevCart.find(item => item.product.id === product.id);
      if (exists) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      } else {
        return [...prevCart, { product, quantity: qty }];
      }
    });
    // Play sound effect
    try {
      const audio = new Audio('/add-to-cart.mp3');
      audio.play();
    } catch (e) {
      // ignore sound errors
    }
    setSearchResults([]);
    setShowSearchOverlay(false);
    setSearchInput({ codebar: '', name: '', qty: 1 });
    setTimeout(() => {
      const codebarInput = document.getElementById('cart-search-codebar') as HTMLInputElement;
      codebarInput?.focus();
    }, 50);
  };

  const NoResults = () => {
    setShowSearchOverlay(false);}

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.product.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + item.quantity * item.product.price, 0);
  const gain = cart.reduce(
    (sum, item) => sum + item.quantity * (item.product.price - item.product.buyPrice),
    0
  );

  const confirmSale = async () => {
  if (!userId) {
    setMessage("❌ No user selected. Please login.");
    return;
  }

  // Use the current cart snapshot before clearing or changing it
  const currentCart = [...cart];

  const items = currentCart.map(item => ({
    productId: item.product.id,
    quantity: item.quantity,
    sellPrice: item.product.price,
    codebar: item.product.codebar,
  }));

  const realItems = items.filter(i => i.codebar !== 'fix');

  let saleOk = true;
  let errorMsg = '';

  if (realItems.length > 0) {
    try {
      const res = await fetch('http://localhost:3001/api/sales/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: realItems, userId }),
      });
      const data = await res.json();

      if (!res.ok) {
        saleOk = false;
        errorMsg = data.error || 'Unknown error';
      }
    } catch (err) {
      saleOk = false;
      errorMsg = 'Network error';
    }
  }

  if (!saleOk) {
    setMessage('❌ ' + errorMsg);
    return;
  }

  // Success path
  setLastSale(currentCart);
  setShowTicket(true);
  setMessage('✅ Sale recorded: thank you');
  setCart([]);

  // Refresh products stock
  fetch('http://localhost:3001/api/products')
    .then(res => res.json())
    .then(data => setProducts(data));
};


  // Search products by codebar or name for the cart input row
  const handleProductSearch = () => {
    const { codebar, name, qty } = searchInput;
    // Special case: if codebar is 'fix', show modal for price
    if (codebar && codebar.trim().toLowerCase() === 'fix') {
      setCustomPrice('');
      setShowPriceModal(true);
      return;
    }
    const results = products.filter(
      (prod) =>
        (codebar && prod.codebar.toLowerCase().includes(codebar.toLowerCase())) ||
        (name && prod.name.toLowerCase().includes(name.toLowerCase()))
    );
    // If only one product matches the codebar exactly, add it directly
    if (codebar && results.length === 1 && results[0].codebar.toLowerCase() === codebar.toLowerCase()) {
      addToCart(results[0], qty || 1);
      return;
    }
    setSearchResults(results);
    setShowSearchOverlay(true);
    setTimeout(() => {
      if (results.length > 0) {
        const firstProduct = document.querySelector('[data-product-index="0"]') as HTMLDivElement;
        firstProduct?.focus();
      }
    }, 50);
  };

  // Confirm custom price modal
  const handleConfirmCustomPrice = () => {
    const price = parseFloat(customPrice.replace(/,/g, '.'));
    if (!isNaN(price) && price > 0) {
      const customProduct: Product = {
        id: Date.now(),
        codebar: 'fix',
        name: 'Custom Price',
        buyPrice: 0,
        price,
        quantity: Number.MAX_SAFE_INTEGER // ensure always enough stock
      };
      addToCart(customProduct, searchInput.qty || 1);
      setShowPriceModal(false);
      setSearchInput({ codebar: '', name: '', qty: 1 });
      setTimeout(() => {
        const codebarInput = document.getElementById('cart-search-codebar') as HTMLInputElement;
        codebarInput?.focus();
      }, 50);
    }
  };

  const handleCancelCustomPrice = () => {
    setShowPriceModal(false);
    setSearchInput({ codebar: '', name: '', qty: 1 });
    setTimeout(() => {
      const codebarInput = document.getElementById('cart-search-codebar') as HTMLInputElement;
      codebarInput?.focus();
    }, 50);
  };


  if (userError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-600 text-xl">{userError}</div>
    );
  }

  return (
    
    <div className="p-4 bg-gray-100 ">
      

      
      {/* Ticket Modal */}
      {showTicket && (
        <TicketModal
          lastSale={lastSale}
          onClose={() => {
            setShowTicket(false);
            setTimeout(() => {
              const codebarInput = document.getElementById('cart-search-codebar') as HTMLInputElement;
              codebarInput?.focus();
            }, 50);
          }}
        />
      )}

      {/* Custom Price Modal */}
      {showPriceModal && (
        <div className="fixed inset-0 z-50 backdrop-blur-xs flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs mx-auto">
            <h2 className="text-lg font-semibold mb-4 text-center">Custom Price</h2>
            <input
              className=" px-3 py-2 rounded w-full mb-4 text-center text-lg"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Enter price..."
              value={customPrice}
              onChange={e => setCustomPrice(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleConfirmCustomPrice();
                if (e.key === 'Escape') handleCancelCustomPrice();
              }}
              autoFocus
            />
            <div className="flex gap-2 justify-center">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={handleConfirmCustomPrice}
              >OK</button>
              <button
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                onClick={handleCancelCustomPrice}
              >Cancel</button>
            </div>
          </div>
        </div>
      )}
      <h1 className="text-2xl font-bold mb-4 uppercase">🧾 New Sale - supperete anes amrane</h1>

      {message && <p className="mb-2 text-green-600">{message}</p>}


      <div>
      <table className="w-full text-md mb-4 mt-10 border-separate border-spacing-2">
        <thead>
          <tr className="bg-white p-2">
            <th className=" px-2 py-1 shadow-md rounded-md">Codebar</th>
            <th className=" px-2 py-1 shadow-md rounded-md">Name</th>
            <th className=" px-2 py-1 shadow-md rounded-md">Qty</th>
            <th className=" px-2 py-1 shadow-md rounded-md">Unite</th>
            <th className=" px-2 py-1 shadow-md rounded-md">Price</th>
            <th className=" px-2 py-1 shadow-md rounded-md">Stock</th>
            <th className=" px-2 py-1 shadow-md rounded-md">Actions</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item, idx) => (
            <tr key={item.product.id} className='bg-white'>
              <td className=" px-2 py-1 shadow-md rounded-md">
                <label htmlFor={`cart-row-codebar-${idx}`} className="sr-only">
                  Codebar
                </label>
                <input
                  className="-0 px-2 py-1 rounded w-full bg-white min-w-20"
                  id={`cart-row-codebar-${idx}`}
                  value={item.product.codebar}
                  placeholder="Codebar"
                  title="Codebar"
                  onChange={e => {
                    // Delete the row if codebar is changed
                    removeFromCart(item.product.id);
                    setTimeout(() => {
                      const codebarInput = document.getElementById('cart-search-codebar');
                      codebarInput?.focus();
                    }, 0);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'ArrowDown') {
                      // Move down in codebar column
                      if (idx === cart.length - 1) {
                        const addCodebar = document.getElementById('cart-search-codebar');
                        addCodebar?.focus();
                      } else {
                        const next = document.getElementById(`cart-row-codebar-${idx + 1}`);
                        next?.focus();
                      }
                    } else if (e.key === 'ArrowUp') {
                      // Move up in codebar column
                      if (idx === 0) {
                        const addCodebar = document.getElementById('cart-search-codebar');
                        addCodebar?.focus();
                      } else {
                        const prev = document.getElementById(`cart-row-codebar-${idx - 1}`);
                        prev?.focus();
                      }
                    } else if (e.key === 'ArrowRight') {
                      // Move to name column in same row
                      const nameInput = document.getElementById(`cart-row-qty-${idx}`);
                      nameInput?.focus();
                    } else if (e.key === 'x' || e.key === 'X') {
                      // Focus qty input in this row, then refocus codebar
                      e.preventDefault();
                      const qtyInput = document.getElementById(`cart-row-qty-${idx}`);
                      qtyInput?.focus();
                      setTimeout(() => {
                        const codebarInput = document.getElementById(`cart-row-codebar-${idx}`);
                        codebarInput?.focus();
                      }, 0);
                    } else if (e.key === 'Escape') {
                      // Delete this row, then focus codebar of next/prev row or add row
                      removeFromCart(item.product.id);
                      setTimeout(() => {
                        if (cart.length > 1) {
                          const nextIdx = idx < cart.length - 1 ? idx : idx - 1;
                          const codebarInput = document.getElementById(`cart-row-codebar-${nextIdx}`);
                          codebarInput?.focus();
                        } else {
                          const addCodebar = document.getElementById('cart-search-codebar');
                          addCodebar?.focus();
                        }
                      }, 0);
                    }
                  }}
                />
              </td>
              <td className=" px-2 py-1 shadow-md rounded-md" >
                <input
                  className="-0 px-2 py-1 rounded w-full bg-white"
                  id={`cart-row-name-${idx}`}
                  value={item.product.name}
                  onChange={e => {
                    // Delete the row if name is changed
                    removeFromCart(item.product.id);
                    setTimeout(() => {
                      const codebarInput = document.getElementById('cart-search-codebar');
                      codebarInput?.focus();
                    }, 0);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'ArrowDown') {
                      // Move down in name column
                      if (idx === cart.length - 1) {
                        const addName = document.getElementById('cart-search-name');
                        addName?.focus();
                      } else {
                        const next = document.getElementById(`cart-row-name-${idx + 1}`);
                        next?.focus();
                      }
                    } else if (e.key === 'ArrowUp') {
                      // Move up in name column
                      if (idx === 0) {
                        const addName = document.getElementById('cart-search-name');
                        addName?.focus();
                      } else {
                        const prev = document.getElementById(`cart-row-name-${idx - 1}`);
                        prev?.focus();
                      }
                    } else if (e.key === 'ArrowLeft') {
                      // Move to codebar column in same row
                      const codebarInput = document.getElementById(`cart-row-codebar-${idx}`);
                      codebarInput?.focus();
                    } else if (e.key === 'ArrowRight') {
                      // No-op or stay in name column
                      const codebarInput = document.getElementById(`cart-row-qty-${idx}`);
                      codebarInput?.focus();
                    } else if (e.key === 'x' || e.key === 'X') {
                      // Focus qty input in this row, then refocus codebar
                      e.preventDefault();
                      const qtyInput = document.getElementById(`cart-row-qty-${idx}`);
                      qtyInput?.focus();
                      setTimeout(() => {
                        const codebarInput = document.getElementById(`cart-row-codebar-${idx}`);
                        codebarInput?.focus();
                      }, 0);
                    } else if (e.key === 'Escape') {
                      // Delete this row, then focus codebar of next/prev row or add row
                      removeFromCart(item.product.id);
                      setTimeout(() => {
                        if (cart.length > 1) {
                          const nextIdx = idx < cart.length - 1 ? idx : idx - 1;
                          const codebarInput = document.getElementById(`cart-row-codebar-${nextIdx}`);
                          codebarInput?.focus();
                        } else {
                          const addCodebar = document.getElementById('cart-search-codebar');
                          addCodebar?.focus();
                        }
                      }, 0);
                    }
                  }}
                  style={{ minWidth: 80 }}
                />
              </td>
              <td className=" px-2 py-1 shadow-md rounded-md">
                <input
                  className="-0 px-2 py-1 rounded w-full bg-white"
                  id={`cart-row-qty-${idx}`}
                  type="text"
                  min="1"
                  value={typeof item.tempQty !== 'undefined' ? item.tempQty : item.quantity}
                  onChange={e => {
                    // Allow clearing and editing, but don't update cart yet
                    const newCart = [...cart];
                    newCart[idx] = {
                      ...newCart[idx],
                      tempQty: e.target.value.replace(/[^\d]/g, '')
                    };
                    setCart(newCart);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      // Apply the new qty if valid, else keep old
                      const newCart = [...cart];
                      let val = parseInt(newCart[idx].tempQty ?? '', 10);
                      if (isNaN(val) || val < 1) val = 1;
                      newCart[idx] = {
                        ...newCart[idx],
                        quantity: val,
                      };
                      delete newCart[idx].tempQty;
                      setCart(newCart);
                      // Move focus to next codebar
                      setTimeout(() => {
                        const nextCodebar = document.getElementById(`cart-search-codebar`);
                        if (nextCodebar) nextCodebar.focus();
                      }, 0);
                    } else if (e.key === 'ArrowDown') {
                      // Move down in qty column
                      if (idx === cart.length - 1) {
                        const firstQty = document.getElementById(`cart-row-qty-${0}`);
                        firstQty?.focus();
                      } else {
                        const next = document.getElementById(`cart-row-qty-${idx + 1}`);
                        next?.focus();
                      }
                    } else if (e.key === 'ArrowUp') {
                      // Move up in qty column
                      if (idx === 0) {
                        const addQty = document.getElementById(`cart-row-qty-${cart.length-1}`);
                        addQty?.focus();
                      } else {
                        const prev = document.getElementById(`cart-row-qty-${idx - 1}`);
                        prev?.focus();
                      }
                    } else if (e.key === 'ArrowLeft') {
                      // Move to name column in same row
                      const nameInput = document.getElementById(`cart-row-name-${idx}`);
                      nameInput?.focus();
                    } else if (e.key === 'x' || e.key === 'X') {
                      // Focus qty input in this row (already here, so select all), then refocus codebar
                      e.preventDefault();
                      const qtyInput = document.getElementById(`cart-row-qty-${idx}`) as HTMLInputElement;
                      qtyInput?.select();
                      setTimeout(() => {
                        const codebarInput = document.getElementById(`cart-row-codebar-${idx}`);
                        codebarInput?.focus();
                      }, 0);
                    } else if (e.key === 'Escape') {
                      // Delete this row, then focus codebar of next/prev row or add row
                      removeFromCart(item.product.id);
                      setTimeout(() => {
                        if (cart.length > 1) {
                          const nextIdx = idx < cart.length - 1 ? idx : idx - 1;
                          const codebarInput = document.getElementById(`cart-row-codebar-${nextIdx}`);
                          codebarInput?.focus();
                        } else {
                          const addCodebar = document.getElementById('cart-search-codebar');
                          addCodebar?.focus();
                        }
                      }, 0);
                    }
                  }}
                  style={{ minWidth: 50 }}
                />
              </td>
              <td className=" px-2 py-1 shadow-md rounded-md">{item.product.price}</td>
              <td className=" px-2 py-1 shadow-md rounded-md">{
                (() => {
                  const qty = typeof item.tempQty !== 'undefined' && item.tempQty !== '' ? parseInt(item.tempQty, 10) : item.quantity;
                  return item.product.price * (isNaN(qty) ? item.quantity : qty);
                })()
              }</td>
              <td className=" px-2 py-1 shadow-md rounded-md">{item.product.quantity}</td>
              <td className=" px-2 py-1 text-center shadow-md rounded-md">
                <button
                  className="bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600"
                  onClick={() => removeFromCart(item.product.id)}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}


          {/* Input row for new product */}


          <tr className='bg-white'>
            <td className=" px-2 py-1 shadow-md rounded-md">
              <input
                className="-0 px-2 py-1 rounded w-full bg-white"
                placeholder="Type codebar..."
                value={searchInput.codebar}
                onChange={e => setSearchInput({ ...searchInput, codebar: e.target.value })}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleProductSearch();
                  else if (e.key === 'ArrowDown') {
                    // Move down in codebar column
                    if (cart.length > 0) {
                      const last = document.getElementById(`cart-row-codebar-0`);
                      last?.focus();
                    }
                  } else if (e.key === 'ArrowUp') {
                    // Go to last cart row's codebar cell
                    if (cart.length > 0) {
                      const last = document.getElementById(`cart-row-codebar-${cart.length - 1}`);
                      last?.focus();
                    }
                  } else if (e.key === 'ArrowRight') {
                    // Move to name column in add row
                    const nameInput = document.getElementById('cart-search-name');
                    nameInput?.focus();
                  }
                }}
                id="cart-search-codebar"
                autoFocus
              />
            </td>
            <td className=" px-2 py-1 shadow-md rounded-md">
              <input
                className="-0 px-2 py-1 rounded w-full bg-white"
                placeholder="Type name..."
                value={searchInput.name}
                onChange={e => setSearchInput({ ...searchInput, name: e.target.value })}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleProductSearch();
                  else if (e.key === 'ArrowDown') {
                    // Move down in name column
                    if (cart.length > 0) {
                      const first = document.getElementById('cart-row-name-0');
                      first?.focus();
                    }
                  } else if (e.key === 'ArrowUp') {
                    // Go to last cart row's name cell
                    if (cart.length > 0) {
                      const last = document.getElementById(`cart-row-name-${cart.length - 1}`);
                      last?.focus();
                    }
                  } else if (e.key === 'ArrowLeft') {
                    // Move to codebar column in add row
                    const codebarInput = document.getElementById('cart-search-codebar');
                    codebarInput?.focus();
                  }
                }}
                id="cart-search-name"
              />
            </td>
            <td className=" px-2 py-1 shadow-md rounded-md">
              <label htmlFor="cart-search-qty" className="sr-only">
                Quantity
              </label>
              <input
                className="-0 px-2 py-1 rounded w-full bg-white min-w-50"
                id="cart-search-qty"
                type="number"
                min="1"
                value={searchInput.qty}
                onChange={e => {
                  let val = parseInt(e.target.value, 10);
                  if (isNaN(val) || val < 1) val = 1;
                  setSearchInput({ ...searchInput, qty: val });
                }}
                
                placeholder="Qty"
                title="Quantity"
              />
            </td>
            <td className=" px-2 py-1 shadow-md rounded-md">-</td>
            <td className=" px-2 py-1 shadow-md rounded-md">-</td>
            <td className=" px-2 py-1 text-center shadow-md rounded-md">
              <button
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                onClick={handleProductSearch}
              >
                OK
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      </div>

      {showSearchOverlay && (
  <div className="fixed inset-0 z-50 backdrop-blur-xs flex items-center justify-center">
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl mx-auto h-120 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-2 text-black">Select a Product</h2>
      <div className="display-flex cursor-pointer">
        {searchResults.length === 0 ? (
          <div
            role="button"
            tabIndex={0}
            onClick={NoResults}
            style={{ cursor: 'pointer' }}
          >No products found.</div>
        ) : (
          searchResults.map((prod, idx) => (
            <div
              key={prod.id}
              className=" text-black rounded p-3 m-3 shadow focus:-blue-500 focus:ring-2 focus:ring-blue-300"
              data-product-index={idx}
              tabIndex={0}
              role="button"
              style={{ outline: 'none' }}
              onClick={() => addToCart(prod, searchInput.qty || 1)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  addToCart(prod, searchInput.qty || 1);
                } else if (e.key === 'ArrowDown') {
                  const next = document.querySelector(`[data-product-index='${idx + 1}']`) as HTMLDivElement;
                  next?.focus();
                } else if (e.key === 'ArrowUp') {
                  const prev = document.querySelector(`[data-product-index='${idx - 1}']`) as HTMLDivElement;
                  prev?.focus();
                } else if (e.key === 'Escape') {
                  setShowSearchOverlay(false);
                  setTimeout(() => {
                    const codebarInput = document.querySelector('input[placeholder=\"Type codebar...\"]') as HTMLInputElement;
                    codebarInput?.focus();
                  }, 50);
                }
              }}
            >
              <h2 className="font-semibold">{prod.name}</h2>
              <p>🏷️ Codebar: {prod.codebar}</p>
              <p>💰 Price: {prod.price} DZD</p>
              <p>📦 Stock: {prod.quantity - (cart.find(item => item.product.id === prod.id)?.quantity || 0)}</p>
              <div className="flex gap-2 mt-2">
                {/* ... */}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
)}



      <h2 className="text-xl font-semibold mb-2">🛒 Cart</h2>


      <div className="fixed top-4 right-6 z-40 bg-white shadow-lg rounded px-6 py-3 border border-gray-200 text-right">
        
      </div>
      
      {user && (
        <div className="fixed top-0 left-0 w-full h-18 bg-white uppercase font-bold shadow text-blue-900 py-2 px-4 z-50 flex space-between justify-between items-center">
          <span><b></b><button
            className="bg-blue-700 p-2 text-white rounded-md cursor-pointer focus:bg-blue-900 uppercase"
            onClick={async () => {
              try {
                const res = await fetch('http://localhost:3001/api/logout', { method: 'POST', credentials: 'include' });
                if (!res.ok) {
                  setMessage('Logout failed. Please try again.');
                  return;
                }
                router.push("/");
              } catch (err) {
                setMessage('Network or CORS error during logout.');
              }
            }}
          >{user.displayName || user.username}</button> - supperete anes amrane</span> 
          <p className='text-2xl font-bold text-green-700'>💵 Total: <strong>{total}</strong> DZD</p>
          <span className="text-gray-500">{ticketData.map(row => (
      <div key={row.displayName} className="text-center">
        <span className="border p-2">ticket</span>
        <span className="border p-2">{row.ticketCount}</span>
      </div>
    ))}</span>
          
        </div>
      )}

      <button
        onClick={confirmSale}
        className="bg-green-600 cursor-pointer text-white px-4 py-2 rounded hover:bg-green-700"
        disabled={cart.length === 0}
      >
        ✅ Confirm Sale
      </button>
      {heldSales.map((heldCart, index) => (
  <button
    key={index}
    className="px-2 py-1 bg-blue-900 border rounded mr-2 mb-1"
    onClick={() => {
      setCart(heldCart); // restore cart
      const newHeldSales = [...heldSales];
      newHeldSales.splice(index, 1); // remove from held list
      setHeldSales(newHeldSales);
    }}
  >
    Resume Sale 
  </button>
))}
    </div>
  );
};

export default SalesPage;