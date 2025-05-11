# Fastify App for Fly.io Deployment

This is a simple Fastify web application set up for deployment on Fly.io.

## Project Structure

- `app.js` - The main Fastify application that listens on port 3000 and serves a simple message
- `package.json` - Node.js package configuration with required dependencies
- `Dockerfile` - Container configuration for Fly.io deployment
- `fly.toml` - Fly.io deployment configuration

## Features

- Simple GET route at "/" that returns "Hello from Fastify on Fly.io!"
- Properly configured for Fly.io deployment
- Uses Fastify for high-performance, low-overhead web server

## Deployment Instructions

1. Install the Fly.io CLI by following instructions at https://fly.io/docs/hands-on/install-flyctl/

2. Log in to your Fly.io account:
   ```
   fly auth login
   ```

3. Navigate to this directory:
   ```
   cd fly-deployment
   ```

4. Rename the files to their standard names:
   ```
   mv package-fly.json package.json
   mv fly-app.toml fly.toml
   mv Dockerfile-fly Dockerfile
   ```

5. Launch the deployment:
   ```
   fly launch --copy-config --name my-fly-app
   ```

6. Deploy your app:
   ```
   fly deploy
   ```

## Configuration Details

- Application is configured to run on port 3000 inside the container
- Fly.io routes external HTTP traffic to this internal port
- The app runs as an ES module, note the "type": "module" in package.json