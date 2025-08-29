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
import { Switch } from './ui/switch';

// Import Lucide React icons
import {
  Plus,
  Search,
  Mail,
  Send,
  Eye,
  Edit,
  Copy,
  Trash2,
  Play,
  Pause,
  Clock,
  Users,
  TrendingUp,
  MousePointer,
  Award,
  Filter,
  Calendar,
  Zap,
  Settings,
  FileText,
  Image as ImageIcon,
  Link,
  Type,
  Layout,
  Palette
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EmailMarketing = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isAutomationDialogOpen, setIsAutomationDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignFormData, setCampaignFormData] = useState({
    name: '',
    subject: '',
    template_id: '',
    segment_id: '',
    send_type: 'immediate',
    scheduled_at: null,
    status: 'draft'
  });
  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    subject: '',
    content: '',
    category: 'newsletter',
    is_active: true
  });
  const [automationFormData, setAutomationFormData] = useState({
    name: '',
    trigger: 'contact_created',
    template_id: '',
    delay_hours: 0,
    conditions: [],
    is_active: true
  });

  const campaignStatuses = [
    { value: 'draft', label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
    { value: 'scheduled', label: 'Programado', color: 'bg-blue-100 text-blue-800' },
    { value: 'sending', label: 'Enviando', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'sent', label: 'Enviado', color: 'bg-green-100 text-green-800' },
    { value: 'paused', label: 'Pausado', color: 'bg-orange-100 text-orange-800' }
  ];

  const templateCategories = [
    { value: 'newsletter', label: 'Newsletter' },
    { value: 'welcome', label: 'Bienvenida' },
    { value: 'promotion', label: 'Promoción' },
    { value: 'notification', label: 'Notificación' },
    { value: 'followup', label: 'Seguimiento' },
    { value: 'event', label: 'Evento' }
  ];

  const automationTriggers = [
    { value: 'contact_created', label: 'Contacto creado' },
    { value: 'lead_converted', label: 'Lead convertido' },
    { value: 'deal_won', label: 'Oportunidad ganada' },
    { value: 'deal_lost', label: 'Oportunidad perdida' },
    { value: 'birthday', label: 'Cumpleaños' },
    { value: 'inactivity', label: 'Inactividad' }
  ];

  const mockSegments = [
    { id: 'seg1', name: 'Empresas Tecnológicas', size: 1250 },
    { id: 'seg2', name: 'Startups en Crecimiento', size: 850 },
    { id: 'seg3', name: 'Leads Fríos', size: 2100 }
  ];

  useEffect(() => {
    fetchEmailCampaigns();
    fetchTemplates();
    fetchAutomations();
  }, []);

  const fetchEmailCampaigns = async () => {
    try {
      // Mock email campaigns for demo
      const mockCampaigns = [
        {
          id: 'email_camp1',
          name: 'Newsletter Mensual - Marzo 2025',
          subject: '🚀 Nuevas funcionalidades CRM Pro - Marzo 2025',
          template_id: 'template1',
          segment_id: 'seg1',
          send_type: 'immediate',
          status: 'sent',
          scheduled_at: null,
          sent_at: new Date(Date.now() - 86400000).toISOString(),
          metrics: {
            sent: 1250,
            delivered: 1210,
            opened: 425,
            clicked: 85,
            bounced: 40,
            unsubscribed: 12,
            open_rate: 35.1,
            click_rate: 7.0,
            bounce_rate: 3.3
          },
          created_at: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: 'email_camp2',
          name: 'Campaña Bienvenida Nuevos Clientes',
          subject: '¡Bienvenido a CRM Pro! Tu guía completa',
          template_id: 'template2',
          segment_id: 'seg2',
          send_type: 'scheduled',
          status: 'scheduled',
          scheduled_at: new Date(Date.now() + 3600000).toISOString(),
          sent_at: null,
          metrics: {
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            bounced: 0,
            unsubscribed: 0,
            open_rate: 0,
            click_rate: 0,
            bounce_rate: 0
          },
          created_at: new Date().toISOString()
        },
        {
          id: 'email_camp3',
          name: 'Promoción Especial - 30% Descuento',
          subject: '⚡ ¡30% OFF en tu upgrade a CRM Pro Premium!',
          template_id: 'template3',
          segment_id: 'seg3',
          send_type: 'immediate',
          status: 'sending',
          scheduled_at: null,
          sent_at: new Date().toISOString(),
          metrics: {
            sent: 1500,
            delivered: 1450,
            opened: 320,
            clicked: 45,
            bounced: 50,
            unsubscribed: 8,
            open_rate: 22.1,
            click_rate: 3.1,
            bounce_rate: 3.4
          },
          created_at: new Date(Date.now() - 43200000).toISOString()
        }
      ];
      setCampaigns(mockCampaigns);
    } catch (error) {
      console.error('Error fetching email campaigns:', error);
      toast.error('Error al cargar campañas de email');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      // Mock templates for demo
      const mockTemplates = [
        {
          id: 'template1',
          name: 'Newsletter Moderna',
          subject: 'Newsletter Mensual - {{month}} {{year}}',
          content: `
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
              <header style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
                <h1>{{company_name}}</h1>
                <p>Newsletter Mensual</p>
              </header>
              <main style="padding: 20px;">
                <h2>Hola {{first_name}},</h2>
                <p>Te traemos las últimas novedades y actualizaciones...</p>
                <div style="background: #f8f9ff; padding: 15px; margin: 20px 0; border-radius: 8px;">
                  <h3>🚀 Nuevas Funcionalidades</h3>
                  <p>Descubre las nuevas herramientas que hemos desarrollado para ti.</p>
                </div>
                <a href="{{cta_link}}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">Ver Más</a>
              </main>
              <footer style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 12px;">
                <p>{{company_name}} | <a href="{{unsubscribe_link}}">Darse de baja</a></p>
              </footer>
            </div>
          `,
          category: 'newsletter',
          is_active: true,
          usage_count: 15,
          created_at: new Date(Date.now() - 259200000).toISOString()
        },
        {
          id: 'template2',
          name: 'Bienvenida Minimalista',
          subject: '¡Bienvenido a {{company_name}}!',
          content: `
            <div style="max-width: 500px; margin: 0 auto; font-family: 'Helvetica Neue', sans-serif; line-height: 1.6;">
              <div style="text-align: center; padding: 40px 20px;">
                <h1 style="color: #2d3748; margin-bottom: 30px;">¡Bienvenido!</h1>
                <p style="font-size: 18px; color: #4a5568; margin-bottom: 30px;">Hola {{first_name}}, nos alegra tenerte con nosotros.</p>
                <div style="background: #edf2f7; padding: 30px; border-radius: 12px; margin: 30px 0;">
                  <h3 style="color: #2d3748; margin-bottom: 15px;">Primeros pasos</h3>
                  <ul style="text-align: left; color: #4a5568;">
                    <li>Configura tu perfil</li>
                    <li>Explora el dashboard</li>
                    <li>Crea tu primer contacto</li>
                  </ul>
                </div>
                <a href="{{onboarding_link}}" style="display: inline-block; background: #4299e1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">Comenzar</a>
              </div>
            </div>
          `,
          category: 'welcome',
          is_active: true,
          usage_count: 8,
          created_at: new Date(Date.now() - 432000000).toISOString()
        },
        {
          id: 'template3',
          name: 'Promoción Vibrante',
          subject: '⚡ ¡Oferta especial para {{first_name}}!',
          content: `
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
              <div style="background: linear-gradient(45deg, #f093fb 0%, #f5576c 50%, #4facfe 100%); padding: 1px; border-radius: 15px;">
                <div style="background: white; border-radius: 14px; padding: 30px;">
                  <div style="text-align: center;">
                    <h1 style="color: #2d3748; font-size: 32px; margin-bottom: 10px;">⚡ OFERTA ESPECIAL ⚡</h1>
                    <p style="font-size: 24px; color: #e53e3e; font-weight: bold; margin: 20px 0;">30% DE DESCUENTO</p>
                    <p style="font-size: 18px; color: #4a5568; margin-bottom: 30px;">Hola {{first_name}}, aprovecha esta oportunidad única</p>
                  </div>
                  
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0;">
                    <h2 style="margin: 0 0 15px 0;">Upgrade a Premium</h2>
                    <p style="opacity: 0.9; margin: 0;">Todas las funcionalidades avanzadas por solo €49/mes</p>
                  </div>
                  
                  <div style="text-align: center;">
                    <a href="{{upgrade_link}}" style="display: inline-block; background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px; margin: 20px 0;">¡APROVECHAR OFERTA!</a>
                    <p style="font-size: 14px; color: #718096; margin-top: 20px;">Oferta válida hasta el {{expiry_date}}</p>
                  </div>
                </div>
              </div>
            </div>
          `,
          category: 'promotion',
          is_active: true,
          usage_count: 3,
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ];
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchAutomations = async () => {
    try {
      // Mock automations for demo
      const mockAutomations = [
        {
          id: 'auto1',
          name: 'Secuencia Bienvenida Nuevos Contactos',
          trigger: 'contact_created',
          template_id: 'template2',
          delay_hours: 0,
          conditions: [],
          is_active: true,
          stats: {
            triggered: 145,
            sent: 142,
            opened: 89,
            clicked: 23
          },
          created_at: new Date(Date.now() - 604800000).toISOString()
        },
        {
          id: 'auto2',
          name: 'Seguimiento Leads Convertidos',
          trigger: 'lead_converted',
          template_id: 'template1',
          delay_hours: 24,
          conditions: [
            { field: 'lead_score', operator: 'greater_than', value: 70 }
          ],
          is_active: true,
          stats: {
            triggered: 67,
            sent: 65,
            opened: 34,
            clicked: 12
          },
          created_at: new Date(Date.now() - 1209600000).toISOString()
        },
        {
          id: 'auto3',
          name: 'Reactivación Leads Inactivos',
          trigger: 'inactivity',
          template_id: 'template3',
          delay_hours: 72,
          conditions: [
            { field: 'last_activity', operator: 'older_than', value: '30_days' }
          ],
          is_active: false,
          stats: {
            triggered: 23,
            sent: 23,
            opened: 8,
            clicked: 2
          },
          created_at: new Date(Date.now() - 1814400000).toISOString()
        }
      ];
      setAutomations(mockAutomations);
    } catch (error) {
      console.error('Error fetching automations:', error);
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
          id: `email_camp${Date.now()}`,
          sent_at: null,
          metrics: {
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            bounced: 0,
            unsubscribed: 0,
            open_rate: 0,
            click_rate: 0,
            bounce_rate: 0
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

  const handleTemplateSubmit = async (e) => {
    e.preventDefault();
    try {
      const newTemplate = {
        ...templateFormData,
        id: `template${Date.now()}`,
        usage_count: 0,
        created_at: new Date().toISOString()
      };
      setTemplates([newTemplate, ...templates]);
      toast.success('Plantilla creada exitosamente');
      resetTemplateForm();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Error al guardar plantilla');
    }
  };

  const handleAutomationSubmit = async (e) => {
    e.preventDefault();
    try {
      const newAutomation = {
        ...automationFormData,
        id: `auto${Date.now()}`,
        stats: {
          triggered: 0,
          sent: 0,
          opened: 0,
          clicked: 0
        },
        created_at: new Date().toISOString()
      };
      setAutomations([newAutomation, ...automations]);
      toast.success('Automatización creada exitosamente');
      resetAutomationForm();
    } catch (error) {
      console.error('Error saving automation:', error);
      toast.error('Error al guardar automatización');
    }
  };

  const handleSendCampaign = async (campaignId) => {
    try {
      const updatedCampaigns = campaigns.map(campaign => 
        campaign.id === campaignId 
          ? { ...campaign, status: 'sending', sent_at: new Date().toISOString() }
          : campaign
      );
      setCampaigns(updatedCampaigns);
      toast.success('Campaña enviada exitosamente');
      
      // Simulate completion after 3 seconds
      setTimeout(() => {
        setCampaigns(prev => prev.map(campaign => 
          campaign.id === campaignId 
            ? { ...campaign, status: 'sent' }
            : campaign
        ));
      }, 3000);
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast.error('Error al enviar campaña');
    }
  };

  const toggleAutomation = async (automationId) => {
    try {
      const updatedAutomations = automations.map(automation => 
        automation.id === automationId 
          ? { ...automation, is_active: !automation.is_active }
          : automation
      );
      setAutomations(updatedAutomations);
      toast.success('Estado de automatización actualizado');
    } catch (error) {
      console.error('Error toggling automation:', error);
      toast.error('Error al actualizar automatización');
    }
  };

  const resetCampaignForm = () => {
    setCampaignFormData({
      name: '',
      subject: '',
      template_id: '',
      segment_id: '',
      send_type: 'immediate',
      scheduled_at: null,
      status: 'draft'
    });
    setSelectedCampaign(null);
    setIsCampaignDialogOpen(false);
  };

  const resetTemplateForm = () => {
    setTemplateFormData({
      name: '',
      subject: '',
      content: '',
      category: 'newsletter',
      is_active: true
    });
    setIsTemplateDialogOpen(false);
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

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) {
      try {
        setTemplates(templates.filter(t => t.id !== templateId));
        toast.success('Plantilla eliminada exitosamente');
      } catch (error) {
        console.error('Error deleting template:', error);
        toast.error('Error al eliminar plantilla');
      }
    }
  };

  const handleDeleteAutomation = async (automationId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta automatización?')) {
      try {
        setAutomations(automations.filter(a => a.id !== automationId));
        toast.success('Automatización eliminada exitosamente');
      } catch (error) {
        console.error('Error deleting automation:', error);
        toast.error('Error al eliminar automatización');
      }
    }
  };

  const resetAutomationForm = () => {
    setAutomationFormData({
      name: '',
      trigger: 'contact_created',
      template_id: '',
      delay_hours: 0,
      conditions: [],
      is_active: true
    });
    setIsAutomationDialogOpen(false);
  };

  const getTemplateName = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    return template ? template.name : 'Plantilla no encontrada';
  };

  const getSegmentName = (segmentId) => {
    const segment = mockSegments.find(s => s.id === segmentId);
    return segment ? segment.name : 'Segmento no encontrado';
  };

  const getStatusInfo = (status) => {
    return campaignStatuses.find(s => s.value === status) || campaignStatuses[0];
  };

  const getCategoryInfo = (category) => {
    return templateCategories.find(c => c.value === category) || templateCategories[0];
  };

  const getTriggerInfo = (trigger) => {
    return automationTriggers.find(t => t.value === trigger) || automationTriggers[0];
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getEmailStats = () => {
    const totalSent = campaigns.reduce((sum, c) => sum + (c.metrics?.sent || 0), 0);
    const totalOpened = campaigns.reduce((sum, c) => sum + (c.metrics?.opened || 0), 0);
    const totalClicked = campaigns.reduce((sum, c) => sum + (c.metrics?.clicked || 0), 0);
    const avgOpenRate = totalSent > 0 ? (totalOpened / totalSent * 100) : 0;
    const avgClickRate = totalSent > 0 ? (totalClicked / totalSent * 100) : 0;

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'sending').length,
      totalSent,
      avgOpenRate: avgOpenRate.toFixed(1),
      avgClickRate: avgClickRate.toFixed(1),
      totalTemplates: templates.length,
      activeAutomations: automations.filter(a => a.is_active).length
    };
  };

  const stats = getEmailStats();

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
          <h1 className="text-3xl font-bold text-gray-900">Email Marketing</h1>
          <p className="text-gray-600 mt-1">Crea, envía y automatiza campañas de email personalizadas</p>
        </div>
        <div className="flex items-center space-x-3">
          <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Nueva Plantilla
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nueva Plantilla</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleTemplateSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="template_name">Nombre de la Plantilla*</Label>
                    <Input
                      id="template_name"
                      value={templateFormData.name}
                      onChange={(e) => setTemplateFormData({...templateFormData, name: e.target.value})}
                      required
                      placeholder="Ej: Newsletter Mensual"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select value={templateFormData.category} onValueChange={(value) => setTemplateFormData({...templateFormData, category: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templateCategories.map(category => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template_subject">Línea de Asunto*</Label>
                  <Input
                    id="template_subject"
                    value={templateFormData.subject}
                    onChange={(e) => setTemplateFormData({...templateFormData, subject: e.target.value})}
                    required
                    placeholder="Usa variables como {{first_name}} o {{company_name}}"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template_content">Contenido HTML*</Label>
                  <Textarea
                    id="template_content"
                    value={templateFormData.content}
                    onChange={(e) => setTemplateFormData({...templateFormData, content: e.target.value})}
                    required
                    placeholder="Contenido HTML del email..."
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Variables disponibles: {'{first_name}'}, {'{last_name}'}, {'{company_name}'}, {'{email}'}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="template_active"
                    checked={templateFormData.is_active}
                    onCheckedChange={(checked) => setTemplateFormData({...templateFormData, is_active: checked})}
                  />
                  <Label htmlFor="template_active">Plantilla activa</Label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={resetTemplateForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                    Crear Plantilla
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Campaña
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {selectedCampaign ? 'Editar Campaña' : 'Nueva Campaña de Email'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCampaignSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign_name">Nombre de la Campaña*</Label>
                  <Input
                    id="campaign_name"
                    value={campaignFormData.name}
                    onChange={(e) => setCampaignFormData({...campaignFormData, name: e.target.value})}
                    required
                    placeholder="Ej: Newsletter Marzo 2025"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign_subject">Asunto del Email*</Label>
                  <Input
                    id="campaign_subject"
                    value={campaignFormData.subject}
                    onChange={(e) => setCampaignFormData({...campaignFormData, subject: e.target.value})}
                    required
                    placeholder="El asunto que verán los destinatarios"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Plantilla*</Label>
                    <Select value={campaignFormData.template_id} onValueChange={(value) => setCampaignFormData({...campaignFormData, template_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona plantilla" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.filter(t => t.is_active).map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Segmento*</Label>
                    <Select value={campaignFormData.segment_id} onValueChange={(value) => setCampaignFormData({...campaignFormData, segment_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona segmento" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockSegments.map(segment => (
                          <SelectItem key={segment.id} value={segment.id}>
                            {segment.name} ({segment.size} contactos)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Envío</Label>
                  <Select value={campaignFormData.send_type} onValueChange={(value) => setCampaignFormData({...campaignFormData, send_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Envío Inmediato</SelectItem>
                      <SelectItem value="scheduled">Programar Envío</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {campaignFormData.send_type === 'scheduled' && (
                  <div className="space-y-2">
                    <Label htmlFor="scheduled_at">Fecha y Hora de Envío</Label>
                    <Input
                      id="scheduled_at"
                      type="datetime-local"
                      value={campaignFormData.scheduled_at}
                      onChange={(e) => setCampaignFormData({...campaignFormData, scheduled_at: e.target.value})}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={resetCampaignForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                    {selectedCampaign ? 'Actualizar' : 'Crear'} Campaña
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="campaigns">Campañas</TabsTrigger>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
          <TabsTrigger value="automations">Automatización</TabsTrigger>
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
                    placeholder="Buscar campañas por nombre o asunto..."
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
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Campañas</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalCampaigns}</p>
                  </div>
                  <Mail className="h-8 w-8 text-indigo-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Enviando</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.activeCampaigns}</p>
                  </div>
                  <Send className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Emails Enviados</p>
                    <p className="text-2xl font-bold text-green-600">{stats.totalSent.toLocaleString()}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tasa Apertura</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.avgOpenRate}%</p>
                  </div>
                  <Eye className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tasa Click</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.avgClickRate}%</p>
                  </div>
                  <MousePointer className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Plantillas</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.totalTemplates}</p>
                  </div>
                  <FileText className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Automaciones</p>
                    <p className="text-2xl font-bold text-red-600">{stats.activeAutomations}</p>
                  </div>
                  <Zap className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaigns List */}
          <div className="space-y-4">
            {filteredCampaigns.map((campaign) => {
              const statusInfo = getStatusInfo(campaign.status);
              const metrics = campaign.metrics;

              return (
                <Card key={campaign.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-indigo-100 rounded-lg">
                          <Mail className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                          <p className="text-sm text-gray-600">{campaign.subject}</p>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                            <span>Plantilla: {getTemplateName(campaign.template_id)}</span>
                            <span>•</span>
                            <span>Segmento: {getSegmentName(campaign.segment_id)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                        {campaign.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => handleSendCampaign(campaign.id)}
                            className="bg-indigo-600 hover:bg-indigo-700"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Enviar
                          </Button>
                        )}
                        {campaign.status === 'scheduled' && (
                          <div className="text-sm text-gray-600">
                            <Clock className="h-4 w-4 inline mr-1" />
                            {new Date(campaign.scheduled_at).toLocaleString('es-ES')}
                          </div>
                        )}
                      </div>
                    </div>

                    {(campaign.status === 'sent' || campaign.status === 'sending') && (
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Enviados</p>
                          <p className="text-lg font-semibold">{metrics.sent.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Entregados</p>
                          <p className="text-lg font-semibold">{metrics.delivered.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Abiertos</p>
                          <p className="text-lg font-semibold text-blue-600">{metrics.opened.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{metrics.open_rate}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Clicks</p>
                          <p className="text-lg font-semibold text-purple-600">{metrics.clicked.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{metrics.click_rate}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Rebotes</p>
                          <p className="text-lg font-semibold text-red-600">{metrics.bounced}</p>
                          <p className="text-xs text-gray-500">{metrics.bounce_rate}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Bajas</p>
                          <p className="text-lg font-semibold text-gray-600">{metrics.unsubscribed}</p>
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-end mt-4 pt-4 border-t">
                      <div className="flex items-center space-x-1">
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
                          onClick={() => handleDeleteCampaign(campaign.id)}
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

          {filteredCampaigns.length === 0 && (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron campañas
              </h3>
              <p className="text-gray-500 mb-4">
                Crea tu primera campaña de email marketing
              </p>
              <Button 
                onClick={() => setIsCampaignDialogOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Campaña
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => {
              const categoryInfo = getCategoryInfo(template.category);
              return (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{categoryInfo.label}</Badge>
                        {template.is_active ? (
                          <Badge className="bg-green-100 text-green-800">Activa</Badge>
                        ) : (
                          <Badge variant="secondary">Inactiva</Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription>{template.subject}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600">
                        <p><strong>Usado:</strong> {template.usage_count} veces</p>
                        <p><strong>Creado:</strong> {new Date(template.created_at).toLocaleDateString('es-ES')}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 font-medium mb-2">Vista Previa:</p>
                        <div 
                          className="text-xs text-gray-700 max-h-20 overflow-hidden"
                          dangerouslySetInnerHTML={{
                            __html: template.content.substring(0, 200) + '...'
                          }}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Vista Previa
                        </Button>
                        <Button size="sm" variant="outline">
                          <Copy className="h-4 w-4 mr-1" />
                          Duplicar
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="automations" className="space-y-6">
          {/* Automations Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Automatizaciones</h2>
              <p className="text-gray-600">Configura emails automáticos basados en triggers</p>
            </div>
            <Dialog open={isAutomationDialogOpen} onOpenChange={setIsAutomationDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Automatización
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Automatización</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAutomationSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="automation_name">Nombre de la Automatización*</Label>
                    <Input
                      id="automation_name"
                      value={automationFormData.name}
                      onChange={(e) => setAutomationFormData({...automationFormData, name: e.target.value})}
                      required
                      placeholder="Ej: Bienvenida Nuevos Contactos"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Trigger*</Label>
                      <Select value={automationFormData.trigger} onValueChange={(value) => setAutomationFormData({...automationFormData, trigger: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {automationTriggers.map(trigger => (
                            <SelectItem key={trigger.value} value={trigger.value}>
                              {trigger.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Plantilla*</Label>
                      <Select value={automationFormData.template_id} onValueChange={(value) => setAutomationFormData({...automationFormData, template_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona plantilla" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.filter(t => t.is_active).map(template => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Retraso (horas)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={automationFormData.delay_hours}
                      onChange={(e) => setAutomationFormData({...automationFormData, delay_hours: parseInt(e.target.value) || 0})}
                      placeholder="0 = inmediato"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="automation_active"
                      checked={automationFormData.is_active}
                      onCheckedChange={(checked) => setAutomationFormData({...automationFormData, is_active: checked})}
                    />
                    <Label htmlFor="automation_active">Automatización activa</Label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="outline" onClick={resetAutomationForm}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                      Crear Automatización
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Automations List */}
          <div className="space-y-4">
            {automations.map((automation) => {
              const triggerInfo = getTriggerInfo(automation.trigger);
              const stats = automation.stats;

              return (
                <Card key={automation.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <Zap className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{automation.name}</h3>
                          <p className="text-sm text-gray-600">
                            Trigger: {triggerInfo.label} | Plantilla: {getTemplateName(automation.template_id)}
                          </p>
                          {automation.delay_hours > 0 && (
                            <p className="text-sm text-gray-500">
                              Retraso: {automation.delay_hours} horas
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Switch
                          checked={automation.is_active}
                          onCheckedChange={() => toggleAutomation(automation.id)}
                        />
                        <Badge className={automation.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {automation.is_active ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Activaciones</p>
                        <p className="text-lg font-semibold">{stats.triggered}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Enviados</p>
                        <p className="text-lg font-semibold">{stats.sent}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Abiertos</p>
                        <p className="text-lg font-semibold text-blue-600">{stats.opened}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Clicks</p>
                        <p className="text-lg font-semibold text-purple-600">{stats.clicked}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Email Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Rendimiento por Campaña
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns.filter(c => c.status === 'sent').map(campaign => (
                    <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-gray-600">{campaign.metrics.sent} enviados</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-600">{campaign.metrics.open_rate}% abiertos</p>
                        <p className="text-sm text-purple-600">{campaign.metrics.click_rate}% clicks</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Top Plantillas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {templates
                    .sort((a, b) => b.usage_count - a.usage_count)
                    .slice(0, 5)
                    .map(template => (
                    <div key={template.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-gray-600">{getCategoryInfo(template.category).label}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{template.usage_count} usos</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailMarketing;