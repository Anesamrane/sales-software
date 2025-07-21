// frontend/app/products/page.tsx
'use client';
import { useEffect, useState } from 'react';

type Product = {
  id: number;
  codebar: string;
  name: string;
  buyPrice: number;
  price: number;
  quantity: number;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [codebar, setcodebar] = useState('');
  const [name, setName] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [price, setprice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await fetch('http://localhost:3001/api/products');
    const data = await res.json();
    setProducts(data);
  };

  const [editId, setEditId] = useState<number | null>(null);

  const handleAddOrUpdate = async () => {
    if (!codebar || !name || !buyPrice || !price || !quantity) return alert('Fill all fields');
    const productData = {
      codebar,
      name,
      buyPrice: parseFloat(buyPrice),
      price: parseFloat(price),
      quantity: parseInt(quantity)
    };
    if (editId !== null) {
      // Update product
      await fetch(`http://localhost:3001/api/products/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
    } else {
      // Create product
      await fetch('http://localhost:3001/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
    }
    setEditId(null);
    setcodebar('');
    setName('');
    setBuyPrice('');
    setprice('');
    setQuantity('');
    fetchProducts();
  };

  const handleEdit = (prod: Product) => {
    setEditId(prod.id);
    setcodebar(prod.codebar);
    setName(prod.name);
    setBuyPrice(prod.buyPrice.toString());
    setprice(prod.price.toString());
    setQuantity(prod.quantity.toString());
  };

  const handleDelete = async (id: number) => {
    await fetch(`http://localhost:3001/api/products/${id}`, {
      method: 'DELETE',
    });
    fetchProducts();
  };

  // Filter products by search (name or codebar)
  const filteredProducts = products.filter(
    (prod) =>
      prod.name.toLowerCase().includes(search.toLowerCase()) ||
      prod.codebar.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">📦 Products</h1>

      <div className="flex gap-2 mb-4">
        <input
          className="border px-2 py-1 rounded w-40" autoFocus
          placeholder="codebar"
          value={codebar}
          onChange={(e) => setcodebar(e.target.value)}
        />
        <input
          className="border px-2 py-1 rounded w-40"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value.toUpperCase())}
        />
        <input
          className="border px-2 py-1 rounded w-28"
          type="number"
          placeholder="Buy Price"
          value={buyPrice}
          onChange={(e) => setBuyPrice(e.target.value.toUpperCase())}
        />
        <input
          className="border px-2 py-1 rounded w-28"
          type="number"
          placeholder="Sell Price"
          value={price}
          onChange={(e) => setprice(e.target.value.toUpperCase())}
        />
        <input
          className="border px-2 py-1 rounded w-20"
          type="number"
          placeholder="Qty"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value.toUpperCase())}
        />
        <button
          className={`cursor-pointer px-3 py-1 rounded text-white ${editId !== null ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'}`}
          onClick={handleAddOrUpdate}
        >
          {editId !== null ? 'Update' : 'Add'}
        </button>
        {editId !== null && (
          <button
            className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 cursor-pointer"
            onClick={() => {
              setEditId(null);
              setcodebar('');
              setName('');
              setBuyPrice('');
              setprice('');
              setQuantity('');
            }}
          >
            Cancel
          </button>
        )}
      </div>

      <div className="mb-4">
        <input
          className="border px-2 py-1 rounded w-full"
          placeholder="Search by name or codebar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-blue-400">
            <th className="border px-2 py-1">#</th>
            <th className="border px-2 py-1">codebar</th>
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Buy Price</th>
            <th className="border px-2 py-1">Sell Price</th>
            <th className="border px-2 py-1">Qty</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((prod, idx) => (
            <tr key={prod.id}>
              <td className="border px-2 py-1">{idx + 1}</td>
              <td className="border px-2 py-1">{prod.codebar}</td>
              <td className="border px-2 py-1">{prod.name}</td>
              <td className="border px-2 py-1">{prod.buyPrice}</td>
              <td className="border px-2 py-1">{prod.price}</td>
              <td className="border px-2 py-1">{prod.quantity}</td>
              <td className="border px-2 py-1 text-center">
                <button
                  onClick={() => handleEdit(prod)}
                  className="cursor-pointer bg-yellow-500 text-white px-2 py-0.5 rounded hover:bg-yellow-600 mr-1"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(prod.id)}
                  className="cursor-pointer bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
