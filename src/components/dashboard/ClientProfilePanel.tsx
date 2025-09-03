'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Phone, 
  MapPin, 
  Heart, 
  Pill, 
  AlertCircle,
  Clock,
  Shield
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  age: number;
  room: string;
  program: 'HCP' | 'CHSP' | 'NDIS';
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
    lastTaken?: Date;
  }>;
  careLevel: 'Low' | 'Medium' | 'High' | 'Memory Care';
  doNotRecord: boolean;
  recentAlerts: Array<{
    type: 'medical' | 'behavioral' | 'family' | 'care';
    message: string;
    timestamp: Date;
  }>;
}

export function ClientProfilePanel() {
  const [selectedClient, setSelectedClient] = useState<string>('1');
  
  // Mock client data based on Australian aged care context
  const clients: Client[] = [
    {
      id: '1',
      name: 'Dorothy Wilson',
      age: 78,
      room: '12B',
      program: 'HCP',
      admissionDate: new Date('2023-06-15'),
      emergencyContact: {
        name: 'Margaret Wilson',
        relationship: 'Daughter',
        phone: '0412 345 678'
      },
      medicalConditions: ['Hypertension', 'Mild Cognitive Impairment', 'Arthritis'],
      medications: [
        { name: 'Perindopril', dosage: '4mg', frequency: 'Daily', lastTaken: new Date(Date.now() - 1000 * 60 * 60 * 8) },
        { name: 'Donepezil', dosage: '5mg', frequency: 'Daily', lastTaken: new Date(Date.now() - 1000 * 60 * 60 * 20) },
        { name: 'Panadol Osteo', dosage: '665mg', frequency: 'Twice daily' }
      ],
      careLevel: 'Medium',
      doNotRecord: false,
      recentAlerts: [
        {
          type: 'family',
          message: 'Family reported resident feeling isolated',
          timestamp: new Date(Date.now() - 1000 * 60 * 30)
        }
      ]
    },
    {
      id: '2',
      name: 'Robert Martinez',
      age: 82,
      room: '8A',
      program: 'NDIS',
      admissionDate: new Date('2022-11-20'),
      emergencyContact: {
        name: 'Carlos Martinez',
        relationship: 'Son',
        phone: '0498 765 432'
      },
      medicalConditions: ['Type 2 Diabetes', 'Heart Disease', 'Vision Impairment'],
      medications: [
        { name: 'Metformin', dosage: '1000mg', frequency: 'Twice daily', lastTaken: new Date(Date.now() - 1000 * 60 * 60 * 4) },
        { name: 'Atorvastatin', dosage: '20mg', frequency: 'Daily', lastTaken: new Date(Date.now() - 1000 * 60 * 60 * 12) }
      ],
      careLevel: 'High',
      doNotRecord: false,
      recentAlerts: [
        {
          type: 'medical',
          message: 'HbA1c levels elevated - medication review required',
          timestamp: new Date(Date.now() - 1000 * 60 * 60)
        }
      ]
    },
    {
      id: '3',
      name: 'William Thompson',
      age: 75,
      room: '15C',
      program: 'CHSP',
      admissionDate: new Date('2024-01-10'),
      emergencyContact: {
        name: 'James Thompson',
        relationship: 'Son',
        phone: '0433 987 654'
      },
      medicalConditions: ['Dementia', 'Hypertension', 'Depression'],
      medications: [
        { name: 'Aricept', dosage: '10mg', frequency: 'Daily' },
        { name: 'Sertraline', dosage: '50mg', frequency: 'Daily' }
      ],
      careLevel: 'Memory Care',
      doNotRecord: true, // Privacy flag
      recentAlerts: [
        {
          type: 'behavioral',
          message: 'Sundowning behavior - agitation in evenings',
          timestamp: new Date(Date.now() - 1000 * 60 * 120)
        }
      ]
    }
  ];

  const currentClient = clients.find(c => c.id === selectedClient);

  const getCareLevelColor = (level: string) => {
    switch (level) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Memory Care': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgramColor = (program: string) => {
    switch (program) {
      case 'HCP': return 'bg-blue-100 text-blue-800';
      case 'CHSP': return 'bg-green-100 text-green-800';
      case 'NDIS': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'medical': return 'bg-red-100 text-red-800';
      case 'behavioral': return 'bg-orange-100 text-orange-800';
      case 'family': return 'bg-blue-100 text-blue-800';
      case 'care': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!currentClient) return null;

  return (
    <div className="h-full flex flex-col">
      {/* Client Selector */}
      <div className="p-4 border-b">
        <div className="grid gap-2">
          {clients.map((client) => (
            <Button
              key={client.id}
              variant={selectedClient === client.id ? "default" : "ghost"}
              className="justify-start h-auto p-3"
              onClick={() => setSelectedClient(client.id)}
            >
              <div className="flex items-center gap-3 w-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-sm">
                    {client.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left flex-1">
                  <p className="font-medium text-sm">{client.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getProgramColor(client.program)} variant="outline">
                      {client.program}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Room {client.room}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {client.recentAlerts.length > 0 && (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                  {client.doNotRecord && (
                    <Shield className="h-3 w-3 text-red-500" />
                  )}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Selected Client Details */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Basic Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {currentClient.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-xl">{currentClient.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getCareLevelColor(currentClient.careLevel)} variant="secondary">
                      {currentClient.careLevel}
                    </Badge>
                    <Badge className={getProgramColor(currentClient.program)} variant="outline">
                      {currentClient.program}
                    </Badge>
                    <span className="text-sm text-muted-foreground">Age {currentClient.age}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>Room {currentClient.room}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{currentClient.admissionDate.toLocaleDateString('en-AU')}</span>
                </div>
              </div>
              
              {currentClient.doNotRecord && (
                <div className="flex items-center gap-2 p-2 bg-red-50 rounded-md">
                  <Shield className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-700 font-medium">Do Not Record</span>
                </div>
              )}
              
              <Separator />
              
              <div>
                <h4 className="font-medium text-sm mb-2">Emergency Contact</h4>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{currentClient.emergencyContact.name}</p>
                  <p className="text-sm text-muted-foreground">{currentClient.emergencyContact.relationship}</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{currentClient.emergencyContact.phone}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          {currentClient.recentAlerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Recent Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentClient.recentAlerts.map((alert, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Badge className={getAlertColor(alert.type)} variant="secondary">
                        {alert.type}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {alert.timestamp.toLocaleTimeString('en-AU')} • {alert.timestamp.toLocaleDateString('en-AU')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Medical Information Tabs */}
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
                    {currentClient.medications.map((med, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{med.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {med.dosage} • {med.frequency}
                          </p>
                          {med.lastTaken && (
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                Last: {med.lastTaken.toLocaleTimeString('en-AU')}
                              </span>
                            </div>
                          )}
                        </div>
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
                    {currentClient.medicalConditions.map((condition, index) => (
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