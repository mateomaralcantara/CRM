import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

// Import Shadcn UI components
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar } from './ui/calendar';

// Import Lucide React icons
import {
  Plus,
  Search,
  Filter,
  Megaphone,
  Target,
  Users,
  TrendingUp,
  Calendar as CalendarIcon,
  Mail,
  Globe,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  BarChart3,
  PieChart,
  MousePointer,
  DollarSign,
  Award,
  Activity,
  Zap
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Marketing = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [isSegmentDialogOpen, setIsSegmentDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignFormData, setCampaignFormData] = useState({
    name: '',
    type: 'email',
    status: 'draft',
    target_segment: '',
    budget: 0,
    start_date: null,
    end_date: null,
    description: '',
    objectives: []
  });
  const [segmentFormData, setSegmentFormData] = useState({
    name: '',
    description: '',
    criteria: {
      company_size: '',
      industry: '',
      location: '',
      lead_score_min: 0,
      last_activity_days: 30
    }
  });

  const campaignTypes = [
    { value: 'email', label: 'Email Marketing', icon: Mail },
    { value: 'social', label: 'Redes Sociales', icon: Users },
    { value: 'web', label: 'Publicidad Web', icon: Globe },
    { value: 'content', label: 'Marketing de Contenidos', icon: Megaphone },
    { value: 'event', label: 'Eventos', icon: CalendarIcon }
  ];

  const campaignStatuses = [
    { value: 'draft', label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
    { value: 'scheduled', label: 'Programada', color: 'bg-blue-100 text-blue-800' },
    { value: 'active', label: 'Activa', color: 'bg-green-100 text-green-800' },
    { value: 'paused', label: 'Pausada', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'completed', label: 'Completada', color: 'bg-purple-100 text-purple-800' }
  ];

  const objectives = [
    'Generación de Leads',
    'Incrementar Ventas',
    'Brand Awareness',
    'Retención de Clientes',
    'Engagement',
    'Conversión'
  ];

  useEffect(() => {
    fetchCampaigns();
    fetchSegments();
  }, []);

  const fetchCampaigns = async () => {
    try {
      // Mock campaigns for demo
      const mockCampaigns = [
        {
          id: 'camp1',
          name: 'Campaña Lanzamiento CRM Pro',
          type: 'email',
          status: 'active',
          target_segment: 'seg1',
          budget: 5000,
          spent: 3200,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
          description: 'Campaña para promocionar las nuevas funcionalidades del CRM',
          objectives: ['Generación de Leads', 'Incrementar Ventas'],
          metrics: {
            impressions: 45000,
            clicks: 1200,
            conversions: 85,
            ctr: 2.67,
            conversion_rate: 7.08,
            roi: 320
          },
          created_at: new Date().toISOString()
        },
        {
          id: 'camp2',
          name: 'Webinar Marketing Automation',
          type: 'event',
          status: 'scheduled',
          target_segment: 'seg2',
          budget: 2000,
          spent: 0,
          start_date: new Date(Date.now() + 604800000).toISOString(), // 7 days from now
          end_date: new Date(Date.now() + 1209600000).toISOString(), // 14 days from now
          description: 'Webinar educativo sobre automatización de marketing',
          objectives: ['Brand Awareness', 'Generación de Leads'],
          metrics: {
            impressions: 0,
            clicks: 0,
            conversions: 0,
            ctr: 0,
            conversion_rate: 0,
            roi: 0
          },
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'camp3',
          name: 'Retargeting Leads Perdidos',
          type: 'web',
          status: 'completed',
          target_segment: 'seg3',
          budget: 1500,
          spent: 1450,
          start_date: new Date(Date.now() - 1209600000).toISOString(),
          end_date: new Date(Date.now() - 86400000).toISOString(),
          description: 'Campaña de retargeting para recuperar leads que no convirtieron',
          objectives: ['Conversión', 'Retención de Clientes'],
          metrics: {
            impressions: 28000,
            clicks: 840,
            conversions: 42,
            ctr: 3.00,
            conversion_rate: 5.00,
            roi: 180
          },
          created_at: new Date(Date.now() - 1296000000).toISOString()
        }
      ];
      setCampaigns(mockCampaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Error al cargar campañas');
    } finally {
      setLoading(false);
    }
  };

  const fetchSegments = async () => {
    try {
      // Mock segments for demo
      const mockSegments = [
        {
          id: 'seg1',
          name: 'Empresas Tecnológicas',
          description: 'Empresas del sector tecnológico con más de 50 empleados',
          size: 1250,
          criteria: {
            company_size: 'medium',
            industry: 'technology',
            location: 'spain',
            lead_score_min: 70,
            last_activity_days: 30
          },
          created_at: new Date().toISOString()
        },
        {
          id: 'seg2',
          name: 'Startups en Crecimiento',
          description: 'Startups con potencial de crecimiento y necesidad de CRM',
          size: 850,
          criteria: {
            company_size: 'small',
            industry: 'various',
            location: 'europe',
            lead_score_min: 60,
            last_activity_days: 14
          },
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'seg3',
          name: 'Leads Fríos',
          description: 'Contactos que no han mostrado actividad reciente',
          size: 2100,
          criteria: {
            company_size: 'any',
            industry: 'any',
            location: 'any',
            lead_score_min: 0,
            last_activity_days: 90
          },
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ];
      setSegments(mockSegments);
    } catch (error) {
      console.error('Error fetching segments:', error);
    }
  };

  const handleCampaignSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedCampaign) {
        // Update campaign
        const updatedCampaigns = campaigns.map(c => 
          c.id === selectedCampaign.id 
            ? { ...c, ...campaignFormData, updated_at: new Date().toISOString() }
            : c
        );
        setCampaigns(updatedCampaigns);
        toast.success('Campaña actualizada exitosamente');
      } else {
        // Create new campaign
        const newCampaign = {
          ...campaignFormData,
          id: `camp${Date.now()}`,
          spent: 0,
          metrics: {
            impressions: 0,
            clicks: 0,
            conversions: 0,
            ctr: 0,
            conversion_rate: 0,
            roi: 0
          },
          created_at: new Date().toISOString()
        };
        setCampaigns([newCampaign, ...campaigns]);
        toast.success('Campaña creada exitosamente');
      }
      resetCampaignForm();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Error al guardar campaña');
    }
  };

  const handleSegmentSubmit = async (e) => {
    e.preventDefault();
    try {
      const newSegment = {
        ...segmentFormData,
        id: `seg${Date.now()}`,
        size: Math.floor(Math.random() * 2000) + 100, // Mock size calculation
        created_at: new Date().toISOString()
      };
      setSegments([newSegment, ...segments]);
      toast.success('Segmento creado exitosamente');
      resetSegmentForm();
    } catch (error) {
      console.error('Error saving segment:', error);
      toast.error('Error al guardar segmento');
    }
  };

  const handleStatusChange = async (campaignId, newStatus) => {
    try {
      const updatedCampaigns = campaigns.map(campaign => 
        campaign.id === campaignId 
          ? { ...campaign, status: newStatus }
          : campaign
      );
      setCampaigns(updatedCampaigns);
      toast.success(`Campaña ${newStatus === 'active' ? 'activada' : newStatus === 'paused' ? 'pausada' : 'actualizada'}`);
    } catch (error) {
      console.error('Error updating campaign status:', error);
      toast.error('Error al actualizar estado de la campaña');
    }
  };

  const resetCampaignForm = () => {
    setCampaignFormData({
      name: '',
      type: 'email',
      status: 'draft',
      target_segment: '',
      budget: 0,
      start_date: null,
      end_date: null,
      description: '',
      objectives: []
    });
    setSelectedCampaign(null);
    setIsCampaignDialogOpen(false);
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta campaña?')) {
      try {
        setCampaigns(campaigns.filter(c => c.id !== campaignId));
        toast.success('Campaña eliminada exitosamente');
      } catch (error) {
        console.error('Error deleting campaign:', error);
        toast.error('Error al eliminar campaña');
      }
    }
  };

  const handleDeleteSegment = async (segmentId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este segmento?')) {
      try {
        setSegments(segments.filter(s => s.id !== segmentId));
        toast.success('Segmento eliminado exitosamente');
      } catch (error) {
        console.error('Error deleting segment:', error);
        toast.error('Error al eliminar segmento');
      }
    }
  };

  const resetSegmentForm = () => {
    setSegmentFormData({
      name: '',
      description: '',
      criteria: {
        company_size: '',
        industry: '',
        location: '',
        lead_score_min: 0,
        last_activity_days: 30
      }
    });
    setIsSegmentDialogOpen(false);
  };

  const getSegmentName = (segmentId) => {
    const segment = segments.find(s => s.id === segmentId);
    return segment ? segment.name : 'Segmento no encontrado';
  };

  const getTypeInfo = (type) => {
    return campaignTypes.find(t => t.value === type) || campaignTypes[0];
  };

  const getStatusInfo = (status) => {
    return campaignStatuses.find(s => s.value === status) || campaignStatuses[0];
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getMarketingStats = () => {
    const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
    const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const totalConversions = campaigns.reduce((sum, c) => sum + (c.metrics?.conversions || 0), 0);
    const avgROI = campaigns.length > 0 
      ? campaigns.reduce((sum, c) => sum + (c.metrics?.roi || 0), 0) / campaigns.length 
      : 0;

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns,
      totalBudget,
      totalSpent,
      totalConversions,
      avgROI: avgROI.toFixed(1)
    };
  };

  const stats = getMarketingStats();

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
          <h1 className="text-3xl font-bold text-gray-900">Marketing</h1>
          <p className="text-gray-600 mt-1">Gestiona campañas, segmentos y analíticas de marketing</p>
        </div>
        <div className="flex items-center space-x-3">
          <Dialog open={isSegmentDialogOpen} onOpenChange={setIsSegmentDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Target className="h-4 w-4 mr-2" />
                Nuevo Segmento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Segmento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSegmentSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="segment_name">Nombre del Segmento*</Label>
                  <Input
                    id="segment_name"
                    value={segmentFormData.name}
                    onChange={(e) => setSegmentFormData({...segmentFormData, name: e.target.value})}
                    required
                    placeholder="Ej: Empresas Tecnológicas"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="segment_description">Descripción</Label>
                  <Textarea
                    id="segment_description"
                    value={segmentFormData.description}
                    onChange={(e) => setSegmentFormData({...segmentFormData, description: e.target.value})}
                    placeholder="Describe los criterios de segmentación..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tamaño de Empresa</Label>
                    <Select 
                      value={segmentFormData.criteria.company_size} 
                      onValueChange={(value) => setSegmentFormData({
                        ...segmentFormData, 
                        criteria: {...segmentFormData.criteria, company_size: value}
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Cualquier tamaño" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Cualquier tamaño</SelectItem>
                        <SelectItem value="small">Pequeña (1-50)</SelectItem>
                        <SelectItem value="medium">Mediana (51-200)</SelectItem>
                        <SelectItem value="large">Grande (200+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Industria</Label>
                    <Select 
                      value={segmentFormData.criteria.industry} 
                      onValueChange={(value) => setSegmentFormData({
                        ...segmentFormData, 
                        criteria: {...segmentFormData.criteria, industry: value}
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Cualquier industria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Cualquier industria</SelectItem>
                        <SelectItem value="technology">Tecnología</SelectItem>
                        <SelectItem value="finance">Finanzas</SelectItem>
                        <SelectItem value="healthcare">Salud</SelectItem>
                        <SelectItem value="education">Educación</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Puntuación Mínima de Lead</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={segmentFormData.criteria.lead_score_min}
                      onChange={(e) => setSegmentFormData({
                        ...segmentFormData, 
                        criteria: {...segmentFormData.criteria, lead_score_min: parseInt(e.target.value) || 0}
                      })}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Actividad en últimos días</Label>
                    <Input
                      type="number"
                      min="1"
                      value={segmentFormData.criteria.last_activity_days}
                      onChange={(e) => setSegmentFormData({
                        ...segmentFormData, 
                        criteria: {...segmentFormData.criteria, last_activity_days: parseInt(e.target.value) || 30}
                      })}
                      placeholder="30"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={resetSegmentForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                    Crear Segmento
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Campaña
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {selectedCampaign ? 'Editar Campaña' : 'Nueva Campaña'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCampaignSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de la Campaña*</Label>
                  <Input
                    id="name"
                    value={campaignFormData.name}
                    onChange={(e) => setCampaignFormData({...campaignFormData, name: e.target.value})}
                    required
                    placeholder="Ej: Campaña Lanzamiento Producto"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Campaña*</Label>
                    <Select value={campaignFormData.type} onValueChange={(value) => setCampaignFormData({...campaignFormData, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {campaignTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Segmento Objetivo*</Label>
                    <Select value={campaignFormData.target_segment} onValueChange={(value) => setCampaignFormData({...campaignFormData, target_segment: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un segmento" />
                      </SelectTrigger>
                      <SelectContent>
                        {segments.map(segment => (
                          <SelectItem key={segment.id} value={segment.id}>
                            {segment.name} ({segment.size} contactos)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Presupuesto (€)*</Label>
                  <Input
                    id="budget"
                    type="number"
                    min="0"
                    step="0.01"
                    value={campaignFormData.budget}
                    onChange={(e) => setCampaignFormData({...campaignFormData, budget: parseFloat(e.target.value) || 0})}
                    required
                    placeholder="5000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={campaignFormData.description}
                    onChange={(e) => setCampaignFormData({...campaignFormData, description: e.target.value})}
                    placeholder="Describe los objetivos y estrategia de la campaña..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Objetivos</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {objectives.map(objective => (
                      <label key={objective} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={campaignFormData.objectives.includes(objective)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCampaignFormData({
                                ...campaignFormData,
                                objectives: [...campaignFormData.objectives, objective]
                              });
                            } else {
                              setCampaignFormData({
                                ...campaignFormData,
                                objectives: campaignFormData.objectives.filter(o => o !== objective)
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{objective}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={resetCampaignForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                    {selectedCampaign ? 'Actualizar' : 'Crear'} Campaña
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns">Campañas</TabsTrigger>
          <TabsTrigger value="segments">Segmentos</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    className="pl-10"
                    placeholder="Buscar campañas por nombre o descripción..."
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
                    {campaignStatuses.map(status => (
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
                    <p className="text-sm text-gray-600">Total Campañas</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalCampaigns}</p>
                  </div>
                  <Megaphone className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Activas</p>
                    <p className="text-2xl font-bold text-green-600">{stats.activeCampaigns}</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Presupuesto</p>
                    <p className="text-2xl font-bold text-blue-600">€{stats.totalBudget.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Gastado</p>
                    <p className="text-2xl font-bold text-purple-600">€{stats.totalSpent.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Conversiones</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.totalConversions}</p>
                  </div>
                  <Target className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">ROI Promedio</p>
                    <p className="text-2xl font-bold text-red-600">{stats.avgROI}%</p>
                  </div>
                  <Award className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaigns List */}
          <div className="space-y-4">
            {filteredCampaigns.map((campaign) => {
              const typeInfo = getTypeInfo(campaign.type);
              const statusInfo = getStatusInfo(campaign.status);
              const TypeIcon = typeInfo.icon;
              const budgetUsage = campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0;

              return (
                <Card key={campaign.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <TypeIcon className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                          <p className="text-sm text-gray-600">{campaign.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                        <Badge variant="outline">{typeInfo.label}</Badge>
                        {campaign.status === 'active' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(campaign.id, 'paused')}
                          >
                            <Pause className="h-4 w-4 mr-1" />
                            Pausar
                          </Button>
                        ) : campaign.status === 'paused' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(campaign.id, 'active')}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Activar
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Segmento Objetivo</p>
                        <p className="font-medium">{getSegmentName(campaign.target_segment)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Presupuesto</p>
                        <p className="font-medium">€{campaign.budget.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Gastado</p>
                        <p className="font-medium">€{campaign.spent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Uso del Presupuesto</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={budgetUsage} className="flex-1" />
                          <span className="text-sm font-medium">{budgetUsage.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>

                    {campaign.metrics && (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Impresiones</p>
                          <p className="text-lg font-semibold">{campaign.metrics.impressions.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Clicks</p>
                          <p className="text-lg font-semibold">{campaign.metrics.clicks.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">CTR</p>
                          <p className="text-lg font-semibold">{campaign.metrics.ctr}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Conversiones</p>
                          <p className="text-lg font-semibold">{campaign.metrics.conversions}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">ROI</p>
                          <p className="text-lg font-semibold text-green-600">{campaign.metrics.roi}%</p>
                        </div>
                      </div>
                    )}

                    {campaign.objectives && campaign.objectives.length > 0 && (
                      <div className="flex items-center justify-between mt-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Objetivos:</p>
                          <div className="flex flex-wrap gap-2">
                            {campaign.objectives.map((objective, index) => (
                              <Badge key={index} variant="secondary">{objective}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCampaign(campaign.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredCampaigns.length === 0 && (
            <div className="text-center py-12">
              <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron campañas
              </h3>
              <p className="text-gray-500 mb-4">
                Crea tu primera campaña para empezar con marketing automation
              </p>
              <Button 
                onClick={() => setIsCampaignDialogOpen(true)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Campaña
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="segments" className="space-y-6">
          {/* Segments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {segments.map((segment) => (
              <Card key={segment.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{segment.name}</span>
                    <Badge variant="secondary">{segment.size} contactos</Badge>
                  </CardTitle>
                  <CardDescription>{segment.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Tamaño empresa:</p>
                        <p className="font-medium capitalize">{segment.criteria.company_size || 'Cualquiera'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Industria:</p>
                        <p className="font-medium capitalize">{segment.criteria.industry || 'Cualquiera'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Score mínimo:</p>
                        <p className="font-medium">{segment.criteria.lead_score_min}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Actividad:</p>
                        <p className="font-medium">{segment.criteria.last_activity_days} días</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-gray-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSegment(segment.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Marketing Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Rendimiento por Tipo de Campaña
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaignTypes.map(type => {
                    const typeCampaigns = campaigns.filter(c => c.type === type.value);
                    const totalConversions = typeCampaigns.reduce((sum, c) => sum + (c.metrics?.conversions || 0), 0);
                    const avgROI = typeCampaigns.length > 0 
                      ? typeCampaigns.reduce((sum, c) => sum + (c.metrics?.roi || 0), 0) / typeCampaigns.length 
                      : 0;

                    return (
                      <div key={type.value} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <type.icon className="h-5 w-5 text-gray-600" />
                          <span className="font-medium">{type.label}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{totalConversions} conversiones</p>
                          <p className="text-sm text-gray-600">{avgROI.toFixed(1)}% ROI promedio</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Distribución de Presupuesto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaignStatuses.slice(1, -1).map(status => {
                    const statusCampaigns = campaigns.filter(c => c.status === status.value);
                    const totalBudget = statusCampaigns.reduce((sum, c) => sum + c.budget, 0);
                    const percentage = stats.totalBudget > 0 ? (totalBudget / stats.totalBudget) * 100 : 0;

                    return (
                      <div key={status.value} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{status.label}</span>
                          <span>€{totalBudget.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={percentage} />
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

export default Marketing;