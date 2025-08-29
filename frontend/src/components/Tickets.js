import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

// Import Shadcn UI components
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

// Import Lucide React icons
import {
  Plus,
  Search,
  Filter,
  Ticket,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  FileText,
  Paperclip,
  Send,
  Edit,
  Trash2,
  RefreshCw,
  Tag,
  Users,
  TrendingUp,
  Zap,
  Star,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'technical',
    priority: 'medium',
    status: 'open',
    contact_id: '',
    assigned_to: 'user1'
  });

  const ticketStatuses = [
    { value: 'open', label: 'Abierto', color: 'bg-blue-100 text-blue-800' },
    { value: 'in_progress', label: 'En Progreso', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'pending', label: 'Pendiente', color: 'bg-orange-100 text-orange-800' },
    { value: 'resolved', label: 'Resuelto', color: 'bg-green-100 text-green-800' },
    { value: 'closed', label: 'Cerrado', color: 'bg-gray-100 text-gray-800' }
  ];

  const priorities = [
    { value: 'low', label: 'Baja', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: 'Media', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-800' }
  ];

  const categories = [
    { value: 'technical', label: 'Técnico', icon: Zap },
    { value: 'billing', label: 'Facturación', icon: FileText },
    { value: 'feature_request', label: 'Nueva Funcionalidad', icon: Star },
    { value: 'bug_report', label: 'Reporte de Bug', icon: AlertCircle },
    { value: 'general', label: 'General', icon: MessageSquare },
    { value: 'integration', label: 'Integración', icon: Users }
  ];

  const mockContacts = [
    { id: 'contact1', first_name: 'María', last_name: 'García', company: 'TechCorp Solutions', email: 'maria.garcia@techcorp.com' },
    { id: 'contact2', first_name: 'Carlos', last_name: 'Rodríguez', company: 'StartupES', email: 'carlos@startypes.com' },
    { id: 'contact3', first_name: 'Ana', last_name: 'Martínez', company: 'InnovaCorp', email: 'ana.martinez@innovacorp.es' }
  ];

  const mockUsers = [
    { id: 'user1', name: 'Usuario Demo', role: 'Soporte Técnico' },
    { id: 'user2', name: 'Ana Martínez', role: 'Soporte Senior' },
    { id: 'user3', name: 'Carlos López', role: 'Desarrollador' }
  ];

  useEffect(() => {
    fetchTickets();
    setContacts(mockContacts);
  }, []);

  const fetchTickets = async () => {
    try {
      // Mock tickets for demo
      const mockTickets = [
        {
          id: 'ticket1',
          title: 'Error al importar contactos desde CSV',
          description: 'Al intentar importar un archivo CSV con 500 contactos, la aplicación muestra un error 500 y no se completa la importación.',
          category: 'technical',
          priority: 'high',
          status: 'in_progress',
          contact_id: 'contact1',
          assigned_to: 'user2',
          created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          updated_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          resolved_at: null,
          satisfaction_rating: null,
          comments: [
            {
              id: 'comment1',
              author: 'María García',
              content: 'Adjunto el archivo CSV que está causando problemas. El error aparece después de procesar aproximadamente 50 contactos.',
              timestamp: new Date(Date.now() - 86400000).toISOString(),
              type: 'customer'
            },
            {
              id: 'comment2',
              author: 'Ana Martínez',
              content: 'Revisando el archivo. Parece que hay un problema con la codificación de caracteres especiales. Trabajando en la solución.',
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              type: 'internal'
            }
          ],
          tags: ['importación', 'csv', 'error-500']
        },
        {
          id: 'ticket2',
          title: 'Solicitud de integración con Slack',
          description: 'Necesitamos integrar nuestro CRM con Slack para recibir notificaciones automáticas cuando se cree un nuevo lead o se cierre una oportunidad.',
          category: 'feature_request',
          priority: 'medium',
          status: 'open',
          contact_id: 'contact2',
          assigned_to: 'user3',
          created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          updated_at: new Date(Date.now() - 172800000).toISOString(),
          resolved_at: null,
          satisfaction_rating: null,
          comments: [],
          tags: ['slack', 'integración', 'notificaciones']
        },
        {
          id: 'ticket3',
          title: 'Discrepancia en facturación de marzo',
          description: 'La factura de marzo muestra un cargo por 5 usuarios adicionales, pero solo tenemos 3 usuarios activos en el sistema.',
          category: 'billing',
          priority: 'high',
          status: 'resolved',
          contact_id: 'contact3',
          assigned_to: 'user1',
          created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          updated_at: new Date(Date.now() - 86400000).toISOString(),
          resolved_at: new Date(Date.now() - 86400000).toISOString(),
          satisfaction_rating: 5,
          comments: [
            {
              id: 'comment3',
              author: 'Usuario Demo',
              content: 'Revisé la facturación y efectivamente había un error. Se ha generado una nota de crédito por la diferencia. Disculpe las molestias.',
              timestamp: new Date(Date.now() - 86400000).toISOString(),
              type: 'internal'
            }
          ],
          tags: ['facturación', 'usuarios', 'nota-crédito']
        },
        {
          id: 'ticket4',
          title: 'Dashboard no carga en navegador Safari',
          description: 'Cuando accedo al CRM desde Safari, el dashboard no carga completamente. Solo se ven las tarjetas de estadísticas pero no los gráficos.',
          category: 'bug_report',
          priority: 'medium',
          status: 'pending',
          contact_id: 'contact1',
          assigned_to: 'user3',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          resolved_at: null,
          satisfaction_rating: null,
          comments: [
            {
              id: 'comment4',
              author: 'Carlos López',
              content: 'Necesitamos más información. ¿Podrías indicar la versión de Safari y el sistema operativo que estás utilizando?',
              timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
              type: 'internal'
            }
          ],
          tags: ['safari', 'dashboard', 'compatibilidad']
        },
        {
          id: 'ticket5',
          title: 'Tutorial para configurar automatizaciones',
          description: 'Me gustaría solicitar documentación o un tutorial detallado sobre cómo configurar las automatizaciones de email marketing.',
          category: 'general',
          priority: 'low',
          status: 'closed',
          contact_id: 'contact2',
          assigned_to: 'user2',
          created_at: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
          updated_at: new Date(Date.now() - 259200000).toISOString(),
          resolved_at: new Date(Date.now() - 259200000).toISOString(),
          satisfaction_rating: 4,
          comments: [
            {
              id: 'comment5',
              author: 'Ana Martínez',
              content: 'He creado una guía completa sobre automatizaciones que encontrarás en la sección de ayuda. También he programado un webinar para la próxima semana.',
              timestamp: new Date(Date.now() - 259200000).toISOString(),
              type: 'internal'
            }
          ],
          tags: ['tutorial', 'automatizaciones', 'documentación']
        }
      ];

      setTickets(mockTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Error al cargar tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedTicket) {
        // Update ticket
        const updatedTickets = tickets.map(t => 
          t.id === selectedTicket.id 
            ? { ...t, ...formData, updated_at: new Date().toISOString() }
            : t
        );
        setTickets(updatedTickets);
        toast.success('Ticket actualizado exitosamente');
      } else {
        // Create new ticket
        const newTicket = {
          ...formData,
          id: `ticket${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          resolved_at: null,
          satisfaction_rating: null,
          comments: [],
          tags: []
        };
        setTickets([newTicket, ...tickets]);
        toast.success('Ticket creado exitosamente');
      }
      resetForm();
    } catch (error) {
      console.error('Error saving ticket:', error);
      toast.error('Error al guardar ticket');
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const updatedTickets = tickets.map(ticket => 
        ticket.id === ticketId 
          ? { 
              ...ticket, 
              status: newStatus,
              updated_at: new Date().toISOString(),
              resolved_at: ['resolved', 'closed'].includes(newStatus) ? new Date().toISOString() : null
            }
          : ticket
      );
      setTickets(updatedTickets);
      toast.success(`Ticket marcado como ${getStatusInfo(newStatus).label.toLowerCase()}`);
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error('Error al actualizar estado del ticket');
    }
  };

  const handleAddComment = async (ticketId) => {
    if (!newComment.trim()) return;

    try {
      const updatedTickets = tickets.map(ticket => 
        ticket.id === ticketId 
          ? {
              ...ticket,
              comments: [
                ...ticket.comments,
                {
                  id: `comment${Date.now()}`,
                  author: 'Usuario Demo',
                  content: newComment,
                  timestamp: new Date().toISOString(),
                  type: 'internal'
                }
              ],
              updated_at: new Date().toISOString()
            }
          : ticket
      );
      setTickets(updatedTickets);
      setNewComment('');
      toast.success('Comentario agregado');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Error al agregar comentario');
    }
  };

  const handleEdit = (ticket) => {
    setSelectedTicket(ticket);
    setFormData({
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      contact_id: ticket.contact_id,
      assigned_to: ticket.assigned_to
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (ticketId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este ticket?')) {
      try {
        setTickets(tickets.filter(t => t.id !== ticketId));
        toast.success('Ticket eliminado exitosamente');
      } catch (error) {
        console.error('Error deleting ticket:', error);
        toast.error('Error al eliminar ticket');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'technical',
      priority: 'medium',
      status: 'open',
      contact_id: '',
      assigned_to: 'user1'
    });
    setSelectedTicket(null);
    setIsDialogOpen(false);
  };

  const getContactName = (contactId) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact ? `${contact.first_name} ${contact.last_name}` : 'Sin asignar';
  };

  const getContactInfo = (contactId) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact || {};
  };

  const getUserName = (userId) => {
    const user = mockUsers.find(u => u.id === userId);
    return user ? user.name : 'Sin asignar';
  };

  const getStatusInfo = (status) => {
    return ticketStatuses.find(s => s.value === status) || ticketStatuses[0];
  };

  const getPriorityInfo = (priority) => {
    return priorities.find(p => p.value === priority) || priorities[1];
  };

  const getCategoryInfo = (category) => {
    return categories.find(c => c.value === category) || categories[0];
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getContactName(ticket.contact_id).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const getTicketStats = () => {
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in_progress').length,
      pending: tickets.filter(t => t.status === 'pending').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      closed: tickets.filter(t => t.status === 'closed').length,
      avgResolutionTime: 2.4, // Mock data
      satisfactionRating: 4.2 // Mock data
    };
  };

  const stats = getTicketStats();

  const getSatisfactionStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Tickets</h1>
          <p className="text-gray-600 mt-1">Gestión completa de soporte al cliente y help desk</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={fetchTickets}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {selectedTicket ? 'Editar Ticket' : 'Nuevo Ticket'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título*</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    placeholder="Describe brevemente el problema"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoría*</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Prioridad</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map(priority => (
                          <SelectItem key={priority.value} value={priority.value}>
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Select value={formData.contact_id} onValueChange={(value) => setFormData({...formData, contact_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map(contact => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.first_name} {contact.last_name} - {contact.company}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Asignado a</Label>
                    <Select value={formData.assigned_to} onValueChange={(value) => setFormData({...formData, assigned_to: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {mockUsers.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} - {user.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción*</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                    placeholder="Describe el problema en detalle..."
                    rows={4}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-red-600 hover:bg-red-700">
                    {selectedTicket ? 'Actualizar' : 'Crear'} Ticket
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Lista de Tickets</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    className="pl-10"
                    placeholder="Buscar tickets por título, descripción o cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {ticketStatuses.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {priorities.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <Ticket className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Abiertos</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">En Progreso</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pendientes</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Resueltos</p>
                    <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Cerrados</p>
                    <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-gray-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tickets List */}
          <div className="space-y-4">
            {filteredTickets.map((ticket) => {
              const statusInfo = getStatusInfo(ticket.status);
              const priorityInfo = getPriorityInfo(ticket.priority);
              const categoryInfo = getCategoryInfo(ticket.category);
              const contact = getContactInfo(ticket.contact_id);
              const CategoryIcon = categoryInfo.icon;

              return (
                <Card key={ticket.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`p-2 rounded-lg bg-red-100`}>
                          <CategoryIcon className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-gray-900 mb-1">{ticket.title}</h3>
                            <div className="flex items-center space-x-2">
                              <Badge className={priorityInfo.color}>{priorityInfo.label}</Badge>
                              <Select value={ticket.status} onValueChange={(value) => handleStatusChange(ticket.id, value)}>
                                <SelectTrigger className="w-32">
                                  <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                                </SelectTrigger>
                                <SelectContent>
                                  {ticketStatuses.map(status => (
                                    <SelectItem key={status.value} value={status.value}>
                                      {status.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{ticket.description}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                            <Badge variant="outline">{categoryInfo.label}</Badge>
                            {contact.first_name && (
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                {contact.first_name} {contact.last_name} • {contact.company}
                              </div>
                            )}
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {getUserName(ticket.assigned_to)}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                Creado: {new Date(ticket.created_at).toLocaleDateString('es-ES')}
                              </div>
                              {ticket.comments.length > 0 && (
                                <div className="flex items-center">
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  {ticket.comments.length} comentarios
                                </div>
                              )}
                              {ticket.satisfaction_rating && (
                                <div className="flex items-center">
                                  {getSatisfactionStars(ticket.satisfaction_rating)}
                                  <span className="ml-1">({ticket.satisfaction_rating}/5)</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedTicket(ticket);
                                  setIsDetailDialogOpen(true);
                                }}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(ticket)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(ticket.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {ticket.tags && ticket.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {ticket.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredTickets.length === 0 && (
            <div className="text-center py-12">
              <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron tickets
              </h3>
              <p className="text-gray-500 mb-4">
                Crea tu primer ticket para comenzar con el sistema de soporte
              </p>
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-red-600 hover:bg-red-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Ticket
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Dashboard Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Rendimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Tiempo promedio de resolución</span>
                    <span className="font-bold">{stats.avgResolutionTime} días</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Satisfacción del cliente</span>
                    <div className="flex items-center space-x-1">
                      {getSatisfactionStars(Math.floor(stats.satisfactionRating))}
                      <span className="font-bold ml-2">{stats.satisfactionRating}/5</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Tickets resueltos hoy</span>
                    <span className="font-bold text-green-600">12</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span>SLA cumplido</span>
                    <span className="font-bold text-blue-600">94%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tickets por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map(category => {
                    const count = tickets.filter(t => t.category === category.value).length;
                    const percentage = tickets.length > 0 ? (count / tickets.length * 100) : 0;
                    
                    return (
                      <div key={category.value} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <category.icon className="h-4 w-4" />
                            <span className="font-medium">{category.label}</span>
                          </div>
                          <span>{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tendencias de Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span>Esta semana</span>
                    <span className="font-bold text-blue-600">+23%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span>Tiempo de respuesta</span>
                    <span className="font-bold text-green-600">-15%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span>Satisfacción</span>
                    <span className="font-bold text-purple-600">+8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agentes con Mejor Rendimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockUsers.map((user, index) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>{user.name.split(' ').map(n => n.charAt(0)).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{12 - index * 3} resueltos</p>
                        <div className="flex items-center">
                          {getSatisfactionStars(5 - index)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Ticket Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Ticket</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-xl font-semibold mb-2">{selectedTicket.title}</h2>
                <div className="flex items-center space-x-4 text-sm">
                  <Badge className={getStatusInfo(selectedTicket.status).color}>
                    {getStatusInfo(selectedTicket.status).label}
                  </Badge>
                  <Badge className={getPriorityInfo(selectedTicket.priority).color}>
                    {getPriorityInfo(selectedTicket.priority).label}
                  </Badge>
                  <Badge variant="outline">
                    {getCategoryInfo(selectedTicket.category).label}
                  </Badge>
                </div>
                <p className="text-gray-600 mt-3">{selectedTicket.description}</p>
              </div>

              {/* Comments */}
              <div className="space-y-4">
                <h3 className="font-semibold">Comentarios ({selectedTicket.comments.length})</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {selectedTicket.comments.map((comment) => (
                    <div key={comment.id} className={`p-3 rounded-lg ${comment.type === 'internal' ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{comment.author}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.timestamp).toLocaleString('es-ES')}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  ))}
                </div>

                {/* Add Comment */}
                <div className="flex space-x-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Agregar comentario interno..."
                    rows={2}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => handleAddComment(selectedTicket.id)}
                    disabled={!newComment.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tickets;