import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Boxes, ClipboardList, LayoutDashboard, Mail, PackagePlus, RefreshCcw, ShoppingCart, UserPlus, Users } from 'lucide-react';
import './styles.css';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    let message = 'Request failed';
    try {
      const body = await response.json();
      message = body.detail || message;
    } catch {
      message = await response.text();
    }
    throw new Error(Array.isArray(message) ? message.map((item) => item.msg).join(', ') : message);
  }
  if (response.status === 204) return null;
  return response.json();
}

function money(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value || 0));
}

function App() {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dashboard, setDashboard] = useState({ products: 0, customers: 0, orders: 0, low_stock: 0, revenue: 0 });
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [productData, customerData, orderData, dashboardData] = await Promise.all([
        api('/products'),
        api('/customers'),
        api('/orders'),
        api('/dashboard'),
      ]);
      setProducts(productData);
      setCustomers(customerData);
      setOrders(orderData);
      setDashboard(dashboardData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function runAction(action, successMessage) {
    setError('');
    setNotice('');
    try {
      await action();
      setNotice(successMessage);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  const tabs = [
    ['products', Boxes, 'Products'],
    ['customers', Users, 'Customers'],
    ['orders', ClipboardList, 'Orders'],
  ];

  return (
    <main>
      <header className="topbar">
        <div>
          <p className="eyebrow">Inventory & Order Management</p>
          <h1>Operations Console</h1>
        </div>
        <button className="iconButton" onClick={loadAll} title="Refresh data" aria-label="Refresh data">
          <RefreshCcw size={18} />
        </button>
      </header>

      <section className="metrics" aria-label="Dashboard metrics">
        <Metric icon={LayoutDashboard} label="Products" value={dashboard.products} />
        <Metric icon={Users} label="Customers" value={dashboard.customers} />
        <Metric icon={ShoppingCart} label="Orders" value={dashboard.orders} />
        <Metric icon={Boxes} label="Low stock" value={dashboard.low_stock} tone={dashboard.low_stock > 0 ? 'warn' : ''} />
        <Metric icon={ClipboardList} label="Revenue" value={money(dashboard.revenue)} />
      </section>

      <nav className="tabs" aria-label="Management tabs">
        {tabs.map(([key, Icon, label]) => (
          <button key={key} className={activeTab === key ? 'active' : ''} onClick={() => setActiveTab(key)}>
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {loading && <div className="banner neutral">Loading latest records...</div>}
      {notice && <div className="banner success">{notice}</div>}
      {error && <div className="banner error">{error}</div>}

      {activeTab === 'products' && <Products products={products} runAction={runAction} />}
      {activeTab === 'customers' && <Customers customers={customers} runAction={runAction} />}
      {activeTab === 'orders' && <Orders products={products} customers={customers} orders={orders} runAction={runAction} />}
    </main>
  );
}

function Metric({ icon: Icon, label, value, tone }) {
  return (
    <article className={`metric ${tone || ''}`}>
      <Icon size={20} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function Products({ products, runAction }) {
  const [form, setForm] = useState({ name: '', sku: '', description: '', price: '', stock_quantity: '' });

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    await runAction(
      () =>
        api('/products', {
          method: 'POST',
          body: JSON.stringify({ ...form, price: Number(form.price), stock_quantity: Number(form.stock_quantity) }),
        }),
      'Product created'
    );
    setForm({ name: '', sku: '', description: '', price: '', stock_quantity: '' });
  }

  return (
    <section className="grid">
      <form className="panel" onSubmit={submit}>
        <h2><PackagePlus size={20} /> Add Product</h2>
        <Field label="Name" value={form.name} onChange={(value) => update('name', value)} required />
        <Field label="SKU" value={form.sku} onChange={(value) => update('sku', value)} required />
        <Field label="Description" value={form.description} onChange={(value) => update('description', value)} />
        <div className="two">
          <Field label="Price" type="number" step="0.01" value={form.price} onChange={(value) => update('price', value)} required />
          <Field label="Stock" type="number" value={form.stock_quantity} onChange={(value) => update('stock_quantity', value)} required />
        </div>
        <button className="primary">Create Product</button>
      </form>
      <div className="panel wide">
        <h2><Boxes size={20} /> Products</h2>
        <Table headers={['SKU', 'Name', 'Price', 'Stock']}>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.sku}</td>
              <td>{product.name}</td>
              <td>{money(product.price)}</td>
              <td><StockBadge count={product.stock_quantity} /></td>
            </tr>
          ))}
        </Table>
      </div>
    </section>
  );
}

function Customers({ customers, runAction }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    await runAction(() => api('/customers', { method: 'POST', body: JSON.stringify(form) }), 'Customer created');
    setForm({ name: '', email: '', phone: '' });
  }

  return (
    <section className="grid">
      <form className="panel" onSubmit={submit}>
        <h2><UserPlus size={20} /> Add Customer</h2>
        <Field label="Name" value={form.name} onChange={(value) => update('name', value)} required />
        <Field label="Email" type="email" value={form.email} onChange={(value) => update('email', value)} required />
        <Field label="Phone" value={form.phone} onChange={(value) => update('phone', value)} />
        <button className="primary">Create Customer</button>
      </form>
      <div className="panel wide">
        <h2><Mail size={20} /> Customers</h2>
        <Table headers={['Name', 'Email', 'Phone']}>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>{customer.name}</td>
              <td>{customer.email}</td>
              <td>{customer.phone || '-'}</td>
            </tr>
          ))}
        </Table>
      </div>
    </section>
  );
}

