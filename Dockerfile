# Stage 1: Build the frontend, and install server dependencies
FROM node:22 AS builder

WORKDIR /app

# Copy all files from the current directory
COPY . ./
RUN echo "API_KEY=PLACEHOLDER" > ./.env
RUN echo "GEMINI_API_KEY=PLACEHOLDER" >> ./.env
RUN echo "OLLAMA_HOST=PLACEHOLDER" >> ./.env
RUN echo "OLLAMA_MODEL=PLACEHOLDER" >> ./.env

# Install server dependencies
WORKDIR /app/server
RUN npm install

# Install dependencies and build the frontend
WORKDIR /app
RUN mkdir dist
RUN bash -c 'if [ -f package.json ]; then npm install && npm run build; fi'


# Stage 2: Build the final server image
FROM node:22

WORKDIR /app

#Copy server files
COPY --from=builder /app/server .
# Copy built frontend assets from the builder stage
COPY --from=builder /app/dist ./dist

# Document expected environment variables
# OLLAMA_HOST: Host URL for Ollama service (default: http://host.docker.internal:11434 for Docker Desktop)
# OLLAMA_MODEL: Model to use (default: qwen3.5:latest)
# API_KEY/GEMINI_API_KEY: For Gemini AI services
# PORT: Server port (default: 3000)
# NODE_ENV: Node environment (development/production)

EXPOSE 3000

CMD ["node", "server.js"]
