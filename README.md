# Bitespeed Backend Task

A Node.js/TypeScript backend service that implements contact identity resolution for customer data management. This service consolidates customer contact information (email and phone numbers) to identify and link related contacts across different interactions.

## Features

- **Contact Identity Resolution**: Automatically identifies and consolidates customer contacts based on email and phone number
- **Primary/Secondary Contact Linking**: Maintains a hierarchical structure with primary and secondary contacts
- **Database Transactions**: Ensures data consistency with PostgreSQL transactions
- **RESTful API**: Clean API design with proper error handling
- **Docker Support**: Containerized deployment ready
- **TypeScript**: Full type safety and modern JavaScript features
- **Clean Architecture**: Organized with controllers, services, repositories, and models

## Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Development Tools**: ESLint, Prettier, Jest
- **Containerization**: Docker

## Prerequisites

- Node.js 18 or higher
- PostgreSQL database
- npm or yarn package manager

## Quick Start

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd bitespeed_backend
npm install
```

### 2. Environment Setup

Copy the example environment file and configure your settings:

```bash
cp env.example .env
```

Update the `.env` file with your database credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. Database Setup

Ensure your PostgreSQL database is running and create the necessary tables. The application expects a `contacts` table with the following structure:

```sql
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(15),
    email VARCHAR(255),
    linked_id INTEGER REFERENCES contacts(id),
    link_precedence VARCHAR(10) CHECK (link_precedence IN ('primary', 'secondary')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### 4. Run the Application

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## Docker Deployment

### Build and Run with Docker

```bash
# Build the Docker image
docker build -t bitespeed-backend .

# Run the container
docker run -p 3000:3000 --env-file .env bitespeed-backend
```

## API Documentation

### GET /

A simple health check endpoint that provides guidance on using the API.

#### Response

```json
{
  "message": "Hey, you are not there yet. Send POST request to /identify to get a response"
}
```

#### Example Usage

```bash
curl http://localhost:3000/
```

### POST /identify

Identifies and consolidates customer contact information.

#### Request Body

```json
{
  "email": "user@example.com",     // optional
  "phoneNumber": "+1234567890"     // optional
}
```

**Note**: At least one of `email` or `phoneNumber` must be provided.

#### Response

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["user@example.com", "user.alt@example.com"],
    "phoneNumbers": ["+1234567890", "+0987654321"],
    "secondaryContactIds": [2, 3]
  }
}
```

#### Response Fields

- `primaryContactId`: ID of the primary contact
- `emails`: Array of all unique emails associated with this contact
- `phoneNumbers`: Array of all unique phone numbers associated with this contact
- `secondaryContactIds`: Array of IDs of secondary contacts linked to the primary

#### Example Usage

```bash
# First contact
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "phoneNumber": "+1234567890"}'

# Response
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["john@example.com"],
    "phoneNumbers": ["+1234567890"],
    "secondaryContactIds": []
  }
}

# Second contact with same email, different phone
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "phoneNumber": "+0987654321"}'

# Response (consolidated)
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["john@example.com"],
    "phoneNumbers": ["+1234567890", "+0987654321"],
    "secondaryContactIds": [2]
  }
}
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the TypeScript project
- `npm start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests

### Code Structure

```
src/
├── app.ts                 # Express app configuration
├── index.ts              # Application entry point
├── config/
│   └── database.ts       # Database connection setup
├── controllers/
│   └── identifyController.ts
├── models/
│   └── contact.ts        # Contact data model
├── repositories/
│   └── contactRepository.ts
├── routes/
│   └── identifyRoutes.ts
└── services/
    └── identifyService.ts # Core business logic
```

## 🔧 Configuration

The application uses environment variables for configuration. All available options:

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | Database username | - |
| `DB_PASSWORD` | Database password | - |
| `DB_NAME` | Database name | - |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |

## Contact Identity Resolution Logic

The service implements the following logic:

1. **New Contact**: If no matching email or phone exists, creates a new primary contact
2. **Existing Contact**: If matches are found, consolidates all related contacts
3. **Primary Contact**: The oldest contact becomes the primary contact
4. **Secondary Contacts**: All other contacts become secondary and link to the primary
5. **New Information**: If new email/phone provided for existing contact, creates a secondary contact
