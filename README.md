# Bitespeed Backend

This repository is for bitespeed backend role task submission. 

## Folder Structure

```
src/
├── app.ts              # Express app configuration
├── index.ts            # Application entry point
├── config/
│   └── database.ts     # Database configuration
├── controllers/
│   └── identifyController.ts  # HTTP request handlers
├── models/
│   └── contact.ts      # Data models/types
├── repositories/
│   └── contactRepository.ts   # Data access layer
├── routes/
│   └── identifyRoutes.ts      # API route definitions
└── services/
    └── identifyService.ts     # Business logic layer
```

## NPM Usage

### Install dependencies
```bash
npm install
```

### Development
```bash
npm run dev          # Start development server with hot reload
```

## Docker Setup

### Build and run container
```bash
# Build the image
docker build -t bitespeed-backend .

# Run the container
docker run -p 3000:3000 bitespeed-backend
```

### Environment Setup
Copy `env.example` to `.env` and configure your environment variables before running. 