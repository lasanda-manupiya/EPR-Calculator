import React, { useState, createContext, useContext } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './index.css';

const api = axios.create({ baseURL: 'http://localhost:4000/api' });

const mockSummary = {
  numberOfProducts: 12,
  totalPackagingWeight: 932.75,
  estimationMethod: 'Reference-based (preview)',
};

const mockProducts = [
  { id: 'demo-1', product_name: 'Demo Cereal Box', category: 'Food', quantity: 120 },
  { id: 'demo-2', product_name: 'Demo Soap Bottle', category: 'Personal care', quantity: 60 },
];

const mockLibrary = [
  { id: 'lib-1', reference_name: 'Cardboard carton (small)', material_type: 'Cardboard', average_weight: 34.2 },
  { id: 'lib-2', reference_name: 'PET bottle (500ml)', material_type: 'Plastic', average_weight: 18.8 },
];

const Auth = createContext<any>(null);
const useAuth = () => useContext(Auth);

const Card = ({ children }: { children: any }) => <div className='bg-white p-4 rounded-xl shadow'>{children}</div>;

const Layout = ({ children }: { children: any }) => {
  const { logout, isPreview } = useAuth();
  return (
    <div className='min-h-screen flex'>
      <aside className='w-64 bg-brand text-white p-4 space-y-2'>
        <h1 className='text-xl font-bold'>SustainZone</h1>
        {isPreview && <p className='text-xs bg-white/20 rounded p-2'>Preview mode (no login required)</p>}
        {['/dashboard', '/products', '/library', '/reports', '/settings'].map((p) => (
          <Link key={p} className='block hover:bg-white/20 p-2 rounded' to={p}>
            {p.slice(1).replace(/^./, (c) => c.toUpperCase())}
          </Link>
        ))}
        <button onClick={logout}>Log out</button>
      </aside>
      <main className='flex-1 p-6'>{children}</main>
    </div>
  );
};

const Login = () => {
  const { setToken, setPreview } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('demo@sustainzone.co.uk');
  const [password, setPassword] = useState('DemoPass123!');

  return (
    <div className='max-w-md mx-auto mt-24'>
      <Card>
        <h2>Log in</h2>
        <input className='border p-2 w-full my-2' value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type='password' className='border p-2 w-full my-2' value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className='flex flex-wrap gap-2 mt-2'>
          <button
            className='bg-brand text-white px-4 py-2'
            onClick={async () => {
              const r = await api.post('/auth/login', { email, password });
              setPreview(false);
              setToken(r.data.token);
              nav('/dashboard');
            }}
          >
            Sign in
          </button>
          <button
            className='bg-gray-200 px-4 py-2 rounded'
            onClick={() => {
              setPreview(true);
              setToken('preview-mode');
              nav('/dashboard');
            }}
          >
            Continue in preview mode
          </button>
          <Link to='/register' className='ml-2 text-brand self-center'>
            Register
          </Link>
        </div>
      </Card>
    </div>
  );
};

