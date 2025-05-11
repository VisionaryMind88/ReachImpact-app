# ReachImpact Migration Plan: Firebase to Fastify/PostgreSQL

## Overview

This document outlines the step-by-step process for migrating ReachImpact from a Firebase backend to a Fastify/PostgreSQL architecture deployed on Fly.io.

## 1. Database Schema Migration

### Current Schema (Firebase)
- User authentication and profiles in Firebase Auth
- Data stored in Firebase Realtime Database/Firestore:
  - User profiles
  - Contacts
  - Campaigns
  - Calls
  - Messages
  - Analytics data

### Target Schema (PostgreSQL)
- We'll replicate the existing schema in PostgreSQL using Drizzle ORM
- Schema is already defined in `shared/schema.ts` with tables for:
  - users
  - contacts
  - campaigns
  - calls
  - (additional tables will be added as needed)

### Migration Steps
1. Create migration scripts to export data from Firebase
2. Transform data to match PostgreSQL schema
3. Import data into PostgreSQL
4. Validate data integrity 
5. Set up appropriate indexes for performance

## 2. Authentication Migration

### Current Auth (Firebase)
- Firebase Authentication with email/password
- User sessions managed by Firebase
- Client-side auth state

### Target Auth (JWT + PostgreSQL)
- JWT-based authentication implemented in Fastify
- User credentials stored in PostgreSQL
- Token refresh mechanism
- Session management

### Migration Steps
1. Create JWT authentication middleware in Fastify
2. Update client authentication hooks to use JWT
3. Implement password hashing and verification
4. Create user migration script that handles credentials
5. Test authentication flow end-to-end

## 3. Backend Migration (Firebase to Fastify)

### API Endpoints to Implement
- Authentication endpoints (register, login, logout)
- User profile endpoints
- Contact management
- Campaign management
- Call handling (Twilio integration)
- Chat/messaging
- Analytics
- OpenAI integrations (sentiment analysis, script generation, etc.)

### Implementation Steps
1. Set up Fastify server structure
2. Define route handlers for all required endpoints
3. Implement business logic for each endpoint
4. Connect to PostgreSQL database using Drizzle ORM
5. Integrate Twilio and OpenAI services
6. Implement proper error handling and validation
7. Add logging and monitoring

## 4. Frontend Updates

### Required Changes
- Update API service calls to use new Fastify endpoints
- Modify authentication flow to use JWT
- Update real-time features to use appropriate alternatives
- Ensure all components work with the new data structure

### Implementation Steps
1. Create new API client for Fastify backend
2. Update auth context to use JWT authentication
3. Replace Firebase real-time subscriptions with alternatives
4. Test all frontend components with new backend

## 5. Deployment Configuration (Fly.io)

### Setup Requirements
- Configure PostgreSQL database on Fly.io
- Set up Fastify application deployment
- Configure SSL certificates
- Set up CI/CD with GitHub Actions
- Configure custom domain (reachimpact.io)

### Implementation Steps
1. Create Fly.io application configuration
2. Set up PostgreSQL database
3. Configure GitHub Actions for CI/CD
4. Set up SSL certificates with Let's Encrypt
5. Configure custom domain routing

## 6. Testing Strategy

### Test Categories
- Database migration validation
- Authentication flow testing
- API endpoint testing
- Frontend integration testing
- Performance testing

### Implementation Steps
1. Create test scripts for each category
2. Set up automated testing in CI/CD
3. Perform thorough manual testing
4. Address any issues discovered

## 7. Rollout Strategy

### Phased Approach
1. Development environment migration
2. User acceptance testing
3. Production environment setup
4. Data migration to production
5. DNS switchover
6. Monitoring and support

## Timeline and Milestones

1. **Week 1**: Database schema migration and initial Fastify setup
2. **Week 2**: Authentication implementation and API endpoint development
3. **Week 3**: Frontend updates and integration testing
4. **Week 4**: Deployment configuration and final testing
5. **Week 5**: Production rollout and monitoring

## Required Resources

- Access to Firebase project for data export
- PostgreSQL database credentials
- Fly.io account and deployment credentials
- GitHub repository access
- Twilio and OpenAI API keys
- DNS access for domain configuration

## Backup and Rollback Plan

1. Regular database backups during migration
2. Ability to revert to Firebase if critical issues are discovered
3. Detailed logging of all migration steps for troubleshooting