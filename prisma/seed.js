const { PrismaClient } = require('../src/generated/prisma')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database with Australian aged care mock data...')

  // Create Users (Care Coordinators)
  const coordinator1 = await prisma.user.create({
    data: {
      email: 'sarah.martinez@bilbyai.com.au',
      name: 'Sarah Martinez',
      role: 'COORDINATOR',
    },
  })

  const coordinator2 = await prisma.user.create({
    data: {
      email: 'jennifer.lee@bilbyai.com.au',
      name: 'Jennifer Lee',
      role: 'COORDINATOR',
    },
  })

  // Create Clients (Australian Aged Care Residents)
  const dorothy = await prisma.client.create({
    data: {
      name: 'Dorothy Wilson',
      age: 78,
      room: '12B',
      program: 'HCP',
      admissionDate: new Date('2023-06-15'),
      doNotRecord: false,
      careLevel: 'MEDIUM',
      emergencyContactName: 'Margaret Wilson',
      emergencyContactRelationship: 'Daughter',
      emergencyContactPhone: '0412 345 678',
      medicalConditions: ['Hypertension', 'Mild Cognitive Impairment', 'Arthritis'],
      medications: {
        create: [
          {
            name: 'Perindopril',
            dosage: '4mg',
            frequency: 'Daily',
            lastTaken: new Date(Date.now() - 1000 * 60 * 60 * 8),
          },
          {
            name: 'Donepezil',
            dosage: '5mg',
            frequency: 'Daily',
            lastTaken: new Date(Date.now() - 1000 * 60 * 60 * 20),
          },
          {
            name: 'Panadol Osteo',
            dosage: '665mg',
            frequency: 'Twice daily',
          },
        ],
      },
      recentAlerts: {
        create: [
          {
            type: 'FAMILY',
            message: 'Family reported resident feeling isolated',
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
          },
        ],
      },
    },
  })

  const robert = await prisma.client.create({
    data: {
      name: 'Robert Martinez',
      age: 82,
      room: '8A',
      program: 'NDIS',
      admissionDate: new Date('2022-11-20'),
      doNotRecord: false,
      careLevel: 'HIGH',
      emergencyContactName: 'Carlos Martinez',
      emergencyContactRelationship: 'Son',
      emergencyContactPhone: '0498 765 432',
      medicalConditions: ['Type 2 Diabetes', 'Heart Disease', 'Vision Impairment'],
      medications: {
        create: [
          {
            name: 'Metformin',
            dosage: '1000mg',
            frequency: 'Twice daily',
            lastTaken: new Date(Date.now() - 1000 * 60 * 60 * 4),
          },
          {
            name: 'Atorvastatin',
            dosage: '20mg',
            frequency: 'Daily',
            lastTaken: new Date(Date.now() - 1000 * 60 * 60 * 12),
          },
        ],
      },
      recentAlerts: {
        create: [
          {
            type: 'MEDICAL',
            message: 'HbA1c levels elevated - medication review required',
            timestamp: new Date(Date.now() - 1000 * 60 * 60),
          },
        ],
      },
    },
  })

  const william = await prisma.client.create({
    data: {
      name: 'William Thompson',
      age: 75,
      room: '15C',
      program: 'CHSP',
      admissionDate: new Date('2024-01-10'),
      doNotRecord: true,
      careLevel: 'MEMORY_CARE',
      emergencyContactName: 'James Thompson',
      emergencyContactRelationship: 'Son',
      emergencyContactPhone: '0433 987 654',
      medicalConditions: ['Dementia', 'Hypertension', 'Depression'],
      medications: {
        create: [
          {
            name: 'Aricept',
            dosage: '10mg',
            frequency: 'Daily',
          },
          {
            name: 'Sertraline',
            dosage: '50mg',
            frequency: 'Daily',
          },
        ],
      },
      recentAlerts: {
        create: [
          {
            type: 'BEHAVIORAL',
            message: 'Sundowning behavior - agitation in evenings',
            timestamp: new Date(Date.now() - 1000 * 60 * 120),
          },
        ],
      },
    },
  })

  // Create Sample Call Records
  const call1 = await prisma.call.create({
    data: {
      callerName: 'Margaret Wilson',
      callerType: 'FAMILY',
      clientName: 'Dorothy Wilson',
      startTime: new Date(Date.now() - 1000 * 60 * 45),
      endTime: new Date(Date.now() - 1000 * 60 * 40),
      duration: '4:32',
      status: 'COMPLETED',
      consentGiven: true,
      confidence: 94,
      summary: 'Family call regarding Dorothy\'s social engagement and medication concerns.',
      clientId: dorothy.id,
      handlerId: coordinator1.id,
      segments: {
        create: [
          {
            speaker: 'FAMILY',
            text: 'Good morning, this is Margaret Wilson calling about my mother, Dorothy Wilson in room 12B.',
            timestamp: new Date(Date.now() - 1000 * 60 * 45),
            confidence: 96,
          },
          {
            speaker: 'COORDINATOR',
            text: 'Good morning Margaret. This is Sarah from the care coordination team. How can I help you today?',
            timestamp: new Date(Date.now() - 1000 * 60 * 44.5),
            confidence: 98,
          },
        ],
      },
    },
  })

  // Create Tasks based on Australian aged care context
  await prisma.task.create({
    data: {
      title: "Follow up on Dorothy's social engagement",
      description: 'Family reported resident feeling isolated and not participating in group activities. Assess current social engagement level and develop intervention plan.',
      type: 'CARE',
      priority: 'MEDIUM',
      status: 'PENDING',
      assignedTo: 'Sarah Martinez, Activity Coordinator',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 4),
      sourceCall: 'Margaret Wilson (Family) - 30 min ago',
      confidence: 85,
      clientId: dorothy.id,
      callId: call1.id,
      assigneeId: coordinator1.id,
    },
  })

  await prisma.task.create({
    data: {
      title: 'Medication schedule review required',
      description: 'Client confused about evening medication timing. Review schedule with nursing staff and provide clear written instructions for Perindopril dosing.',
      type: 'MEDICAL',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      assignedTo: 'Jennifer Lee, RN',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 2),
      sourceCall: 'Margaret Wilson (Family) - 30 min ago',
      confidence: 92,
      clientId: dorothy.id,
      callId: call1.id,
      assigneeId: coordinator2.id,
    },
  })

  await prisma.task.create({
    data: {
      title: 'Diabetes medication protocol update',
      description: 'Implement new Metformin dosage (1000mg twice daily) as prescribed. Monitor blood glucose levels frequently for one week and document readings.',
      type: 'MEDICAL',
      priority: 'URGENT',
      status: 'PENDING',
      assignedTo: 'Michael Rodriguez, EN',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 1),
      sourceCall: 'Dr. Sarah Chen - 1 hour ago',
      confidence: 95,
      clientId: robert.id,
      assigneeId: coordinator1.id,
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log(`👥 Created ${3} clients (Australian aged care residents)`)
  console.log(`🏥 Created ${2} coordinators`)
  console.log(`📞 Created ${1} call record with transcription`)
  console.log(`📋 Created ${3} care coordination tasks`)
  console.log(`💊 Created ${7} medication records`)
  console.log(`🚨 Created ${3} care alerts`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })