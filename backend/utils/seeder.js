const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Lawyer = require('../models/Lawyer');
const Case = require('../models/Case');
const connectDB = require('../config/database');

dotenv.config();

// Sample data
const users = [
  {
    email: 'admin@offtherecord.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    phone: '+1234567890',
    role: 'admin',
    isVerified: true
  },
  {
    email: 'john@example.com',
    password: 'user123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567891',
    role: 'user',
    isVerified: true,
    quota: {
      casesPerMonth: 5,
      casesUsed: 1
    }
  },
  {
    email: 'jane@example.com',
    password: 'user123',
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '+1234567892',
    role: 'user',
    isVerified: true
  },
  {
    email: 'lawyer1@example.com',
    password: 'lawyer123',
    firstName: 'Sarah',
    lastName: 'Johnson',
    phone: '+1234567893',
    role: 'lawyer',
    isVerified: true
  },
  {
    email: 'lawyer2@example.com',
    password: 'lawyer123',
    firstName: 'Michael',
    lastName: 'Chen',
    phone: '+1234567894',
    role: 'lawyer',
    isVerified: true
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Lawyer.deleteMany({});
    await Case.deleteMany({});

    // Create users
    console.log('Creating users...');
    const createdUsers = await User.insertMany(users);
    console.log(`✓ Created ${createdUsers.length} users`);

    // Get lawyer user IDs
    const lawyerUser1 = createdUsers.find(u => u.email === 'lawyer1@example.com');
    const lawyerUser2 = createdUsers.find(u => u.email === 'lawyer2@example.com');

    // Create lawyer profiles
    console.log('Creating lawyer profiles...');
    const lawyers = [
      {
        userId: lawyerUser1._id,
        licenseNumber: 'WA-12345',
        barAssociation: 'Washington State Bar',
        yearsOfExperience: 10,
        specializations: ['speeding', 'reckless_driving', 'dui'],
        jurisdictions: [
          {
            state: 'WA',
            counties: ['King', 'Pierce', 'Snohomish'],
            courts: ['Seattle Municipal Court', 'King County District Court']
          }
        ],
        bio: 'Experienced traffic attorney with over 10 years of practice. Specialized in DUI and reckless driving cases with a 98% success rate.',
        rating: {
          average: 4.8,
          count: 127
        },
        statistics: {
          totalCases: 500,
          casesWon: 350,
          casesDismissed: 140,
          casesReduced: 8,
          successRate: 98
        },
        availability: {
          isAvailable: true,
          maxCases: 20,
          currentCases: 5
        },
        pricing: {
          baseFee: 249,
          dui: 499,
          misdemeanor: 349,
          cdl: 299
        },
        isApproved: true,
        approvedAt: new Date()
      },
      {
        userId: lawyerUser2._id,
        licenseNumber: 'CA-67890',
        barAssociation: 'California State Bar',
        yearsOfExperience: 15,
        specializations: ['speeding', 'red_light', 'cell_phone', 'cdl_violations'],
        jurisdictions: [
          {
            state: 'CA',
            counties: ['Los Angeles', 'Orange', 'San Diego'],
            courts: ['Los Angeles Superior Court', 'Orange County Court']
          }
        ],
        bio: 'Senior traffic attorney specializing in CDL and commercial vehicle violations. Former prosecutor with insider knowledge of traffic court procedures.',
        rating: {
          average: 4.9,
          count: 203
        },
        statistics: {
          totalCases: 800,
          casesWon: 600,
          casesDismissed: 180,
          casesReduced: 15,
          successRate: 97
        },
        availability: {
          isAvailable: true,
          maxCases: 25,
          currentCases: 8
        },
        pricing: {
          baseFee: 249,
          dui: 599,
          misdemeanor: 399,
          cdl: 349
        },
        isApproved: true,
        approvedAt: new Date()
      }
    ];

    const createdLawyers = await Lawyer.insertMany(lawyers);
    console.log(`✓ Created ${createdLawyers.length} lawyer profiles`);

    // Create sample cases
    const regularUser = createdUsers.find(u => u.email === 'john@example.com');
    
    console.log('Creating sample cases...');
    const cases = [
      {
        userId: regularUser._id,
        lawyerId: createdLawyers[0]._id,
        ticketDetails: {
          violationType: 'speeding',
          ticketNumber: 'SPD-2024-001',
          issueDate: new Date('2024-01-15'),
          location: {
            street: 'I-5 Northbound',
            city: 'Seattle',
            state: 'WA',
            county: 'King'
          },
          court: {
            name: 'Seattle Municipal Court',
            address: '600 5th Ave, Seattle, WA 98104',
            phone: '(206) 684-5600'
          },
          officerInfo: {
            name: 'Officer J. Williams',
            badgeNumber: 'SPD-4532'
          },
          speedDetails: {
            actualSpeed: 75,
            speedLimit: 60,
            zone: 'Highway'
          },
          fine: 150,
          points: 2,
          ticketImage: '/uploads/tickets/sample-ticket.jpg'
        },
        clientInfo: {
          isCDLDriver: false,
          licenseNumber: 'WA-DL-12345',
          licenseState: 'WA'
        },
        status: 'in_progress',
        timeline: [
          {
            status: 'pending',
            note: 'Case submitted successfully',
            timestamp: new Date('2024-01-16')
          },
          {
            status: 'assigned',
            note: 'Matched with Sarah Johnson',
            timestamp: new Date('2024-01-16')
          },
          {
            status: 'in_progress',
            note: 'Motion to dismiss filed with court',
            timestamp: new Date('2024-01-18')
          }
        ],
        courtDate: new Date('2024-02-20'),
        pricing: {
          quotedPrice: 249,
          actualPrice: 249
        },
        payment: {
          status: 'paid',
          paidAt: new Date('2024-01-16')
        }
      },
      {
        userId: regularUser._id,
        lawyerId: createdLawyers[0]._id,
        ticketDetails: {
          violationType: 'red_light',
          ticketNumber: 'RED-2023-789',
          issueDate: new Date('2023-12-10'),
          location: {
            street: 'Main St & 5th Ave',
            city: 'Seattle',
            state: 'WA',
            county: 'King'
          },
          court: {
            name: 'Seattle Municipal Court',
            address: '600 5th Ave, Seattle, WA 98104',
            phone: '(206) 684-5600'
          },
          fine: 124,
          points: 2,
          ticketImage: '/uploads/tickets/sample-ticket-2.jpg'
        },
        clientInfo: {
          isCDLDriver: false,
          licenseNumber: 'WA-DL-12345',
          licenseState: 'WA'
        },
        status: 'dismissed',
        timeline: [
          {
            status: 'pending',
            note: 'Case submitted successfully',
            timestamp: new Date('2023-12-11')
          },
          {
            status: 'assigned',
            note: 'Matched with Sarah Johnson',
            timestamp: new Date('2023-12-11')
          },
          {
            status: 'dismissed',
            note: 'Case dismissed - officer did not appear',
            timestamp: new Date('2024-01-05')
          }
        ],
        outcome: {
          type: 'dismissed',
          finalFine: 0,
          finalPoints: 0,
          notes: 'Officer failed to appear at hearing. Case dismissed.'
        },
        pricing: {
          quotedPrice: 249,
          actualPrice: 249
        },
        payment: {
          status: 'paid',
          paidAt: new Date('2023-12-11')
        },
        clientRating: {
          rating: 5,
          review: 'Excellent service! Sarah was professional and got my ticket dismissed. Highly recommended!',
          ratedAt: new Date('2024-01-06')
        }
      }
    ];

    const createdCases = await Case.insertMany(cases);
    console.log(`✓ Created ${createdCases.length} sample cases`);

    console.log('\n✅ Database seeded successfully!\n');
    console.log('Test Accounts:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:');
    console.log('  Email: admin@offtherecord.com');
    console.log('  Password: admin123');
    console.log('\nUser:');
    console.log('  Email: john@example.com');
    console.log('  Password: user123');
    console.log('\nLawyers:');
    console.log('  Email: lawyer1@example.com');
    console.log('  Password: lawyer123');
    console.log('  Email: lawyer2@example.com');
    console.log('  Password: lawyer123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
