#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Display commands being executed
set -x

# Deploy script for Fly.io
# This script helps to deploy ReachImpact to Fly.io

# Check for Fly CLI
if ! command -v flyctl &> /dev/null; then
    echo "Fly CLI not found. Installing..."
    curl -L https://fly.io/install.sh | sh
    export PATH="$HOME/.fly/bin:$PATH"
fi

# Check if user is logged in to Fly.io
if ! flyctl auth whoami &> /dev/null; then
    echo "You are not logged in to Fly.io. Please log in:"
    flyctl auth login
fi

# Check if app exists
if ! flyctl apps list | grep reachimpact &> /dev/null; then
    echo "Creating Fly.io app 'reachimpact'..."
    flyctl apps create reachimpact
fi

# Check if PostgreSQL database exists
if ! flyctl postgres list | grep reachimpact-db &> /dev/null; then
    echo "Creating PostgreSQL database 'reachimpact-db'..."
    flyctl postgres create --name reachimpact-db --region iad
    
    echo "Attaching database to the app..."
    flyctl postgres attach --app reachimpact reachimpact-db
fi

# Check if volume exists
if ! flyctl volumes list | grep reachimpact_data &> /dev/null; then
    echo "Creating storage volume 'reachimpact_data'..."
    flyctl volumes create reachimpact_data --region iad --size 1
fi

# Set required secrets
echo "Setting required secrets..."

# Check for environment variables
if [ -z "$JWT_SECRET" ]; then
    # Generate a random JWT secret if none is provided
    JWT_SECRET=$(openssl rand -hex 32)
    echo "Generated random JWT_SECRET: $JWT_SECRET"
fi

# Set secrets
echo "Setting JWT_SECRET..."
flyctl secrets set JWT_SECRET="$JWT_SECRET"

# Prompt for Twilio credentials if not already set
if ! flyctl secrets list | grep TWILIO_ACCOUNT_SID &> /dev/null; then
    echo "Please enter your Twilio Account SID:"
    read TWILIO_ACCOUNT_SID
    echo "Setting TWILIO_ACCOUNT_SID..."
    flyctl secrets set TWILIO_ACCOUNT_SID="$TWILIO_ACCOUNT_SID"
fi

if ! flyctl secrets list | grep TWILIO_AUTH_TOKEN &> /dev/null; then
    echo "Please enter your Twilio Auth Token:"
    read TWILIO_AUTH_TOKEN
    echo "Setting TWILIO_AUTH_TOKEN..."
    flyctl secrets set TWILIO_AUTH_TOKEN="$TWILIO_AUTH_TOKEN"
fi

if ! flyctl secrets list | grep TWILIO_PHONE_NUMBER &> /dev/null; then
    echo "Please enter your Twilio Phone Number (E.164 format):"
    read TWILIO_PHONE_NUMBER
    echo "Setting TWILIO_PHONE_NUMBER..."
    flyctl secrets set TWILIO_PHONE_NUMBER="$TWILIO_PHONE_NUMBER"
fi

# Prompt for OpenAI API key if not already set
if ! flyctl secrets list | grep OPENAI_API_KEY &> /dev/null; then
    echo "Please enter your OpenAI API Key:"
    read OPENAI_API_KEY
    echo "Setting OPENAI_API_KEY..."
    flyctl secrets set OPENAI_API_KEY="$OPENAI_API_KEY"
fi

# Deploy the application
echo "Deploying the application..."
flyctl deploy

# Set up custom domain
echo "Do you want to set up the custom domain 'reachimpact.io'? (y/n)"
read setup_domain

if [ "$setup_domain" == "y" ]; then
    echo "Adding domain 'reachimpact.io'..."
    flyctl domains add reachimpact.io
    
    echo "Adding domain 'app.reachimpact.io'..."
    flyctl domains add app.reachimpact.io
    
    echo "Please configure the following DNS records with your domain provider (Hostinger):"
    echo "1. A record for @ pointing to the Fly.io's IP addresses"
    echo "2. CNAME record for 'app' pointing to reachimpact.fly.dev"
    
    echo "After DNS records are configured, verify the domains:"
    echo "flyctl domains verify reachimpact.io"
    echo "flyctl domains verify app.reachimpact.io"
fi

echo "Deployment completed successfully!"
echo "Your application is now available at: https://reachimpact.fly.dev"

if [ "$setup_domain" == "y" ]; then
    echo "Once DNS is properly configured, your app will be available at https://app.reachimpact.io"
fi