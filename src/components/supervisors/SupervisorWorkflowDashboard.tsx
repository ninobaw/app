import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Eye, 
  Search, 
  Filter, 
  FileText, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Users,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';
import SupervisorWorkflowReview from '../workflow/SupervisorWorkflowReview';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface WorkflowSummary {
  id: string;
  correspondanceSubject: string;
  currentStatus: string;
  assignedDirector: {
    firstName: string;
    lastName: string;
    role: string;
  };
  assignedDG: {
    firstName: string;
    lastName: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
  priority: string;
  messagesCount: number;
  actionsCount: number;
}

const SupervisorWorkflowDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [filteredWorkflows, setFilteredWorkflows] = useState<WorkflowSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  useEffect(() => {
    filterWorkflows();
  }, [workflows, searchTerm, statusFilter]);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      // Cette route devra être créée dans le backend
      const response = await api.get('/api/enhanced-workflow/supervisor/list');
      
      if (response.data.success) {
        setWorkflows(response.data.data);
        console.log('📋 Workflows superviseur chargés:', response.data.data.length);
      }
    } catch (error) {
      console.error('❌ Erreur chargement workflows:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les workflows",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterWorkflows = () => {
    let filtered = workflows;

    // Filtrer par terme de recherche
    if (searchTerm.trim()) {
      filtered = filtered.filter(workflow =>
        workflow.correspondanceSubject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${workflow.assignedDirector.firstName} ${workflow.assignedDirector.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${workflow.assignedDG.firstName} ${workflow.assignedDG.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrer par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(workflow => workflow.currentStatus === statusFilter);
    }

    setFilteredWorkflows(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DG_APPROVED': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'FINAL_RESPONSE_READY': return 'bg-purple-100 text-purple-800';
      case 'DG_REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'DG_FEEDBACK': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'DG_APPROVED': 'Approuvé DG',
      'COMPLETED': 'Terminé',
      'FINAL_RESPONSE_READY': 'Réponse Finale Prête',
      'DG_REVIEW': 'En Révision DG',
      'DG_FEEDBACK': 'Feedback DG',
      'ASSIGNED_TO_DIRECTOR': 'Assigné Directeur',
      'DIRECTOR_DRAFT': 'Brouillon Directeur'
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canReviewWorkflow = (status: string) => {
    return ['DG_APPROVED', 'COMPLETED', 'FINAL_RESPONSE_READY'].includes(status);
  };

  if (loading) {
    return (
      <Card className="h-64">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Chargement des workflows...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Dashboard Superviseur - Workflows de Correspondances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{workflows.length}</div>
              <div className="text-sm text-blue-700">Total Workflows</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {workflows.filter(w => w.currentStatus === 'DG_APPROVED').length}
              </div>
              <div className="text-sm text-green-700">Approuvés DG</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {workflows.filter(w => w.currentStatus === 'FINAL_RESPONSE_READY').length}
              </div>
              <div className="text-sm text-purple-700">Réponses Finales</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {workflows.filter(w => w.currentStatus === 'DG_FEEDBACK').length}
              </div>
              <div className="text-sm text-orange-700">En Discussion</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par sujet, directeur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="DG_APPROVED">Approuvé DG</option>
                <option value="COMPLETED">Terminé</option>
                <option value="FINAL_RESPONSE_READY">Réponse Finale</option>
                <option value="DG_FEEDBACK">En Discussion</option>
                <option value="DG_REVIEW">En Révision DG</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des workflows */}
      <Card>
        <CardHeader>
          <CardTitle>
            Workflows ({filteredWorkflows.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredWorkflows.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucun workflow trouvé</p>
              <p className="text-sm text-gray-400">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Essayez de modifier vos filtres' 
                  : 'Les workflows apparaîtront ici une fois créés'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWorkflows.map((workflow) => (
                <div key={workflow.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-lg truncate">
                          {workflow.correspondanceSubject}
                        </h3>
                        <Badge className={getStatusColor(workflow.currentStatus)}>
                          {getStatusLabel(workflow.currentStatus)}
                        </Badge>
                        <Badge className={getPriorityColor(workflow.priority)}>
                          {workflow.priority}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>
                            Directeur: {workflow.assignedDirector.firstName} {workflow.assignedDirector.lastName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>
                            DG: {workflow.assignedDG.firstName} {workflow.assignedDG.lastName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          <span>{workflow.messagesCount} messages</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            Mis à jour: {new Date(workflow.updatedAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {canReviewWorkflow(workflow.currentStatus) ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              className="flex items-center gap-2"
                              onClick={() => setSelectedWorkflow(workflow.id)}
                            >
                              <Eye className="h-4 w-4" />
                              Réviser
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>
                                Révision Workflow - {workflow.correspondanceSubject}
                              </DialogTitle>
                            </DialogHeader>
                            {selectedWorkflow && (
                              <SupervisorWorkflowReview workflowId={selectedWorkflow} />
                            )}
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <Button size="sm" variant="outline" disabled>
                          <AlertCircle className="h-4 w-4 mr-2" />
                          En cours
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupervisorWorkflowDashboard;
