'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  Pill,
  UserCheck,
  Phone,
  FileText,
  Heart,
  Plus
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  type: 'medical' | 'care' | 'family' | 'documentation' | 'follow-up';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed';
  assignedTo: string;
  clientName: string;
  dueDate: Date;
  sourceCall?: string;
  confidence?: number;
  completed: boolean;
  createdAt: Date;
}

interface TaskManagementPanelProps {
  isRecording: boolean;
}

export function TaskManagementPanel({ isRecording }: TaskManagementPanelProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'urgent' | 'completed'>('all');
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Follow up on Dorothy\'s social engagement',
      description: 'Family reported resident feeling isolated and not participating in group activities. Assess current social engagement level and develop intervention plan.',
      type: 'care',
      priority: 'medium',
      status: 'pending',
      assignedTo: 'Sarah Martinez, Activity Coordinator',
      clientName: 'Dorothy Wilson',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 4),
      sourceCall: 'Margaret Wilson (Family) - 30 min ago',
      confidence: 85,
      completed: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30)
    },
    {
      id: '2',
      title: 'Medication schedule review required',
      description: 'Client confused about evening medication timing. Review schedule with nursing staff and provide clear written instructions for Perindopril dosing.',
      type: 'medical',
      priority: 'high',
      status: 'in-progress',
      assignedTo: 'Jennifer Lee, RN',
      clientName: 'Dorothy Wilson',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 2),
      sourceCall: 'Margaret Wilson (Family) - 30 min ago',
      confidence: 92,
      completed: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30)
    },
    {
      id: '3',
      title: 'Diabetes medication protocol update',
      description: 'Implement new Metformin dosage (1000mg twice daily) as prescribed. Monitor blood glucose levels frequently for one week and document readings.',
      type: 'medical',
      priority: 'urgent',
      status: 'pending',
      assignedTo: 'Michael Rodriguez, EN',
      clientName: 'Robert Martinez',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 1),
      sourceCall: 'Dr. Sarah Chen - 1 hour ago',
      confidence: 95,
      completed: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60)
    },
    {
      id: '4',
      title: 'Update care plan with HbA1c results',
      description: 'Enter HbA1c levels (8.2%) and medication changes into resident care plan. Schedule follow-up with GP in 4 weeks.',
      type: 'documentation',
      priority: 'medium',
      status: 'pending',
      assignedTo: 'Lisa Chang, Care Manager',
      clientName: 'Robert Martinez',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
      sourceCall: 'Dr. Sarah Chen - 1 hour ago',
      confidence: 88,
      completed: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60)
    },
    {
      id: '5',
      title: 'Completed weekly medication review',
      description: 'Conducted comprehensive medication review for all residents in Wing A. No immediate adjustments required. Next review scheduled for next week.',
      type: 'medical',
      priority: 'low',
      status: 'completed',
      assignedTo: 'Dr. Amanda Clark, Pharmacist',
      clientName: 'Multiple Residents',
      dueDate: new Date(Date.now() - 1000 * 60 * 60 * 12),
      sourceCall: 'Routine Review',
      completed: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
    }
  ]);

  const toggleTaskCompletion = (taskId: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId 
        ? { 
            ...task, 
            completed: !task.completed,
            status: !task.completed ? 'completed' : 'pending'
          }
        : task
    ));
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !task.completed && task.status !== 'completed';
    if (filter === 'urgent') return task.priority === 'urgent' && !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const getTypeIcon = (type: Task['type']) => {
    switch (type) {
      case 'medical': return <Pill className="h-4 w-4" />;
      case 'care': return <Heart className="h-4 w-4" />;
      case 'family': return <User className="h-4 w-4" />;
      case 'documentation': return <FileText className="h-4 w-4" />;
      case 'follow-up': return <Phone className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeUntilDue = (dueDate: Date) => {
    const now = new Date();
    const diff = dueDate.getTime() - now.getTime();
    const hours = Math.ceil(diff / (1000 * 60 * 60));
    
    if (hours < 0) return { text: 'Overdue', color: 'text-red-600' };
    if (hours === 0) return { text: 'Due now', color: 'text-orange-600' };
    if (hours < 24) return { text: `${hours}h remaining`, color: 'text-yellow-600' };
    return { text: `${Math.ceil(hours / 24)}d remaining`, color: 'text-green-600' };
  };

  const pendingCount = tasks.filter(t => !t.completed && t.status !== 'completed').length;
  const urgentCount = tasks.filter(t => t.priority === 'urgent' && !t.completed).length;
  const completedTodayCount = tasks.filter(t => 
    t.completed && 
    t.createdAt.toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="h-full flex flex-col">
      {/* Stats and Controls */}
      <div className="p-4 space-y-4">
        {/* Quick Stats */}
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <Badge variant="outline" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {urgentCount} Urgent
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {pendingCount} Pending
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              {completedTodayCount} Done Today
            </Badge>
          </div>
          
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(value) => setFilter(value as 'all' | 'pending' | 'urgent' | 'completed')}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({tasks.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
            <TabsTrigger value="urgent">Urgent ({urgentCount})</TabsTrigger>
            <TabsTrigger value="completed">Done ({tasks.filter(t => t.completed).length})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Live Task Generation Notice */}
        {isRecording && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <span className="text-sm text-blue-700 font-medium">
              Live call in progress - tasks will be generated automatically
            </span>
          </div>
        )}
      </div>

      {/* Task List */}
      <ScrollArea className="flex-1">
        <div className="space-y-3 p-4 pt-0">
          {filteredTasks.map((task) => (
            <Card key={task.id} className={`${task.completed ? 'opacity-75 bg-muted/20' : ''} hover:shadow-md transition-shadow`}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTaskCompletion(task.id)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 space-y-2">
                    {/* Task Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(task.type)}
                        <h4 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(task.priority)} variant="outline">
                          {task.priority}
                        </Badge>
                        <Badge className={getStatusColor(task.status)} variant="secondary">
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Task Description */}
                    <p className={`text-sm ${task.completed ? 'text-muted-foreground' : 'text-gray-600'}`}>
                      {task.description}
                    </p>
                    
                    {/* Task Metadata */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <User className="h-3 w-3" />
                          <span>Client:</span>
                        </div>
                        <p className="font-medium text-xs">{task.clientName}</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <UserCheck className="h-3 w-3" />
                          <span>Assigned:</span>
                        </div>
                        <p className="font-medium text-xs">{task.assignedTo}</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <Calendar className="h-3 w-3" />
                          <span>Due:</span>
                        </div>
                        <p className={`font-medium text-xs ${getTimeUntilDue(task.dueDate).color}`}>
                          {getTimeUntilDue(task.dueDate).text}
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <Phone className="h-3 w-3" />
                          <span>Source:</span>
                        </div>
                        <p className="font-medium text-xs">{task.sourceCall || 'Manual entry'}</p>
                      </div>
                    </div>

                    {/* AI Confidence Score */}
                    {task.confidence && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">AI Confidence:</span>
                        <Badge variant="outline" className="text-xs">
                          {task.confidence}%
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {!task.completed && (
                <CardContent className="pt-0">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button size="sm" onClick={() => toggleTaskCompletion(task.id)}>
                      Mark Complete
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}

          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-muted-foreground mb-2">No tasks found</h3>
              <p className="text-sm text-muted-foreground">
                {filter === 'all' ? 'All tasks are completed!' : `No ${filter} tasks at the moment.`}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}