# Off The Record - Traffic Ticket Fighting Platform

A complete full-stack application for fighting traffic tickets with smart lawyer matching, payment processing, real-time messaging, and comprehensive admin tools.

## 🚀 Features

### Core Functionality
- **Smart Lawyer Matching**: AI-powered algorithm matches users with the best lawyer based on:
  - Specialization and violation type
  - Success rate and experience
  - Jurisdiction and availability
  - Client reviews and ratings
  
- **User Management**:
  - User registration and authentication (JWT-based)
  - Role-based access control (User, Lawyer, Admin)
  - Profile management
  - Monthly case quotas
  - Subscription plans

- **Case Management**:
  - Upload ticket images
  - Auto-pricing based on violation type
  - Timeline tracking with status updates
  - Document uploads
  - Court date scheduling
  - Case outcomes and statistics

- **Payment Processing**:
  - Stripe integration for secure payments
  - Money-back guarantee automation
  - Lawyer payout system with platform fees
  - Refund processing
  - Payment history and receipts

- **Real-time Messaging**:
  - Socket.IO powered chat
  - File attachments in messages
  - Read receipts
  - Typing indicators
  - Push notifications

- **Admin Panel**:
  - Dashboard with statistics
  - User management
  - Lawyer approval workflow
  - Case oversight
  - Payment and refund management
  - Quota management
  - Manual lawyer assignment

- **Lawyer Portal**:
  - Registration and profile setup
  - Case dashboard
  - Statistics and earnings tracking
  - Availability management
  - Client reviews and ratings

## 📋 Tech Stack

### Backend
- **Node.js** + **Express** - Server framework
- **MongoDB** + **Mongoose** - Database
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **Stripe** - Payment processing
- **Multer** - File uploads
- **Bcrypt** - Password hashing

### Frontend (React - Ready to build)
- React.js with Hooks
- Tailwind CSS for styling
- Lucide React for icons
- Socket.IO Client for real-time features

## 🛠️ Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Stripe account for payments
- npm or yarn

### Step 1: Clone and Install
```bash
cd off-the-record-app
npm install
```

### Step 2: Environment Setup
```bash
cp .env.example .env
```

Edit `.env` with your configurations:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/off-the-record
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
```

### Step 3: Start MongoDB
```bash
# macOS with Homebrew
brew services start mongodb-community

# Linux with systemd
sudo systemctl start mongod

# Windows
net start MongoDB

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Step 4: Run the Application
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "user"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

### Case Endpoints

#### Create Case
```http
POST /cases
Authorization: Bearer <token>
Content-Type: multipart/form-data

ticketImage: <file>
ticketDetails: {
  "violationType": "speeding",
  "issueDate": "2024-01-15",
  "location": {
    "state": "WA",
    "city": "Seattle",
    "court": "Seattle Municipal Court"
  },
  "speedDetails": {
    "actualSpeed": 70,
    "speedLimit": 60
  },
  "fine": 150
}
clientInfo: {
  "isCDLDriver": false
}
```

#### Get User Cases
```http
GET /cases
Authorization: Bearer <token>
```

#### Get Case by ID
```http
GET /cases/:id
Authorization: Bearer <token>
```

#### Update Case Status (Lawyer/Admin)
```http
PUT /cases/:id/status
Authorization: Bearer <token>

{
  "status": "in_progress",
  "note": "Filed motion to dismiss",
  "courtDate": "2024-02-15"
}
```

### Payment Endpoints

#### Create Payment Intent
```http
POST /payments/create-intent
Authorization: Bearer <token>

{
  "caseId": "case_id_here",
  "amount": 249
}
```

#### Confirm Payment
```http
POST /payments/confirm
Authorization: Bearer <token>

{
  "paymentIntentId": "pi_xxx",
  "paymentId": "payment_id"
}
```

#### Request Refund
```http
POST /payments/:id/refund
Authorization: Bearer <token>

{
  "reason": "Case lost - money back guarantee"
}
```

### Lawyer Endpoints

#### Register as Lawyer
```http
POST /lawyers/register
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "licenseNumber": "WA-12345",
  "barAssociation": "Washington State Bar",
  "yearsOfExperience": 10,
  "specializations": ["speeding", "dui"],
  "jurisdictions": [{
    "state": "WA",
    "counties": ["King", "Pierce"]
  }],
  "bio": "Experienced traffic attorney...",
  "pricing": {
    "baseFee": 249
  }
}
documents: <files>
```

