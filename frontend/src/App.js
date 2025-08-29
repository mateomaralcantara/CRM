import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from 'sonner';
import './App.css';
import Contacts from './components/Contacts';
import Leads from './components/Leads';
import Deals from './components/Deals';
import Teams from './components/Teams';
import Marketing from './components/Marketing';
import EmailMarketing from './components/EmailMarketing';

// Import Shadcn UI components
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Badge } from './components/ui/badge';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Textarea } from './components/ui/textarea';
import { Label } from './components/ui/label';

// Import Lucide React icons
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Building,
  TrendingUp,
  Calendar,
  Search,
  Plus,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Target,
  Activity,
  PieChart,
  BarChart3,
  Settings,
  LogOut,
  Eye,
  Edit,
  Trash2,
  Filter,
  Download,
  Upload,
  ChevronRight
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = React.createContext();

// Auth Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // In a real app, you'd validate the token here
      setUser({ email: 'user@example.com', name: 'Usuario Demo' });
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token } = response.data;
      setToken(access_token);
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser({ email, name: 'Usuario Demo' });
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (name, email, password) => {
    try {
      await axios.post(`${API}/auth/register`, { name, email, password });
      return await login(email, password);
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Login Component
const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { login, register } = React.useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    let success;
    if (isLogin) {
      success = await login(formData.email, formData.password);
    } else {
      success = await register(formData.name, formData.email, formData.password);
    }
    
    if (!success) {
      alert('Error en autenticación. Intenta de nuevo.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Building className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            CRM Pro
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isLogin ? 'Inicia sesión en tu cuenta' : 'Crea tu cuenta nueva'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required={!isLogin}
                    placeholder="Tu nombre completo"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  placeholder="tu@email.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  placeholder="••••••••"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Layout Component
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = React.useContext(AuthContext);

  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Contactos', icon: Users, path: '/contacts' },
    { name: 'Leads', icon: UserPlus, path: '/leads' },
    { name: 'Oportunidades', icon: TrendingUp, path: '/deals' },
    { name: 'Actividades', icon: Calendar, path: '/activities' },
    { name: 'Equipos', icon: Users, path: '/teams' },
    { name: 'Marketing', icon: Megaphone, path: '/marketing' },
    { name: 'Email Marketing', icon: Mail, path: '/email-marketing' },
    { name: 'Reportes', icon: BarChart3, path: '/reports' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
        <div className="flex items-center justify-between p-4 border-b">
          <div className={`flex items-center ${!sidebarOpen && 'justify-center'}`}>
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building className="h-5 w-5 text-white" />
            </div>
            {sidebarOpen && (
              <span className="ml-3 text-xl font-bold text-gray-800">CRM Pro</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <a
                  href={item.path}
                  className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  <item.icon className="h-5 w-5" />
                  {sidebarOpen && <span className="ml-3">{item.name}</span>}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t p-4">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <main className="h-full overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API}/dashboard`);
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Mock data for demo
        setStats({
          total_contacts: 0,
          total_leads: 0,
          total_deals: 0,
          total_revenue: 0,
          conversion_rate: 0,
          recent_activities: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Contactos',
      value: stats?.total_contacts || 0,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Leads Activos',
      value: stats?.total_leads || 0,
      icon: UserPlus,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Oportunidades',
      value: stats?.total_deals || 0,
      icon: TrendingUp,
      color: 'bg-orange-500',
      change: '+23%'
    },
    {
      title: 'Ingresos',
      value: `$${(stats?.total_revenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-purple-500',
      change: '+15%'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Bienvenido de vuelta, aquí tienes un resumen de tu CRM</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Lead
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1">{stat.change} vs mes anterior</p>
                </div>
                <div className={`h-12 w-12 rounded-full ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Pipeline de Ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { stage: 'Prospección', count: 12, color: 'bg-blue-500' },
                { stage: 'Calificación', count: 8, color: 'bg-yellow-500' },
                { stage: 'Propuesta', count: 5, color: 'bg-orange-500' },
                { stage: 'Negociación', count: 3, color: 'bg-red-500' },
                { stage: 'Cerrado', count: 15, color: 'bg-green-500' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${item.color} mr-3`}></div>
                    <span className="text-sm text-gray-600">{item.stage}</span>
                  </div>
                  <span className="text-sm font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Actividades Recientes
              </div>
              <Button variant="ghost" size="sm">
                Ver todas
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { type: 'Llamada', contact: 'Juan Pérez', time: 'Hace 2h', status: 'completada' },
                { type: 'Email', contact: 'María García', time: 'Hace 4h', status: 'enviado' },
                { type: 'Reunión', contact: 'Carlos López', time: 'Hace 1d', status: 'programada' },
                { type: 'Tarea', contact: 'Ana Martín', time: 'Hace 2d', status: 'pendiente' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
                    <div>
                      <p className="text-sm font-medium">{activity.type} con {activity.contact}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: 'Nuevo Contacto', icon: Users, path: '/contacts' },
              { title: 'Crear Lead', icon: UserPlus, path: '/leads' },
              { title: 'Nueva Oportunidad', icon: TrendingUp, path: '/deals' },
              { title: 'Programar Actividad', icon: Calendar, path: '/activities' }
            ].map((action, index) => (
              <Button key={index} variant="outline" className="h-20 flex-col space-y-2">
                <action.icon className="h-6 w-6" />
                <span className="text-sm">{action.title}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <Toaster position="top-right" />
      </div>
    </AuthProvider>
  );
}

// Routes Component
const AppRoutes = () => {
  const { user, loading } = React.useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/deals" element={<div className="p-6"><h1 className="text-2xl font-bold">Oportunidades - En desarrollo</h1></div>} />
        <Route path="/activities" element={<div className="p-6"><h1 className="text-2xl font-bold">Actividades - En desarrollo</h1></div>} />
        <Route path="/reports" element={<div className="p-6"><h1 className="text-2xl font-bold">Reportes - En desarrollo</h1></div>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

export default App;