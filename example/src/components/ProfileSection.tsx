import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { 
  User, 
  Calendar, 
  Phone, 
  MapPin, 
  Heart, 
  Pill, 
  AlertCircle,
  Clock,
  Users,
  FileText,
  Plus
} from 'lucide-react';

interface Resident {
  id: string;
  name: string;
  age: number;
  room: string;
  admissionDate: Date;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalConditions: string[];
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    timeLastTaken?: Date;
  }>;
  careLevel: 'Low' | 'Medium' | 'High' | 'Memory Care';
  recentAlerts: Array<{
    type: 'medical' | 'behavioral' | 'family' | 'care';
    message: string;
    timestamp: Date;
  }>;
  avatar?: string;
}

export function ProfileSection() {
  const [selectedResident, setSelectedResident] = useState<string>('1');
  
  const residents: Resident[] = [
    {
      id: '1',
      name: 'Dorothy Wilson',
      age: 78,
      room: '12B',
      admissionDate: new Date('2023-06-15'),
      emergencyContact: {
        name: 'Margaret Wilson',
        relationship: 'Daughter',
        phone: '(555) 123-4567'
      },
      medicalConditions: ['Hypertension', 'Mild Cognitive Impairment', 'Arthritis'],
      medications: [
        { name: 'Lisinopril', dosage: '10mg', frequency: 'Daily', timeLastTaken: new Date(Date.now() - 1000 * 60 * 60 * 8) },
        { name: 'Donepezil', dosage: '5mg', frequency: 'Daily', timeLastTaken: new Date(Date.now() - 1000 * 60 * 60 * 20) },
        { name: 'Ibuprofen', dosage: '200mg', frequency: 'As needed' }
      ],
      careLevel: 'Medium',
      recentAlerts: [
        {
          type: 'family',
          message: 'Family reported resident feeling lonely',
          timestamp: new Date(Date.now() - 1000 * 60 * 15)
        },
        {
          type: 'medical',
          message: 'Medication timing confusion reported',
          timestamp: new Date(Date.now() - 1000 * 60 * 15)
        }
      ]
    },
    {
      id: '2',
      name: 'Robert Martinez',
      age: 82,
      room: '8A',
      admissionDate: new Date('2022-11-20'),
      emergencyContact: {
        name: 'Carlos Martinez',
        relationship: 'Son',
        phone: '(555) 987-6543'
      },
      medicalConditions: ['Type 2 Diabetes', 'Heart Disease', 'Vision Impairment'],
      medications: [
        { name: 'Metformin', dosage: '1000mg', frequency: 'Twice daily', timeLastTaken: new Date(Date.now() - 1000 * 60 * 60 * 4) },
        { name: 'Atorvastatin', dosage: '20mg', frequency: 'Daily', timeLastTaken: new Date(Date.now() - 1000 * 60 * 60 * 12) }
      ],
      careLevel: 'High',
      recentAlerts: [
        {
          type: 'medical',
          message: 'HbA1c levels elevated - new medication protocol',
          timestamp: new Date(Date.now() - 1000 * 60 * 45)
        }
      ]
    },
    {
      id: '3',
      name: 'William Thompson',
      age: 75,
      room: '15C',
      admissionDate: new Date('2024-01-10'),
      emergencyContact: {
        name: 'James Thompson',
        relationship: 'Son',
        phone: '(555) 456-7890'
      },
      medicalConditions: ['Dementia', 'High Blood Pressure', 'Depression'],
      medications: [
        { name: 'Aricept', dosage: '10mg', frequency: 'Daily' },
        { name: 'Sertraline', dosage: '50mg', frequency: 'Daily' }
      ],
      careLevel: 'Memory Care',
      recentAlerts: [
        {
          type: 'behavioral',
          message: 'Roommate conflict - television volume disagreement',
          timestamp: new Date(Date.now() - 1000 * 60 * 5)
        }
      ]
    }
  ];

  const currentResident = residents.find(r => r.id === selectedResident);

  if (!currentResident) return null;

  const getCarelevelColor = (level: string) => {
    switch (level) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Memory Care': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'medical': return 'bg-red-100 text-red-800';
      case 'behavioral': return 'bg-orange-100 text-orange-800';
      case 'family': return 'bg-blue-100 text-blue-800';
      case 'care': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Resident Selector */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Resident Profiles</h2>
        </div>
        
        <div className="grid gap-2">
          {residents.map((resident) => (
            <Button
              key={resident.id}
              variant={selectedResident === resident.id ? "default" : "ghost"}
              className="justify-start h-auto p-3"
              onClick={() => setSelectedResident(resident.id)}
            >
              <div className="flex items-center gap-3 w-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {resident.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left flex-1">
                  <p className="font-medium text-sm">{resident.name}</p>
                  <p className="text-xs text-muted-foreground">Room {resident.room}</p>
                </div>
                {resident.recentAlerts.length > 0 && (
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                )}
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Selected Resident Details */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Basic Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {currentResident.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-xl">{currentResident.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getCarelevelColor(currentResident.careLevel)} variant="secondary">
                      {currentResident.careLevel}
                    </Badge>
                    <span className="text-sm text-muted-foreground">Age {currentResident.age}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>Room {currentResident.room}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Admitted {currentResident.admissionDate.toLocaleDateString()}</span>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium text-sm mb-2">Emergency Contact</h4>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{currentResident.emergencyContact.name}</p>
                  <p className="text-sm text-muted-foreground">{currentResident.emergencyContact.relationship}</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{currentResident.emergencyContact.phone}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          {currentResident.recentAlerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Recent Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentResident.recentAlerts.map((alert, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Badge className={getAlertTypeColor(alert.type)} variant="secondary">
                        {alert.type}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {alert.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Medical Information */}
          <Tabs defaultValue="medications" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="medications">Medications</TabsTrigger>
              <TabsTrigger value="conditions">Conditions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="medications">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    Current Medications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentResident.medications.map((med, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{med.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {med.dosage} • {med.frequency}
                          </p>
                          {med.timeLastTaken && (
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                Last: {med.timeLastTaken.toLocaleTimeString()}
                              </span>
                            </div>
                          )}
                        </div>
                        <Button variant="outline" size="sm">
                          <Plus className="h-3 w-3 mr-1" />
                          Log
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="conditions">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Medical Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {currentResident.medicalConditions.map((condition, index) => (
                      <Badge key={index} variant="outline" className="text-sm">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}