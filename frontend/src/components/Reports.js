import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

// Import Shadcn UI components
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';

// Import Lucide React icons
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  DollarSign,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Activity,
  Mail,
  Phone,
  Award,
  Zap,
  Eye,
  MousePointer,
  ArrowUpRight,
  ArrowDownRight,
  Percent
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('last_30_days');
  const [reportData, setReportData] = useState(null);

  const dateRangeOptions = [
    { value: 'today', label: 'Hoy' },
    { value: 'yesterday', label: 'Ayer' },
    { value: 'last_7_days', label: 'Últimos 7 días' },
    { value: 'last_30_days', label: 'Últimos 30 días' },
    { value: 'last_90_days', label: 'Últimos 90 días' },
    { value: 'this_month', label: 'Este mes' },
    { value: 'last_month', label: 'Mes pasado' },
    { value: 'this_quarter', label: 'Este trimestre' },
    { value: 'this_year', label: 'Este año' }
  ];

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Mock comprehensive report data
      const mockReportData = {
        summary: {
          totalContacts: 156,
          totalLeads: 89,
          totalDeals: 23,
          totalRevenue: 145000,
          conversionRate: 26.4,
          avgDealSize: 6300,
          totalActivities: 234,
          completedActivities: 187
        },
        trends: {
          contacts: { current: 156, previous: 142, change: 9.9 },
          leads: { current: 89, previous: 76, change: 17.1 },
          deals: { current: 23, previous: 19, change: 21.1 },
          revenue: { current: 145000, previous: 124500, change: 16.5 }
        },
        salesFunnel: {
          visitors: 5420,
          leads: 542,
          opportunities: 89,
          customers: 23,
          conversionRates: {
            visitorsToLeads: 10.0,
            leadsToOpportunities: 16.4,
            opportunitiesToCustomers: 25.8,
            overallConversion: 0.42
          }
        },
        leadSources: [
          { source: 'Website', count: 34, percentage: 38.2 },
          { source: 'Social Media', count: 21, percentage: 23.6 },
          { source: 'Email Marketing', count: 15, percentage: 16.9 },
          { source: 'Referral', count: 12, percentage: 13.5 },
          { source: 'Cold Calling', count: 7, percentage: 7.8 }
        ],
        dealStages: [
          { stage: 'Prospección', count: 45, value: 89000 },
          { stage: 'Calificación', count: 23, value: 67000 },
          { stage: 'Propuesta', count: 15, value: 78000 },
          { stage: 'Negociación', count: 8, value: 45000 },
          { stage: 'Cerrado Ganado', count: 23, value: 145000 },
          { stage: 'Cerrado Perdido', count: 12, value: 34000 }
        ],
        activityMetrics: {
          totalActivities: 234,
          completedActivities: 187,
          completionRate: 79.9,
          byType: [
            { type: 'Llamadas', count: 89, completed: 76 },
            { type: 'Emails', count: 67, completed: 58 },
            { type: 'Reuniones', count: 34, completed: 28 },
            { type: 'Tareas', count: 44, completed: 25 }
          ]
        },
        emailMetrics: {
          campaignsSent: 12,
          totalEmails: 15420,
          delivered: 14967,
          opened: 4789,
          clicked: 956,
          bounced: 453,
          unsubscribed: 78,
          deliveryRate: 97.1,
          openRate: 32.0,
          clickRate: 6.4,
          bounceRate: 2.9
        },
        topPerformers: {
          users: [
            { name: 'Ana Martínez', deals: 12, revenue: 67000 },
            { name: 'Carlos López', deals: 8, revenue: 45000 },
            { name: 'Usuario Demo', deals: 6, revenue: 33000 }
          ],
          campaigns: [
            { name: 'Newsletter Marzo 2025', opens: 1250, clicks: 340, ctr: 27.2 },
            { name: 'Promoción CRM Pro', opens: 890, clicks: 187, ctr: 21.0 },
            { name: 'Webinar Automation', opens: 675, clicks: 98, ctr: 14.5 }
          ]
        },
        revenueAnalysis: {
          monthlyRevenue: [
            { month: 'Enero', revenue: 89000, deals: 15 },
            { month: 'Febrero', revenue: 124000, deals: 19 },
            { month: 'Marzo', revenue: 145000, deals: 23 }
          ],
          revenueBySource: [
            { source: 'Nuevos Clientes', revenue: 89000, percentage: 61.4 },
            { source: 'Clientes Existentes', revenue: 56000, percentage: 38.6 }
          ]
        }
      };

      setReportData(mockReportData);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Error al cargar datos de reportes');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatPercentage = (value, decimals = 1) => {
    return `${value.toFixed(decimals)}%`;
  };

  const getChangeIndicator = (change) => {
    if (change > 0) {
      return (
        <div className="flex items-center text-green-600">
          <ArrowUpRight className="h-4 w-4 mr-1" />
          <span>+{formatPercentage(change)}</span>
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center text-red-600">
          <ArrowDownRight className="h-4 w-4 mr-1" />
          <span>{formatPercentage(change)}</span>
        </div>
      );
    }
    return <span className="text-gray-500">Sin cambios</span>;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Reportes y Analíticas</h1>
          <p className="text-gray-600 mt-1">Análisis completo del rendimiento de tu CRM</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchReportData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="sales">Ventas</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="activities">Actividades</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Contactos</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData?.summary.totalContacts}</p>
                    {reportData?.trends.contacts && getChangeIndicator(reportData.trends.contacts.change)}
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Leads</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData?.summary.totalLeads}</p>
                    {reportData?.trends.leads && getChangeIndicator(reportData.trends.leads.change)}
                  </div>
                  <Target className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Oportunidades</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData?.summary.totalDeals}</p>
                    {reportData?.trends.deals && getChangeIndicator(reportData.trends.deals.change)}
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(reportData?.summary.totalRevenue || 0)}
                    </p>
                    {reportData?.trends.revenue && getChangeIndicator(reportData.trends.revenue.change)}
                  </div>
                  <DollarSign className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sales Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Embudo de Ventas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{reportData?.salesFunnel.visitors?.toLocaleString()}</div>
                  <p className="text-sm text-gray-600 mt-1">Visitantes</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{reportData?.salesFunnel.leads}</div>
                  <p className="text-sm text-gray-600 mt-1">Leads</p>
                  <p className="text-xs text-green-600 mt-1">
                    {formatPercentage(reportData?.salesFunnel.conversionRates.visitorsToLeads || 0)} conversión
                  </p>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{reportData?.salesFunnel.opportunities}</div>
                  <p className="text-sm text-gray-600 mt-1">Oportunidades</p>
                  <p className="text-xs text-purple-600 mt-1">
                    {formatPercentage(reportData?.salesFunnel.conversionRates.leadsToOpportunities || 0)} conversión
                  </p>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">{reportData?.salesFunnel.customers}</div>
                  <p className="text-sm text-gray-600 mt-1">Clientes</p>
                  <p className="text-xs text-orange-600 mt-1">
                    {formatPercentage(reportData?.salesFunnel.conversionRates.opportunitiesToCustomers || 0)} conversión
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Tasa de Conversión Global:</span>
                  <span className="text-lg font-bold text-indigo-600">
                    {formatPercentage(reportData?.salesFunnel.conversionRates.overallConversion || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lead Sources & Deal Stages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fuentes de Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData?.leadSources.map((source, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{source.source}</span>
                        <span>{source.count} ({formatPercentage(source.percentage)})</span>
                      </div>
                      <Progress value={source.percentage} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pipeline por Etapas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData?.dealStages.map((stage, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{stage.stage}</p>
                        <p className="text-sm text-gray-600">{stage.count} oportunidades</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(stage.value)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          {/* Revenue Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tasa de Conversión</p>
                    <p className="text-3xl font-bold text-green-600">
                      {formatPercentage(reportData?.summary.conversionRate || 0)}
                    </p>
                  </div>
                  <Percent className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Deal Promedio</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {formatCurrency(reportData?.summary.avgDealSize || 0)}
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Deals Cerrados</p>
                    <p className="text-3xl font-bold text-orange-600">{reportData?.summary.totalDeals}</p>
                  </div>
                  <Target className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Revenue */}
          <Card>
            <CardHeader>
              <CardTitle>Ingresos Mensuales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reportData?.revenueAnalysis.monthlyRevenue.map((month, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg">{month.month}</h3>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(month.revenue)}</p>
                    <p className="text-sm text-gray-600">{month.deals} deals cerrados</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Revenue by Source */}
          <Card>
            <CardHeader>
              <CardTitle>Ingresos por Fuente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData?.revenueAnalysis.revenueBySource.map((source, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{source.source}</span>
                      <span className="font-bold">{formatCurrency(source.revenue)} ({formatPercentage(source.percentage)})</span>
                    </div>
                    <Progress value={source.percentage} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketing" className="space-y-6">
          {/* Email Marketing Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Emails Enviados</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData?.emailMetrics.totalEmails?.toLocaleString()}
                    </p>
                  </div>
                  <Mail className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tasa Entrega</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatPercentage(reportData?.emailMetrics.deliveryRate || 0)}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tasa Apertura</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatPercentage(reportData?.emailMetrics.openRate || 0)}
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tasa Click</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatPercentage(reportData?.emailMetrics.clickRate || 0)}
                    </p>
                  </div>
                  <MousePointer className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Email Metrics Details */}
          <Card>
            <CardHeader>
              <CardTitle>Métricas Detalladas de Email</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{reportData?.emailMetrics.delivered?.toLocaleString()}</div>
                  <p className="text-sm text-gray-600">Entregados</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{reportData?.emailMetrics.opened?.toLocaleString()}</div>
                  <p className="text-sm text-gray-600">Abiertos</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{reportData?.emailMetrics.clicked?.toLocaleString()}</div>
                  <p className="text-sm text-gray-600">Clicks</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">{reportData?.emailMetrics.bounced}</div>
                  <p className="text-sm text-gray-600">Rebotes</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-600">{reportData?.emailMetrics.unsubscribed}</div>
                  <p className="text-sm text-gray-600">Bajas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle>Mejores Campañas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData?.topPerformers.campaigns.map((campaign, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{campaign.name}</h3>
                      <p className="text-sm text-gray-600">{campaign.opens} aperturas • {campaign.clicks} clicks</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{formatPercentage(campaign.ctr)} CTR</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-6">
          {/* Activity Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Actividades</p>
                    <p className="text-3xl font-bold text-gray-900">{reportData?.activityMetrics.totalActivities}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completadas</p>
                    <p className="text-3xl font-bold text-green-600">{reportData?.activityMetrics.completedActivities}</p>
                  </div>
                  <Target className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tasa Completación</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {formatPercentage(reportData?.activityMetrics.completionRate || 0)}
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activities by Type */}
          <Card>
            <CardHeader>
              <CardTitle>Actividades por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData?.activityMetrics.byType.map((type, index) => {
                  const completionRate = (type.completed / type.count) * 100;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{type.type}</span>
                        <span>{type.completed}/{type.count} ({formatPercentage(completionRate)})</span>
                      </div>
                      <Progress value={completionRate} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performers - Usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData?.topPerformers.users.map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-semibold">{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.deals} deals cerrados</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{formatCurrency(user.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Rendimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Tiempo promedio de conversión</span>
                    <span className="font-bold">24 días</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Actividades por lead</span>
                    <span className="font-bold">2.6</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Valor promedio por cliente</span>
                    <span className="font-bold">{formatCurrency(6300)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span>ROI de marketing</span>
                    <span className="font-bold text-green-600">312%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Objetivos vs Resultados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span>Leads mensuales</span>
                      <span>89/100</span>
                    </div>
                    <Progress value={89} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span>Deals mensuales</span>
                      <span>23/20</span>
                    </div>
                    <Progress value={100} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span>Ingresos mensuales</span>
                      <span>{formatCurrency(145000)}/{formatCurrency(120000)}</span>
                    </div>
                    <Progress value={100} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span>Tasa de conversión</span>
                      <span>26.4%/25%</span>
                    </div>
                    <Progress value={100} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;