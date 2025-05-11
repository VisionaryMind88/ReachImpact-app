# ReachImpact

![ReachImpact Logo](./attached_assets/Scherm­afbeelding%202025-05-11%20om%2014.25.43.png)

ReachImpact is a sophisticated AI-powered outbound calling platform that leverages advanced technologies to optimize communication strategies and contact engagement.

## Key Features

- AI-powered calling automation with OpenAI GPT-4
- Real-time transcription and sentiment analysis
- Multi-language support for global outreach
- Campaign management and performance analytics
- Contact database with intelligent sorting and tagging
- Twilio integration for professional call handling
- Team collaboration tools

## Tech Stack

### Frontend
- React.js with TypeScript
- Tailwind CSS for UI components
- TanStack Query for data fetching
- Wouter for routing

### Backend
- Fastify for high-performance REST API
- PostgreSQL database with Drizzle ORM
- JWT for secure authentication
- Twilio for calling and SMS
- OpenAI for AI features

### Infrastructure
- Deployed on Fly.io
- CI/CD with GitHub Actions
- PostgreSQL hosting on Fly.io
- Custom domain with SSL

## Firebase to Fastify Migration

This project has been migrated from Firebase to a Fastify backend with PostgreSQL database. The migration process involved:

1. Creating a new Fastify server structure
2. Setting up PostgreSQL database with Drizzle ORM
3. Implementing JWT authentication to replace Firebase Auth
4. Migrating user data and other collections from Firebase to PostgreSQL
5. Setting up CI/CD with GitHub Actions to deploy to Fly.io

## Development Environment Setup

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Twilio account and API keys
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/reachimpact.git
cd reachimpact
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/reachimpact

# Authentication
JWT_SECRET=your-jwt-secret

# Twilio
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Firebase (for migration only)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
```

4. Push the database schema:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

## Firebase to PostgreSQL Data Migration

To migrate data from Firebase to PostgreSQL:

1. Ensure you have Firebase credentials in your .env file
2. Run the migration script:
```bash
tsx fastify-server/scripts/migrate-firebase-data.ts admin@email.com password
```

This will:
- Export all data from Firebase to backup JSON files
- Import users, contacts, campaigns, and calls into PostgreSQL
- Generate passwords for users if needed

## Deployment

### Fly.io Deployment

1. Install the Fly CLI:
```bash
curl -L https://fly.io/install.sh | sh
```

2. Log in to Fly.io:
```bash
flyctl auth login
```

3. Create a new app:
```bash
flyctl apps create reachimpact
```

4. Create a PostgreSQL database:
```bash
flyctl postgres create --name reachimpact-db
```

5. Attach the database to your app:
```bash
flyctl postgres attach --app reachimpact reachimpact-db
```

6. Set environment variables:
```bash
flyctl secrets set JWT_SECRET=your-jwt-secret \
  TWILIO_ACCOUNT_SID=your-twilio-account-sid \
  TWILIO_AUTH_TOKEN=your-twilio-auth-token \
  TWILIO_PHONE_NUMBER=your-twilio-phone-number \
  OPENAI_API_KEY=your-openai-api-key
```

7. Deploy the app:
```bash
flyctl deploy
```

### GitHub Actions CI/CD

The repository is configured with GitHub Actions for CI/CD. To set up:

1. Go to your GitHub repository settings
2. Add the following secrets:
   - `FLY_API_TOKEN`: Your Fly.io API token
   - `DATABASE_URL`: PostgreSQL connection string
   - `TWILIO_ACCOUNT_SID`: Twilio Account SID
   - `TWILIO_AUTH_TOKEN`: Twilio Auth Token
   - `TWILIO_PHONE_NUMBER`: Twilio Phone Number
   - `OPENAI_API_KEY`: OpenAI API Key
   - `JWT_SECRET`: JWT Secret for authentication

3. Push to the main branch to trigger deployment

### Custom Domain Setup

To configure the custom domain `reachimpact.io`:

1. Add your domain to Fly.io:
```bash
flyctl domains add reachimpact.io
```

2. Add the app subdomain:
```bash
flyctl domains add app.reachimpact.io
```

3. Configure DNS records with Hostinger:
   - Add an `A` record for `@` pointing to Fly.io's IP addresses
   - Add a `CNAME` record for `app` pointing to `reachimpact.fly.dev`

4. Verify DNS configuration:
```bash
flyctl domains verify reachimpact.io
flyctl domains verify app.reachimpact.io
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Log in a user
- `POST /api/auth/logout`: Log out a user
- `GET /api/auth/verify`: Verify JWT token

### User Endpoints

- `GET /api/user/profile`: Get user profile
- `PUT /api/user/profile`: Update user profile
- `GET /api/user/credits`: Get user credits
- `POST /api/user/credits`: Add credits to user

### Contact Endpoints

- `GET /api/contacts`: Get all user contacts
- `GET /api/contacts/:id`: Get a specific contact
- `POST /api/contacts`: Create a new contact
- `POST /api/contacts/bulk`: Bulk import contacts
- `PUT /api/contacts/:id`: Update a contact
- `DELETE /api/contacts/:id`: Delete a contact
- `GET /api/contacts/search`: Search contacts

### Campaign Endpoints

- `GET /api/campaigns`: Get all user campaigns
- `GET /api/campaigns/:id`: Get a specific campaign
- `POST /api/campaigns`: Create a new campaign
- `PUT /api/campaigns/:id`: Update a campaign
- `DELETE /api/campaigns/:id`: Delete a campaign
- `POST /api/campaigns/:id/start`: Start a campaign
- `POST /api/campaigns/:id/pause`: Pause a campaign
- `POST /api/campaigns/:id/complete`: Complete a campaign

### Call Endpoints

- `GET /api/calls`: Get all user calls
- `GET /api/calls/contact/:contactId`: Get calls by contact
- `GET /api/calls/campaign/:campaignId`: Get calls by campaign
- `POST /api/calls`: Make a call
- `GET /api/calls/:sid`: Get call status
- `POST /api/calls/:sid/end`: End a call
- `POST /api/calls/sms`: Send SMS

### OpenAI Integration Endpoints

- `POST /api/openai/chat`: Chat completion
- `POST /api/openai/multilingual-chat`: Multilingual chat
- `POST /api/openai/translate`: Translate text
- `POST /api/openai/analyze-sentiment`: Analyze sentiment
- `POST /api/openai/parse-contacts`: Parse contacts from text
- `POST /api/openai/generate-script`: Generate call script
- `POST /api/openai/transcribe`: Transcribe audio to text

## License

Copyright (c) 2025 ReachImpact. All rights reserved.