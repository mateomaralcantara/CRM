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
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

// Import Lucide React icons
import {
  Plus,
  Search,
  Filter,
  Users,
  UserPlus,
  Crown,
  Shield,
  User,
  Mail,
  Phone,
  Calendar,
  Edit,
  Trash2,
  MoreHorizontal,
  Settings,
  Key,
  Activity,
  Award,
  Target,
  TrendingUp
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Teams = () => {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    department: '',
    phone: '',
    is_active: true
  });
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    description: '',
    leader_id: '',
    members: []
  });

  const roles = [
    { value: 'admin', label: 'Administrador', color: 'bg-red-100 text-red-800', icon: Crown },
    { value: 'manager', label: 'Manager', color: 'bg-purple-100 text-purple-800', icon: Shield },
    { value: 'user', label: 'Usuario', color: 'bg-blue-100 text-blue-800', icon: User },
    { value: 'viewer', label: 'Observador', color: 'bg-gray-100 text-gray-800', icon: User }
  ];

  const departments = [
    'Ventas',
    'Marketing', 
    'Soporte',
    'Desarrollo',
    'Administración',
    'Recursos Humanos',
    'Finanzas'
  ];

  useEffect(() => {
    fetchUsers();
    fetchTeams();
  }, []);

  const fetchUsers = async () => {
    try {
      // Mock users for demo - in real app this would be an API call
      const mockUsers = [
        {
          id: 'user1',
          name: 'Usuario Demo',
          email: 'demo@crm.com',
          role: 'admin',
          department: 'Administración',
          phone: '+34 123 456 789',
          is_active: true,
          created_at: new Date().toISOString(),
          last_activity: new Date().toISOString()
        },
        {
          id: 'user2',
          name: 'Ana Martínez',
          email: 'ana.martinez@crm.com',
          role: 'manager',
          department: 'Ventas',
          phone: '+34 987 654 321',
          is_active: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          last_activity: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'user3',
          name: 'Carlos López',
          email: 'carlos.lopez@crm.com',
          role: 'user',
          department: 'Marketing',
          phone: '+34 555 123 456',
          is_active: true,
          created_at: new Date(Date.now() - 172800000).toISOString(),
          last_activity: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: 'user4',
          name: 'María García',
          email: 'maria.garcia@crm.com',
          role: 'user',
          department: 'Soporte',
          phone: '+34 777 888 999',
          is_active: false,
          created_at: new Date(Date.now() - 259200000).toISOString(),
          last_activity: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      // Mock teams for demo
      const mockTeams = [
        {
          id: 'team1',
          name: 'Equipo de Ventas',
          description: 'Responsable de las ventas y captación de clientes',
          leader_id: 'user2',
          members: ['user1', 'user2', 'user3'],
          created_at: new Date().toISOString()
        },
        {
          id: 'team2', 
          name: 'Equipo de Marketing',
          description: 'Gestiona campañas de marketing y lead generation',
          leader_id: 'user3',
          members: ['user3', 'user4'],
          created_at: new Date().toISOString()
        }
      ];
      setTeams(mockTeams);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        // Update user - mock implementation
        const updatedUsers = users.map(u => 
          u.id === selectedUser.id 
            ? { ...u, ...userFormData, updated_at: new Date().toISOString() }
            : u
        );
        setUsers(updatedUsers);
        toast.success('Usuario actualizado exitosamente');
      } else {
        // Create new user - mock implementation
        const newUser = {
          ...userFormData,
          id: `user${Date.now()}`,
          created_at: new Date().toISOString(),
          last_activity: new Date().toISOString()
        };
        setUsers([newUser, ...users]);
        toast.success('Usuario creado exitosamente');
      }
      resetUserForm();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Error al guardar usuario');
    }
  };

  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    try {
      const newTeam = {
        ...teamFormData,
        id: `team${Date.now()}`,
        created_at: new Date().toISOString()
      };
      setTeams([newTeam, ...teams]);
      toast.success('Equipo creado exitosamente');
      resetTeamForm();
    } catch (error) {
      console.error('Error saving team:', error);
      toast.error('Error al guardar equipo');
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || '',
      phone: user.phone || '',
      is_active: user.is_active
    });
    setIsUserDialogOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      try {
        setUsers(users.filter(u => u.id !== userId));
        toast.success('Usuario eliminado exitosamente');
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Error al eliminar usuario');
      }
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este equipo?')) {
      try {
        setTeams(teams.filter(t => t.id !== teamId));
        toast.success('Equipo eliminado exitosamente');
      } catch (error) {
        console.error('Error deleting team:', error);
        toast.error('Error al eliminar equipo');
      }
    }
  };

  const toggleUserStatus = async (userId) => {
    try {
      const updatedUsers = users.map(user => 
        user.id === userId 
          ? { ...user, is_active: !user.is_active }
          : user
      );
      setUsers(updatedUsers);
      toast.success('Estado del usuario actualizado');
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Error al actualizar estado');
    }
  };

  const resetUserForm = () => {
    setUserFormData({
      name: '',
      email: '',
      role: 'user',
      department: '',
      phone: '',
      is_active: true
    });
    setSelectedUser(null);
    setIsUserDialogOpen(false);
  };

  const resetTeamForm = () => {
    setTeamFormData({
      name: '',
      description: '',
      leader_id: '',
      members: []
    });
    setIsTeamDialogOpen(false);
  };

  const getRoleInfo = (role) => {
    return roles.find(r => r.value === role) || roles[2];
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Usuario no encontrado';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getUserStats = () => {
    return {
      total: users.length,
      active: users.filter(u => u.is_active).length,
      inactive: users.filter(u => !u.is_active).length,
      admins: users.filter(u => u.role === 'admin').length,
      managers: users.filter(u => u.role === 'manager').length,
      regular: users.filter(u => u.role === 'user').length
    };
  };

  const stats = getUserStats();

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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Equipos</h1>
          <p className="text-gray-600 mt-1">Administra usuarios, roles y equipos de trabajo</p>
        </div>
        <div className="flex items-center space-x-3">
          <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Nuevo Equipo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Equipo</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleTeamSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="team_name">Nombre del Equipo*</Label>
                  <Input
                    id="team_name"
                    value={teamFormData.name}
                    onChange={(e) => setTeamFormData({...teamFormData, name: e.target.value})}
                    required
                    placeholder="Ej: Equipo de Ventas"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team_description">Descripción</Label>
                  <Textarea
                    id="team_description"
                    value={teamFormData.description}
                    onChange={(e) => setTeamFormData({...teamFormData, description: e.target.value})}
                    placeholder="Describe las responsabilidades del equipo..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leader_id">Líder del Equipo</Label>
                  <Select value={teamFormData.leader_id} onValueChange={(value) => setTeamFormData({...teamFormData, leader_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un líder" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter(u => u.is_active && ['admin', 'manager'].includes(u.role)).map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} - {user.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={resetTeamForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Crear Equipo
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUserSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo*</Label>
                    <Input
                      id="name"
                      value={userFormData.name}
                      onChange={(e) => setUserFormData({...userFormData, name: e.target.value})}
                      required
                      placeholder="Juan Pérez"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email*</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userFormData.email}
                      onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                      required
                      placeholder="juan@empresa.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Rol*</Label>
                    <Select value={userFormData.role} onValueChange={(value) => setUserFormData({...userFormData, role: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Departamento</Label>
                    <Select value={userFormData.department} onValueChange={(value) => setUserFormData({...userFormData, department: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(dept => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={userFormData.phone}
                    onChange={(e) => setUserFormData({...userFormData, phone: e.target.value})}
                    placeholder="+34 123 456 789"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={userFormData.is_active}
                    onCheckedChange={(checked) => setUserFormData({...userFormData, is_active: checked})}
                  />
                  <Label htmlFor="is_active">Usuario activo</Label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={resetUserForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {selectedUser ? 'Actualizar' : 'Crear'} Usuario
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="teams">Equipos</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    className="pl-10"
                    placeholder="Buscar usuarios por nombre, email o departamento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    {roles.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
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
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Activos</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Inactivos</p>
                    <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
                  </div>
                  <User className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Admins</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
                  </div>
                  <Crown className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Managers</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.managers}</p>
                  </div>
                  <Shield className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Usuarios</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.regular}</p>
                  </div>
                  <User className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Lista de Usuarios ({filteredUsers.length})</span>
                <Badge variant="secondary">{filteredUsers.length} de {users.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Última Actividad</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const roleInfo = getRoleInfo(user.role);
                      const RoleIcon = roleInfo.icon;
                      return (
                        <TableRow key={user.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                  {user.name.split(' ').map(n => n.charAt(0)).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900">{user.name}</p>
                                {user.phone && (
                                  <p className="text-sm text-gray-500">{user.phone}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-blue-600">
                              <Mail className="h-4 w-4 mr-1" />
                              <a href={`mailto:${user.email}`} className="hover:underline">
                                {user.email}
                              </a>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={roleInfo.color}>
                              <RoleIcon className="h-3 w-3 mr-1" />
                              {roleInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.department && (
                              <Badge variant="outline">{user.department}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={user.is_active}
                                onCheckedChange={() => toggleUserStatus(user.id)}
                                size="sm"
                              />
                              <Badge variant={user.is_active ? 'default' : 'secondary'}>
                                {user.is_active ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-500">
                              {new Date(user.last_activity).toLocaleString('es-ES')}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id)}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          {/* Teams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <Card key={team.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{team.name}</span>
                    <Badge variant="secondary">{team.members.length} miembros</Badge>
                  </CardTitle>
                  <CardDescription>{team.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Líder del Equipo</p>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                            {getUserName(team.leader_id).split(' ').map(n => n.charAt(0)).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{getUserName(team.leader_id)}</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Miembros</p>
                      <div className="flex flex-wrap gap-1">
                        {team.members.slice(0, 5).map((memberId) => (
                          <Avatar key={memberId} className="h-6 w-6">
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                              {getUserName(memberId).split(' ').map(n => n.charAt(0)).join('')}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {team.members.length > 5 && (
                          <div className="h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs text-gray-600">+{team.members.length - 5}</span>
                          </div>
                        )}
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
                        onClick={() => handleDeleteTeam(team.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {teams.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tienes equipos creados aún
              </h3>
              <p className="text-gray-500 mb-4">
                Crea tu primer equipo para organizar mejor a tus usuarios
              </p>
              <Button 
                onClick={() => setIsTeamDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Equipo
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Teams;