#### Get Lawyer Statistics
```http
GET /lawyers/statistics/me
Authorization: Bearer <token>
```

#### Toggle Availability
```http
PUT /lawyers/availability
Authorization: Bearer <token>
```

#### Search Lawyers
```http
GET /lawyers/search?state=WA&specialization=speeding&minRating=4
```

### Message Endpoints

#### Send Message
```http
POST /messages
Authorization: Bearer <token>

{
  "caseId": "case_id",
  "receiverId": "user_id",
  "content": "Hello, I've reviewed your case..."
}
```

#### Get Case Messages
```http
GET /messages/:caseId
Authorization: Bearer <token>
```

#### Get Conversations
```http
GET /messages/conversations
Authorization: Bearer <token>
```

### Admin Endpoints

#### Get Dashboard Stats
```http
GET /admin/stats
Authorization: Bearer <admin_token>
```

#### Get All Users
```http
GET /admin/users?page=1&limit=10&role=user
Authorization: Bearer <admin_token>
```

#### Approve Lawyer
```http
PUT /admin/lawyers/:id/approve
Authorization: Bearer <admin_token>
```

#### Get All Cases
```http
GET /admin/cases?status=pending&page=1
Authorization: Bearer <admin_token>
```

## 🔐 Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Role-Based Access Control**: User, Lawyer, Admin roles
- **Input Validation**: Express-validator for all inputs
- **File Upload Security**: Type and size restrictions
- **CORS Protection**: Configured for specific origins
- **Rate Limiting**: Prevent API abuse
- **SQL Injection Protection**: MongoDB parameterized queries

## 📊 Database Schema

### User
- Authentication (email, password)
- Profile (name, phone, address)
- Role (user, lawyer, admin)
- Subscription and quota tracking

### Lawyer
- License and credentials
- Specializations and jurisdictions
- Statistics and ratings
- Availability and pricing

### Case
- Ticket details and images
- Client information
- Lawyer assignment
- Status timeline
- Payment information
- Documents and notes

### Payment
- Transaction details
- Stripe integration
- Refund tracking
- Lawyer payout management

### Message
- Real-time chat
- File attachments
- Read receipts

## 🎯 Smart Matching Algorithm

The lawyer matching system uses a scoring algorithm based on:

1. **Specialization Match** (40 points)
   - Direct match with violation type

2. **Success Rate** (30 points)
   - Based on historical case outcomes

3. **Experience** (15 points)
   - Years of practice

4. **Rating** (10 points)
   - Client reviews average

5. **Availability** (5 points)
   - Current caseload vs. capacity

6. **Bonus Points**
   - CDL violations for commercial drivers
   - Court-specific experience

## 💰 Payment Flow

1. User uploads ticket → Instant quote generated
2. User initiates payment → Stripe Payment Intent created
3. Payment confirmed → Case assigned to lawyer
4. Case completion:
   - **Won/Dismissed**: Payment retained
   - **Lost**: Automatic refund initiated
5. Platform fee (20%) deducted
6. Lawyer payout processed monthly

## 🔔 Notification System

### Real-time Notifications via Socket.IO:
- New messages
- Case status updates
- Payment confirmations
- Court date reminders
- Lawyer assignments

### Email Notifications (TODO):
- Welcome emails
- Case confirmations
- Status updates
- Payment receipts
- Refund confirmations

## 📱 API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## 🧪 Testing

Create a test user:
```bash
# Using curl
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "firstName": "Test",
    "lastName": "User",
    "phone": "+1234567890"
  }'
```

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secret
- [ ] Configure MongoDB Atlas or production database
- [ ] Set up Stripe production keys
- [ ] Configure email service (SendGrid, Mailgun, etc.)
- [ ] Set up AWS S3 for file storage
- [ ] Enable SSL/HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up monitoring (PM2, New Relic, etc.)
- [ ] Configure backup strategy
- [ ] Set up logging (Winston, Loggly, etc.)

### Deploy to Heroku
```bash
heroku create off-the-record-api
heroku addons:create mongolab
heroku config:set JWT_SECRET=your_secret
heroku config:set STRIPE_SECRET_KEY=your_key
git push heroku main
```

## 📝 License

MIT License - see LICENSE file for details

## 👥 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📧 Support

For support, email support@offtherecord.com or open an issue on GitHub.

## 🎉 Acknowledgments

- Stripe for payment processing
- Socket.IO for real-time communication
- MongoDB for flexible data storage
- Express.js community

---

Made with ❤️ by Off The Record Team
