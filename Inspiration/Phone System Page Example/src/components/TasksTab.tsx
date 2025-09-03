import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Checkbox } from './ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
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
  Heart
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  type: 'medical' | 'care' | 'family' | 'documentation' | 'follow-up';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed';
  assignedTo: string;
  residentName: string;
  dueDate: Date;
  sourceCall: string;
  completed: boolean;
}

export function TasksTab() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Check on Dorothy Wilson - Social Engagement',
      description: 'Family reports resident feeling lonely and not participating in activities. Assess current social engagement and develop intervention plan.',
      type: 'care',
      priority: 'medium',
      status: 'pending',
      assignedTo: 'Sarah Martinez, Activity Coordinator',
      residentName: 'Dorothy Wilson',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 4),
      sourceCall: 'Margaret Wilson (Family) - 15 min ago',
      completed: false
    },
    {
      id: '2',
      title: 'Medication Review - Evening Pills Schedule',
      description: 'Resident confused about evening medication timing. Review schedule with nursing staff and provide clear written instructions.',
      type: 'medical',
      priority: 'high',
      status: 'pending',
      assignedTo: 'Nurse Jennifer Lee',
      residentName: 'Dorothy Wilson',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 2),
      sourceCall: 'Margaret Wilson (Family) - 15 min ago',
      completed: false
    },
    {
      id: '3',
      title: 'Update Diabetes Medication Protocol',
      description: 'Implement new Metformin dosage (1000mg twice daily) as prescribed by Dr. Chen. Monitor blood glucose levels frequently for one week.',
      type: 'medical',
      priority: 'urgent',
      status: 'in-progress',
      assignedTo: 'Nurse Michael Rodriguez',
      residentName: 'Robert Martinez',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 1),
      sourceCall: 'Dr. Sarah Chen - 45 min ago',
      completed: false
    },
    {
      id: '4',
      title: 'Document Lab Results in Medical Record',
      description: 'Enter HbA1c levels (8.2%) and medication changes into resident medical record system.',
      type: 'documentation',
      priority: 'medium',
      status: 'pending',
      assignedTo: 'Medical Records - Lisa Chang',
      residentName: 'Robert Martinez',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
      sourceCall: 'Dr. Sarah Chen - 45 min ago',
      completed: false
    },
    {
      id: '5',
      title: 'Resolve Roommate Conflict',
      description: 'Address television volume disagreement between William Thompson and roommate. Mediate discussion and explore room change options if needed.',
      type: 'care',
      priority: 'high',
      status: 'pending',
      assignedTo: 'Care Manager Tom Wilson',
      residentName: 'William Thompson',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 3),
      sourceCall: 'James Thompson (Family) - Current call',
      completed: false
    },
    {
      id: '6',
      title: 'Weekly Medication Review Completed',
      description: 'Completed comprehensive medication review for all residents in Wing A. No adjustments needed.',
      type: 'medical',
      priority: 'low',
      status: 'completed',
      assignedTo: 'Pharmacist Dr. Amanda Clark',
      residentName: 'Multiple Residents',
      dueDate: new Date(Date.now() - 1000 * 60 * 60 * 12),
      sourceCall: 'Routine Review',
      completed: true
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
    if (filter === 'pending') return !task.completed;
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

  const getTimeUntilDue = (dueDate: Date) => {
    const now = new Date();
    const diff = dueDate.getTime() - now.getTime();
    const hours = Math.ceil(diff / (1000 * 60 * 60));
    
    if (hours < 0) return 'Overdue';
    if (hours === 0) return 'Due now';
    if (hours < 24) return `${hours}h remaining`;
    return `${Math.ceil(hours / 24)}d remaining`;
  };

  const pendingCount = tasks.filter(t => !t.completed).length;
  const urgentCount = tasks.filter(t => t.priority === 'urgent' && !t.completed).length;

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Stats and Filter */}
      <div className="flex items-center justify-between p-4 pb-0">
        <div className="flex gap-3">
          <Badge variant="outline" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {urgentCount} Urgent
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {pendingCount} Pending
          </Badge>
        </div>
        
        <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Done</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Task List */}
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4 pt-2">
          {filteredTasks.map((task) => (
            <Card key={task.id} className={`${task.completed ? 'opacity-75' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTaskCompletion(task.id)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(task.type)}
                      <CardTitle className={`text-lg ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </CardTitle>
                      <Badge className={getPriorityColor(task.priority)} variant="outline">
                        {task.priority}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {task.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>Resident:</span>
                        </div>
                        <p className="font-medium">{task.residentName}</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <UserCheck className="h-3 w-3" />
                          <span>Assigned to:</span>
                        </div>
                        <p className="font-medium">{task.assignedTo}</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Due:</span>
                        </div>
                        <p className={`font-medium ${
                          task.dueDate < new Date() && !task.completed 
                            ? 'text-red-600' 
                            : ''
                        }`}>
                          {getTimeUntilDue(task.dueDate)}
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>Source:</span>
                        </div>
                        <p className="font-medium text-xs">{task.sourceCall}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              {!task.completed && (
                <CardContent className="pt-0">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button size="sm">
                      Mark Complete
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}