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
import { Progress } from './ui/progress';

// Import Lucide React icons
import {
  Plus,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Target,
  Calendar,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  ArrowRight,
  Zap,
  Award
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Deals = () => {
  const [deals, setDeals] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [formData, setFormData] = useState({
    contact_id: '',
    title: '',
    value: 0,
    pipeline_stage: 'prospecting',
    probability: 10,
    notes: ''
  });

  const pipelineStages = [
    { value: 'prospecting', label: 'Prospección', color: 'bg-blue-500', probability: 10 },
    { value: 'qualification', label: 'Calificación', color: 'bg-yellow-500', probability: 25 },
    { value: 'proposal', label: 'Propuesta', color: 'bg-orange-500', probability: 50 },
    { value: 'negotiation', label: 'Negociación', color: 'bg-purple-500', probability: 75 },
    { value: 'closed_won', label: 'Cerrado Ganado', color: 'bg-green-500', probability: 100 },
    { value: 'closed_lost', label: 'Cerrado Perdido', color: 'bg-red-500', probability: 0 }
  ];

  useEffect(() => {
    fetchDeals();
    fetchContacts();
  }, []);

  const fetchDeals = async () => {
    try {
      const response = await axios.get(`${API}/deals`);
      setDeals(response.data);
    } catch (error) {
      console.error('Error fetching deals:', error);
      toast.error('Error al cargar oportunidades');
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
      if (selectedDeal) {
        // Update deal
        const response = await axios.put(`${API}/deals/${selectedDeal.id}`, formData);
        setDeals(deals.map(d => d.id === selectedDeal.id ? response.data : d));
        toast.success('Oportunidad actualizada exitosamente');
      } else {
        // Create new deal
        const response = await axios.post(`${API}/deals`, formData);
        setDeals([response.data, ...deals]);
        toast.success('Oportunidad creada exitosamente');
      }
      resetForm();
    } catch (error) {
      console.error('Error saving deal:', error);
      toast.error('Error al guardar oportunidad');
    }
  };

  const handleStageChange = async (dealId, newStage) => {
    try {
      const deal = deals.find(d => d.id === dealId);
      const stage = pipelineStages.find(s => s.value === newStage);
      const updatedData = { 
        ...deal, 
        pipeline_stage: newStage,
        probability: stage.probability
      };
      delete updatedData.id;
      delete updatedData.created_at;
      delete updatedData.updated_at;
      
      const response = await axios.put(`${API}/deals/${dealId}`, updatedData);
      setDeals(deals.map(d => d.id === dealId ? response.data : d));
      toast.success(`Oportunidad movida a ${stage.label}`);
    } catch (error) {
      console.error('Error updating deal stage:', error);
      toast.error('Error al actualizar etapa de la oportunidad');
    }
  };

  const handleEdit = (deal) => {
    setSelectedDeal(deal);
    setFormData({
      contact_id: deal.contact_id,
      title: deal.title,
      value: deal.value,
      pipeline_stage: deal.pipeline_stage,
      probability: deal.probability,
      notes: deal.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (dealId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta oportunidad?')) {
      try {
        await axios.delete(`${API}/deals/${dealId}`);
        setDeals(deals.filter(d => d.id !== dealId));
        toast.success('Oportunidad eliminada exitosamente');
      } catch (error) {
        console.error('Error deleting deal:', error);
        toast.error('Error al eliminar oportunidad');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      contact_id: '',
      title: '',
      value: 0,
      pipeline_stage: 'prospecting',
      probability: 10,
      notes: ''
    });
    setSelectedDeal(null);
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

  const getStageInfo = (stage) => {
    return pipelineStages.find(s => s.value === stage) || pipelineStages[0];
  };

  const filteredDeals = deals.filter(deal => {
    const contactName = getContactName(deal.contact_id).toLowerCase();
    const matchesSearch = contactName.includes(searchTerm.toLowerCase()) ||
                         deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (deal.notes && deal.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStage = stageFilter === 'all' || deal.pipeline_stage === stageFilter;
    
    return matchesSearch && matchesStage;
  });

  const getDealsStats = () => {
    const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
    const wonDeals = deals.filter(d => d.pipeline_stage === 'closed_won');
    const wonValue = wonDeals.reduce((sum, deal) => sum + deal.value, 0);
    const avgDealSize = deals.length > 0 ? totalValue / deals.length : 0;
    const winRate = deals.length > 0 ? (wonDeals.length / deals.length * 100) : 0;

    return {
      total: deals.length,
      totalValue,
      wonValue,
      avgDealSize,
      winRate: winRate.toFixed(1)
    };
  };

  const stats = getDealsStats();

  // Pipeline data for visualization
  const pipelineData = pipelineStages.map(stage => ({
    ...stage,
    count: deals.filter(d => d.pipeline_stage === stage.value).length,
    value: deals.filter(d => d.pipeline_stage === stage.value).reduce((sum, d) => sum + d.value, 0)
  }));

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
          <h1 className="text-3xl font-bold text-gray-900">Oportunidades</h1>
          <p className="text-gray-600 mt-1">Gestiona tu pipeline de ventas y cierra más deals</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={fetchDeals}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Oportunidad
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {selectedDeal ? 'Editar Oportunidad' : 'Nueva Oportunidad'}
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

                <div className="space-y-2">
                  <Label htmlFor="title">Título de la Oportunidad*</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    placeholder="Ej: Implementación CRM - TechCorp"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="value">Valor (€)*</Label>
                    <Input
                      id="value"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({...formData, value: parseFloat(e.target.value) || 0})}
                      required
                      placeholder="50000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pipeline_stage">Etapa del Pipeline</Label>
                    <Select 
                      value={formData.pipeline_stage} 
                      onValueChange={(value) => {
                        const stage = pipelineStages.find(s => s.value === value);
                        setFormData({...formData, pipeline_stage: value, probability: stage.probability});
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {pipelineStages.map(stage => (
                          <SelectItem key={stage.value} value={stage.value}>
                            {stage.label} ({stage.probability}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="probability">Probabilidad de Cierre (%)</Label>
                  <div className="flex items-center space-x-3">
                    <Input
                      id="probability"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.probability}
                      onChange={(e) => setFormData({...formData, probability: parseInt(e.target.value) || 0})}
                      className="w-20"
                    />
                    <Progress value={formData.probability} className="flex-1" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Detalles sobre la oportunidad, próximos pasos, etc..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                    {selectedDeal ? 'Actualizar' : 'Crear'} Oportunidad
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
                placeholder="Buscar oportunidades por título, contacto o notas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por etapa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las etapas</SelectItem>
                {pipelineStages.map(stage => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Oportunidades</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valor Total Pipeline</p>
                <p className="text-2xl font-bold text-purple-600">€{stats.totalValue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ingresos Cerrados</p>
                <p className="text-2xl font-bold text-green-600">€{stats.wonValue.toLocaleString()}</p>
              </div>
              <Award className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tasa de Cierre</p>
                <p className="text-2xl font-bold text-orange-600">{stats.winRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline de Ventas</CardTitle>
          <CardDescription>Vista general del estado de tus oportunidades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {pipelineData.map((stage) => (
              <div key={stage.value} className="text-center">
                <div className={`${stage.color} text-white rounded-lg p-4 mb-2`}>
                  <p className="text-2xl font-bold">{stage.count}</p>
                  <p className="text-sm opacity-90">€{stage.value.toLocaleString()}</p>
                </div>
                <p className="text-sm font-medium text-gray-700">{stage.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Deals List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Oportunidades ({filteredDeals.length})</span>
            <Badge variant="secondary">{filteredDeals.length} de {deals.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="space-y-3 p-4">
              {filteredDeals.map((deal) => {
                const contact = getContactInfo(deal.contact_id);
                const stageInfo = getStageInfo(deal.pipeline_stage);
                return (
                  <Card key={deal.id} className="border-l-4" style={{borderLeftColor: stageInfo.color.replace('bg-', '#')}}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <Avatar>
                            <AvatarFallback className="bg-purple-100 text-purple-600">
                              {contact.first_name?.charAt(0)}{contact.last_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-gray-900">{deal.title}</h3>
                              <div className="flex items-center space-x-2">
                                <span className="text-lg font-bold text-green-600">€{deal.value.toLocaleString()}</span>
                                <Badge className={`${stageInfo.color} text-white`}>
                                  {stageInfo.label}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <div className="flex items-center space-x-4">
                                <span>{getContactName(deal.contact_id)}</span>
                                {contact.company && <span>• {contact.company}</span>}
                                <span>• {new Date(deal.created_at).toLocaleDateString('es-ES')}</span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <span>Probabilidad: {deal.probability}%</span>
                                <Progress value={deal.probability} className="w-16" />
                              </div>
                            </div>
                            
                            {deal.notes && (
                              <p className="text-sm text-gray-500 mt-2 truncate">{deal.notes}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Select value={deal.pipeline_stage} onValueChange={(value) => handleStageChange(deal.id, value)}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {pipelineStages.map(stage => (
                                <SelectItem key={stage.value} value={stage.value}>
                                  {stage.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(deal)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(deal.id)}
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

            {filteredDeals.length === 0 && (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || stageFilter !== 'all' ? 'No se encontraron oportunidades' : 'No tienes oportunidades aún'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || stageFilter !== 'all'
                    ? 'Intenta cambiar los filtros de búsqueda'
                    : 'Comienza creando tu primera oportunidad para gestionar tu pipeline de ventas'
                  }
                </p>
                {!searchTerm && stageFilter === 'all' && (
                  <Button 
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primera Oportunidad
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Deals;