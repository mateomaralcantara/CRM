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
import { Calendar } from './ui/calendar';
import { Switch } from './ui/switch';

// Import Lucide React icons
import {
  Plus,
  Search,
  Filter,
  Calendar as CalendarIcon,
  Phone,
  Mail,
  Users,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Target,
  Activity,
  Bell,
  User,
  Building
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formData, setFormData] = useState({
    type: 'call',
    title: '',
    description: '',
    contact_id: '',
    due_date: null,
    priority: 'medium',
    status: 'pending',
    reminder_minutes: 15,
    duration_minutes: 30
  });

  const activityTypes = [
    { value: 'call', label: 'Llamada', icon: Phone, color: 'bg-blue-100 text-blue-800' },
    { value: 'email', label: 'Email', icon: Mail, color: 'bg-green-100 text-green-800' },
    { value: 'meeting', label: 'Reunión', icon: Users, color: 'bg-purple-100 text-purple-800' },
    { value: 'task', label: 'Tarea', icon: CheckCircle, color: 'bg-orange-100 text-orange-800' },
    { value: 'note', label: 'Nota', icon: MessageCircle, color: 'bg-gray-100 text-gray-800' },
    { value: 'follow_up', label: 'Seguimiento', icon: Target, color: 'bg-yellow-100 text-yellow-800' }
  ];

  const priorities = [
    { value: 'low', label: 'Baja', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: 'Media', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-800' }
  ];

  const statuses = [
    { value: 'pending', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'in_progress', label: 'En Progreso', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: 'Completada', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelada', color: 'bg-red-100 text-red-800' },
    { value: 'overdue', label: 'Vencida', color: 'bg-red-200 text-red-900' }
  ];

  const mockContacts = [
    { id: 'contact1', first_name: 'María', last_name: 'García', company: 'TechCorp Solutions' },
    { id: 'contact2', first_name: 'Carlos', last_name: 'Rodríguez', company: 'StartupES' },
    { id: 'contact3', first_name: 'Ana', last_name: 'Martínez', company: 'InnovaCorp' }
  ];

  useEffect(() => {
    fetchActivities();
    setContacts(mockContacts);
  }, []);

  const fetchActivities = async () => {
    try {
      // Mock activities for demo
      const mockActivities = [
        {
          id: 'act1',
          type: 'call',
          title: 'Llamada de seguimiento - Propuesta CRM',
          description: 'Discutir los detalles de la propuesta y resolver dudas técnicas',
          contact_id: 'contact1',
          due_date: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          priority: 'high',
          status: 'pending',
          reminder_minutes: 15,
          duration_minutes: 45,
          created_by: 'Usuario Demo',
          created_at: new Date().toISOString(),
          completed_at: null
        },
        {
          id: 'act2',
          type: 'meeting',
          title: 'Reunión Demo Producto',
          description: 'Presentación del CRM Pro y sus funcionalidades principales',
          contact_id: 'contact2',
          due_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          priority: 'medium',
          status: 'pending',
          reminder_minutes: 30,
          duration_minutes: 60,
          created_by: 'Usuario Demo',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          completed_at: null
        },
        {
          id: 'act3',
          type: 'email',
          title: 'Envío de documentación técnica',
          description: 'Enviar manual de usuario y documentación de integración API',
          contact_id: 'contact1',
          due_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          priority: 'medium',
          status: 'completed',
          reminder_minutes: 0,
          duration_minutes: 15,
          created_by: 'Usuario Demo',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          completed_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'act4',
          type: 'task',
          title: 'Preparar contrato personalizado',
          description: 'Crear contrato con condiciones específicas acordadas en la reunión',
          contact_id: 'contact3',
          due_date: new Date(Date.now() + 172800000).toISOString(), // 2 days from now
          priority: 'high',
          status: 'in_progress',
          reminder_minutes: 60,
          duration_minutes: 120,
          created_by: 'Usuario Demo',
          created_at: new Date(Date.now() - 43200000).toISOString(),
          completed_at: null
        },
        {
          id: 'act5',
          type: 'follow_up',
          title: 'Seguimiento post-demo',
          description: 'Contactar para obtener feedback y próximos pasos',
          contact_id: 'contact2',
          due_date: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago (overdue)
          priority: 'urgent',
          status: 'overdue',
          reminder_minutes: 15,
          duration_minutes: 30,
          created_by: 'Usuario Demo',
          created_at: new Date(Date.now() - 259200000).toISOString(),
          completed_at: null
        },
        {
          id: 'act6',
          type: 'note',
          title: 'Notas de reunión con cliente',
          description: 'Resumen de puntos clave discutidos y decisiones tomadas',
          contact_id: 'contact1',
          due_date: null,
          priority: 'low',
          status: 'completed',
          reminder_minutes: 0,
          duration_minutes: 10,
          created_by: 'Usuario Demo',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          completed_at: new Date(Date.now() - 7200000).toISOString()
        }
      ];

      // Update overdue activities
      const updatedActivities = mockActivities.map(activity => {
        if (activity.status === 'pending' && activity.due_date && new Date(activity.due_date) < new Date()) {
          return { ...activity, status: 'overdue' };
        }
        return activity;
      });

      setActivities(updatedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Error al cargar actividades');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedActivity) {
        // Update activity
        const updatedActivities = activities.map(a => 
          a.id === selectedActivity.id 
            ? { ...a, ...formData, updated_at: new Date().toISOString() }
            : a
        );
        setActivities(updatedActivities);
        toast.success('Actividad actualizada exitosamente');
      } else {
        // Create new activity
        const newActivity = {
          ...formData,
          id: `act${Date.now()}`,
          created_by: 'Usuario Demo',
          created_at: new Date().toISOString(),
          completed_at: null
        };
        setActivities([newActivity, ...activities]);
        toast.success('Actividad creada exitosamente');
      }
      resetForm();
    } catch (error) {
      console.error('Error saving activity:', error);
      toast.error('Error al guardar actividad');
    }
  };

  const handleStatusChange = async (activityId, newStatus) => {
    try {
      const updatedActivities = activities.map(activity => 
        activity.id === activityId 
          ? { 
              ...activity, 
              status: newStatus,
              completed_at: newStatus === 'completed' ? new Date().toISOString() : null
            }
          : activity
      );
      setActivities(updatedActivities);
      toast.success(`Actividad marcada como ${getStatusInfo(newStatus).label.toLowerCase()}`);
    } catch (error) {
      console.error('Error updating activity status:', error);
      toast.error('Error al actualizar estado de la actividad');
    }
  };

  const handleEdit = (activity) => {
    setSelectedActivity(activity);
    setFormData({
      type: activity.type,
      title: activity.title,
      description: activity.description,
      contact_id: activity.contact_id,
      due_date: activity.due_date ? activity.due_date.split('T')[0] + 'T' + activity.due_date.split('T')[1].slice(0, 5) : null,
      priority: activity.priority,
      status: activity.status,
      reminder_minutes: activity.reminder_minutes,
      duration_minutes: activity.duration_minutes
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (activityId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta actividad?')) {
      try {
        setActivities(activities.filter(a => a.id !== activityId));
        toast.success('Actividad eliminada exitosamente');
      } catch (error) {
        console.error('Error deleting activity:', error);
        toast.error('Error al eliminar actividad');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'call',
      title: '',
      description: '',
      contact_id: '',
      due_date: null,
      priority: 'medium',
      status: 'pending',
      reminder_minutes: 15,
      duration_minutes: 30
    });
    setSelectedActivity(null);
    setIsDialogOpen(false);
  };

  const getContactName = (contactId) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact ? `${contact.first_name} ${contact.last_name}` : 'Contacto no encontrado';
  };

  const getContactInfo = (contactId) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact || {};
  };

  const getTypeInfo = (type) => {
    return activityTypes.find(t => t.value === type) || activityTypes[0];
  };

  const getPriorityInfo = (priority) => {
    return priorities.find(p => p.value === priority) || priorities[1];
  };

  const getStatusInfo = (status) => {
    return statuses.find(s => s.value === status) || statuses[0];
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getContactName(activity.contact_id).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || activity.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || activity.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getActivityStats = () => {
    return {
      total: activities.length,
      pending: activities.filter(a => a.status === 'pending').length,
      inProgress: activities.filter(a => a.status === 'in_progress').length,
      completed: activities.filter(a => a.status === 'completed').length,
      overdue: activities.filter(a => a.status === 'overdue').length,
      today: activities.filter(a => {
        if (!a.due_date) return false;
        const dueDate = new Date(a.due_date);
        const today = new Date();
        return dueDate.toDateString() === today.toDateString();
      }).length
    };
  };

  const stats = getActivityStats();

  // Get today's activities for calendar view
  const todaysActivities = activities.filter(activity => {
    if (!activity.due_date) return false;
    const dueDate = new Date(activity.due_date);
    return dueDate.toDateString() === selectedDate.toDateString();
  });

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
          <h1 className="text-3xl font-bold text-gray-900">Actividades</h1>
          <p className="text-gray-600 mt-1">Gestiona tareas, llamadas, reuniones y seguimientos</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={fetchActivities}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Actividad
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {selectedActivity ? 'Editar Actividad' : 'Nueva Actividad'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Actividad*</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {activityTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridad</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="title">Título*</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    placeholder="Ej: Llamada de seguimiento con cliente"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_id">Contacto Relacionado</Label>
                  <Select value={formData.contact_id} onValueChange={(value) => setFormData({...formData, contact_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un contacto (opcional)" />
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
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Detalles de la actividad..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Fecha y Hora</Label>
                    <Input
                      id="due_date"
                      type="datetime-local"
                      value={formData.due_date}
                      onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration_minutes">Duración (min)</Label>
                    <Input
                      id="duration_minutes"
                      type="number"
                      min="5"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value) || 30})}
                      placeholder="30"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reminder_minutes">Recordatorio (minutos antes)</Label>
                  <Select 
                    value={formData.reminder_minutes.toString()} 
                    onValueChange={(value) => setFormData({...formData, reminder_minutes: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sin recordatorio</SelectItem>
                      <SelectItem value="5">5 minutos</SelectItem>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="1440">1 día</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                    {selectedActivity ? 'Actualizar' : 'Crear'} Actividad
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Lista de Actividades</TabsTrigger>
          <TabsTrigger value="calendar">Vista Calendario</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
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
                    placeholder="Buscar actividades por título, descripción o contacto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    {activityTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    {statuses.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
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
                  <Activity className="h-8 w-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pendientes</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">En Progreso</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                  </div>
                  <Play className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completadas</p>
                    <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Vencidas</p>
                    <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Hoy</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.today}</p>
                  </div>
                  <CalendarIcon className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activities List */}
          <div className="space-y-4">
            {filteredActivities.map((activity) => {
              const typeInfo = getTypeInfo(activity.type);
              const priorityInfo = getPriorityInfo(activity.priority);
              const statusInfo = getStatusInfo(activity.status);
              const contact = getContactInfo(activity.contact_id);
              const TypeIcon = typeInfo.icon;
              const isOverdue = activity.status === 'overdue';

              return (
                <Card key={activity.id} className={`${isOverdue ? 'border-l-4 border-l-red-500' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${typeInfo.color.replace('text-', 'bg-').split(' ')[0].replace('800', '100')}`}>
                          <TypeIcon className={`h-5 w-5 ${typeInfo.color.split(' ')[1]}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{activity.title}</h3>
                          {contact.first_name && (
                            <div className="flex items-center text-sm text-gray-600 mt-1">
                              <User className="h-4 w-4 mr-1" />
                              {contact.first_name} {contact.last_name}
                              {contact.company && (
                                <>
                                  <span className="mx-1">•</span>
                                  <Building className="h-4 w-4 mr-1" />
                                  {contact.company}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={priorityInfo.color}>{priorityInfo.label}</Badge>
                        <Select value={activity.status} onValueChange={(value) => handleStatusChange(activity.id, value)}>
                          <SelectTrigger className="w-32">
                            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.filter(s => s.value !== 'overdue').map(status => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {activity.description && (
                      <p className="text-gray-600 text-sm mb-3">{activity.description}</p>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        {activity.due_date && (
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                              {new Date(activity.due_date).toLocaleString('es-ES')}
                            </span>
                          </div>
                        )}
                        {activity.duration_minutes && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{activity.duration_minutes} min</span>
                          </div>
                        )}
                        {activity.reminder_minutes > 0 && (
                          <div className="flex items-center">
                            <Bell className="h-4 w-4 mr-1" />
                            <span>{activity.reminder_minutes} min antes</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(activity)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(activity.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredActivities.length === 0 && (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron actividades
              </h3>
              <p className="text-gray-500 mb-4">
                Crea tu primera actividad para comenzar a gestionar tu agenda
              </p>
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Actividad
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card>
              <CardHeader>
                <CardTitle>Calendario</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            {/* Today's Activities */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>
                  Actividades del {selectedDate.toLocaleDateString('es-ES')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todaysActivities.length > 0 ? (
                    todaysActivities.map((activity) => {
                      const typeInfo = getTypeInfo(activity.type);
                      const TypeIcon = typeInfo.icon;
                      
                      return (
                        <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <TypeIcon className={`h-5 w-5 ${typeInfo.color.split(' ')[1]}`} />
                          <div className="flex-1">
                            <p className="font-medium">{activity.title}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(activity.due_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                              {activity.duration_minutes && ` • ${activity.duration_minutes} min`}
                            </p>
                          </div>
                          <Badge className={getStatusInfo(activity.status).color}>
                            {getStatusInfo(activity.status).label}
                          </Badge>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No hay actividades programadas para este día</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Activity Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Actividades por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityTypes.map(type => {
                    const count = activities.filter(a => a.type === type.value).length;
                    const percentage = activities.length > 0 ? (count / activities.length * 100) : 0;
                    
                    return (
                      <div key={type.value} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <type.icon className="h-4 w-4" />
                            <span className="font-medium">{type.label}</span>
                          </div>
                          <span>{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-emerald-500 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actividades por Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statuses.map(status => {
                    const count = activities.filter(a => a.status === status.value).length;
                    const percentage = activities.length > 0 ? (count / activities.length * 100) : 0;
                    
                    return (
                      <div key={status.value} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{status.label}</p>
                          <p className="text-sm text-gray-600">{percentage.toFixed(1)}% del total</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{count}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Activities;