function Orders({ products, customers, orders, runAction }) {
  const availableProducts = products.filter((product) => product.stock_quantity > 0);
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }]);

  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        const product = products.find((candidate) => candidate.id === Number(item.product_id));
        return sum + (product ? Number(product.price) * Number(item.quantity || 0) : 0);
      }, 0),
    [items, products]
  );

  function updateItem(index, key, value) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)));
  }

  async function submit(event) {
    event.preventDefault();
    await runAction(
      () =>
        api('/orders', {
          method: 'POST',
          body: JSON.stringify({
            customer_id: Number(customerId),
            items: items.map((item) => ({ product_id: Number(item.product_id), quantity: Number(item.quantity) })),
          }),
        }),
      'Order placed and stock reduced'
    );
    setCustomerId('');
    setItems([{ product_id: '', quantity: 1 }]);
  }

  return (
    <section className="grid">
      <form className="panel" onSubmit={submit}>
        <h2><ShoppingCart size={20} /> Place Order</h2>
        <label>
          Customer
          <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} required>
            <option value="">Select customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.name} ({customer.email})</option>
            ))}
          </select>
        </label>
        {items.map((item, index) => {
          const selected = products.find((product) => product.id === Number(item.product_id));
          return (
            <div className="orderLine" key={index}>
              <label>
                Product
                <select value={item.product_id} onChange={(event) => updateItem(index, 'product_id', event.target.value)} required>
                  <option value="">Select product</option>
                  {availableProducts.map((product) => (
                    <option key={product.id} value={product.id}>{product.name} - {product.stock_quantity} in stock</option>
                  ))}
                </select>
              </label>
              <Field
                label="Qty"
                type="number"
                min="1"
                max={selected?.stock_quantity || undefined}
                value={item.quantity}
                onChange={(value) => updateItem(index, 'quantity', value)}
                required
              />
            </div>
          );
        })}
        <div className="formActions">
          <button type="button" className="secondary" onClick={() => setItems((current) => [...current, { product_id: '', quantity: 1 }])}>Add Item</button>
          {items.length > 1 && <button type="button" className="secondary" onClick={() => setItems((current) => current.slice(0, -1))}>Remove Item</button>}
        </div>
        <p className="total">Estimated total <strong>{money(total)}</strong></p>
        <button className="primary">Place Order</button>
      </form>
      <div className="panel wide">
        <h2><ClipboardList size={20} /> Recent Orders</h2>
        <div className="orders">
          {orders.map((order) => (
            <article className="orderCard" key={order.id}>
              <div>
                <strong>#{order.id} {order.customer_name}</strong>
                <span>{new Date(order.created_at).toLocaleString()}</span>
              </div>
              <b>{money(order.total_amount)}</b>
              <ul>
                {order.items.map((item) => (
                  <li key={item.id}>{item.quantity} x {item.product_name} ({item.sku})</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Field({ label, onChange, ...props }) {
  return (
    <label>
      {label}
      <input {...props} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Table({ headers, children }) {
  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function StockBadge({ count }) {
  const className = count <= 5 ? 'stock low' : 'stock';
  return <span className={className}>{count}</span>;
}

createRoot(document.getElementById('root')).render(<App />);