const Register = () => {
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', company_name: '' });
  return (
    <div className='max-w-md mx-auto mt-24'>
      <Card>
        <h2>Register</h2>
        {Object.keys(f).map((k) => (
          <input key={k} placeholder={k} className='border p-2 w-full my-2' value={(f as any)[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
        ))}
        <button className='bg-green text-white px-4 py-2' onClick={async () => { await api.post('/auth/register', f); nav('/'); }}>
          Create account
        </button>
      </Card>
    </div>
  );
};

const Dashboard = () => {
  const [s, setS] = useState<any>();
  const { token, isPreview } = useAuth();
  React.useEffect(() => {
    if (isPreview) {
      setS(mockSummary);
      return;
    }
    api.get('/reports/summary', { headers: { Authorization: `Bearer ${token}` } }).then((r) => setS(r.data));
  }, [isPreview, token]);
  if (!s) return null;
  return <Layout><div className='grid md:grid-cols-3 gap-4'><Card><p>Products assessed</p><p className='text-3xl'>{s.numberOfProducts}</p></Card><Card><p>Total packaging</p><p className='text-3xl'>{s.totalPackagingWeight.toFixed(2)} g</p></Card><Card><p>Method</p><p>{s.estimationMethod}</p></Card></div></Layout>;
};

const Products = () => {
  const { token, isPreview } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [p, setP] = useState<any>({ product_name: '', category: '', sku: '', length: 0, width: 0, height: 0, unit: 'mm', quantity: 1, packaging_components: [{ material_type: 'Cardboard', packaging_type: 'primary', length: 100, width: 100, height: 100, unit: 'mm' }] });
  const load = () => {
    if (isPreview) {
      setItems(mockProducts);
      return Promise.resolve();
    }
    return api.get('/products', { headers: { Authorization: `Bearer ${token}` } }).then((r) => setItems(r.data));
  };
  React.useEffect(() => { load(); }, [isPreview]);
  return <Layout><Card><h2>Create product wizard (MVP)</h2><div className='grid md:grid-cols-3 gap-2'>{['product_name', 'category', 'sku', 'length', 'width', 'height', 'quantity'].map((k) => <input key={k} placeholder={k} className='border p-2' onChange={(e) => setP({ ...p, [k]: e.target.value })} />)}<select className='border p-2' onChange={(e) => setP({ ...p, packaging_components: [{ ...p.packaging_components[0], material_type: e.target.value }] })}>{['Cardboard', 'Plastic', 'Paper', 'Glass', 'Aluminium', 'Steel', 'Wood', 'Other'].map((m) => <option key={m}>{m}</option>)}</select><select className='border p-2' onChange={(e) => setP({ ...p, packaging_components: [{ ...p.packaging_components[0], packaging_type: e.target.value }] })}>{['primary', 'secondary', 'tertiary'].map((m) => <option key={m}>{m}</option>)}</select></div><button className='mt-3 bg-brand text-white px-4 py-2' onClick={async () => { if (isPreview) return; await api.post('/products', p, { headers: { Authorization: `Bearer ${token}` } }); load(); }}>Save product</button></Card><Card><h3>Products</h3><table className='w-full'><tbody>{items.map((i) => <tr key={i.id}><td>{i.product_name}</td><td>{i.category}</td><td>{i.quantity}</td></tr>)}</tbody></table></Card></Layout>;
};

const Library = () => {
  const { token, isPreview } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  React.useEffect(() => {
    if (isPreview) {
      setRows(mockLibrary);
      return;
    }
    api.get('/library', { headers: { Authorization: `Bearer ${token}` } }).then((r) => setRows(r.data));
  }, [isPreview, token]);
  return <Layout><Card><h2>Reference library</h2>{rows.map((r) => <div key={r.id} className='border-b py-1'>{r.reference_name} - {r.material_type} - {r.average_weight}g</div>)}</Card></Layout>;
};

const Reports = () => {
  const { token, isPreview } = useAuth();
  return <Layout><Card><h2>Reports</h2>{isPreview ? <p className='text-sm text-gray-600'>Export is disabled in preview mode.</p> : <div className='space-x-3'><a className='text-brand' href='http://localhost:4000/api/reports/export.csv' onClick={(e) => { e.preventDefault(); window.open(`http://localhost:4000/api/reports/export.csv?token=${token}`); }}>Export CSV</a><a className='text-brand' href='http://localhost:4000/api/reports/export.pdf' target='_blank'>Export PDF</a></div>}</Card></Layout>;
};

const Settings = () => <Layout><Card>Settings</Card></Layout>;

const Protected = ({ children }: { children: any }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to='/' />;
};

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isPreview, setPreview] = useState(localStorage.getItem('isPreview') === 'true');

  React.useEffect(() => {
    token ? localStorage.setItem('token', token) : localStorage.removeItem('token');
  }, [token]);

  React.useEffect(() => {
    localStorage.setItem('isPreview', String(isPreview));
  }, [isPreview]);

  api.interceptors.request.use((c) => {
    if (token) c.headers.Authorization = `Bearer ${token}`;
    return c;
  });

  return <Auth.Provider value={{ token, setToken, isPreview, setPreview, logout: () => { setPreview(false); setToken(null); } }}><BrowserRouter><Routes><Route path='/' element={<Login />} /><Route path='/register' element={<Register />} /><Route path='/dashboard' element={<Protected><Dashboard /></Protected>} /><Route path='/products' element={<Protected><Products /></Protected>} /><Route path='/library' element={<Protected><Library /></Protected>} /><Route path='/reports' element={<Protected><Reports /></Protected>} /><Route path='/settings' element={<Protected><Settings /></Protected>} /></Routes></BrowserRouter></Auth.Provider>;
};

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
