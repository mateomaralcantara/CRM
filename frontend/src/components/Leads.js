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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

// Import Lucide React icons
import {
  Plus,
  Search,
  Filter,
  UserPlus,
  Mail,
  Phone,
  Building,
  Edit,
  Trash2,
  TrendingUp,
  Target,
  Users,
  Calendar,
  Star,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [formData, setFormData] = useState({
    contact_id: '',
    source: 'website',
    status: 'new',
    score: 0,
    notes: ''
  });

  const leadStatuses = [
    { value: 'new', label: 'Nuevo', color: 'bg-blue-100 text-blue-800' },
    { value: 'qualified', label: 'Calificado', color: 'bg-green-100 text-green-800' },
    { value: 'contacted', label: 'Contactado', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'converted', label: 'Convertido', color: 'bg-purple-100 text-purple-800' },
    { value: 'lost', label: 'Perdido', color: 'bg-red-100 text-red-800' }
  ];

  const leadSources = [
    { value: 'website', label: 'Website' },
    { value: 'social_media', label: 'Redes Sociales' },
    { value: 'email_marketing', label: 'Email Marketing' },
    { value: 'referral', label: 'Referido' },
    { value: 'cold_calling', label: 'Llamada Fría' },
    { value: 'event', label: 'Evento' },
    { value: 'advertisement', label: 'Publicidad' },
    { value: 'other', label: 'Otro' }
  ];

  useEffect(() => {
    fetchLeads();
    fetchContacts();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await axios.get(`${API}/leads`);
      setLeads(response.data);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Error al cargar leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await axios.get(`${API}/contacts`);
      setContacts(response.data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedLead) {
        // Update lead
        const response = await axios.put(`${API}/leads/${selectedLead.id}`, formData);
        setLeads(leads.map(l => l.id === selectedLead.id ? response.data : l));
        toast.success('Lead actualizado exitosamente');
      } else {
        // Create new lead
        const response = await axios.post(`${API}/leads`, formData);
        setLeads([response.data, ...leads]);
        toast.success('Lead creado exitosamente');
      }
      resetForm();
    } catch (error) {
      console.error('Error saving lead:', error);
      toast.error('Error al guardar lead');
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      const lead = leads.find(l => l.id === leadId);
      const updatedData = { ...lead, status: newStatus };
      delete updatedData.id;
      delete updatedData.created_at;
      delete updatedData.updated_at;
      
      const response = await axios.put(`${API}/leads/${leadId}`, updatedData);
      setLeads(leads.map(l => l.id === leadId ? response.data : l));
      toast.success(`Lead marcado como ${newStatus}`);
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast.error('Error al actualizar estado del lead');
    }
  };

  const handleEdit = (lead) => {
    setSelectedLead(lead);
    setFormData({
      contact_id: lead.contact_id,
      source: lead.source,
      status: lead.status,
      score: lead.score,
      notes: lead.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (leadId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este lead?')) {
      try {
        await axios.delete(`${API}/leads/${leadId}`);
        setLeads(leads.filter(l => l.id !== leadId));
        toast.success('Lead eliminado exitosamente');
      } catch (error) {
        console.error('Error deleting lead:', error);
        toast.error('Error al eliminar lead');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      contact_id: '',
      source: 'website',
      status: 'new',
      score: 0,
      notes: ''
    });
    setSelectedLead(null);
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

  const getStatusBadge = (status) => {
    const statusObj = leadStatuses.find(s => s.value === status);
    return statusObj || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const getSourceLabel = (source) => {
    const sourceObj = leadSources.find(s => s.value === source);
    return sourceObj ? sourceObj.label : source;
  };

  const filteredLeads = leads.filter(lead => {
    const contactName = getContactName(lead.contact_id).toLowerCase();
    const matchesSearch = contactName.includes(searchTerm.toLowerCase()) ||
                         lead.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (lead.notes && lead.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getLeadStats = () => {
    return {
      total: leads.length,
      new: leads.filter(l => l.status === 'new').length,
      qualified: leads.filter(l => l.status === 'qualified').length,
      converted: leads.filter(l => l.status === 'converted').length,
      conversionRate: leads.length > 0 ? ((leads.filter(l => l.status === 'converted').length / leads.length) * 100).toFixed(1) : 0
    };
  };

  const stats = getLeadStats();

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
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600 mt-1">Gestiona y convierte tus leads en oportunidades</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={fetchLeads}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {selectedLead ? 'Editar Lead' : 'Nuevo Lead'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_id">Contacto*</Label>
                  <Select value={formData.contact_id} onValueChange={(value) => setFormData({...formData, contact_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un contacto" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map(contact => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.first_name} {contact.last_name} - {contact.company || 'Sin empresa'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="source">Fuente</Label>
                    <Select value={formData.source} onValueChange={(value) => setFormData({...formData, source: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {leadSources.map(source => (
                          <SelectItem key={source.value} value={source.value}>
                            {source.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Estado</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {leadStatuses.map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="score">Puntuación (0-100)</Label>
                  <Input
                    id="score"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.score}
                    onChange={(e) => setFormData({...formData, score: parseInt(e.target.value) || 0})}
                    placeholder="Puntuación del lead"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Notas adicionales sobre el lead..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    {selectedLead ? 'Actualizar' : 'Crear'} Lead
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                className="pl-10"
                placeholder="Buscar leads por contacto, fuente o notas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {leadStatuses.map(status => (
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <UserPlus className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nuevos</p>
                <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
              </div>
              <Star className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Calificados</p>
                <p className="text-2xl font-bold text-green-600">{stats.qualified}</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Convertidos</p>
                <p className="text-2xl font-bold text-purple-600">{stats.converted}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversión</p>
                <p className="text-2xl font-bold text-orange-600">{stats.conversionRate}%</p>
              </div>
              <ArrowRight className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Leads ({filteredLeads.length})</span>
            <Badge variant="secondary">{filteredLeads.length} de {leads.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Puntuación</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => {
                  const contact = getContactInfo(lead.contact_id);
                  const statusBadge = getStatusBadge(lead.status);
                  return (
                    <TableRow key={lead.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback className="bg-green-100 text-green-600">
                              {contact.first_name?.charAt(0)}{contact.last_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">
                              {getContactName(lead.contact_id)}
                            </p>
                            {contact.email && (
                              <p className="text-sm text-gray-500">{contact.email}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getSourceLabel(lead.source)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select value={lead.status} onValueChange={(value) => handleStatusChange(lead.id, value)}>
                          <SelectTrigger className="w-32">
                            <Badge className={statusBadge.color}>{statusBadge.label}</Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {leadStatuses.map(status => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 h-2 rounded-full"
                              style={{width: `${lead.score}%`}}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{lead.score}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {contact.company && (
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-1 text-gray-400" />
                            <span>{contact.company}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {new Date(lead.created_at).toLocaleDateString('es-ES')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(lead)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(lead.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredLeads.length === 0 && (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' ? 'No se encontraron leads' : 'No tienes leads aún'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'Intenta cambiar los filtros de búsqueda'
                  : 'Comienza creando tu primer lead para gestionar tu pipeline de ventas'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Lead
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Leads;