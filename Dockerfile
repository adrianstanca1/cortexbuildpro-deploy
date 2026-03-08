# Final server image
FROM node:22

WORKDIR /app

# Copy server-specific files (from the server subdirectory in our staging area)
COPY server/package*.json ./
RUN npm install --omit=dev

# Copy server logic and public folder
COPY server/server.js ./
COPY server/public ./public

# Copy built frontend assets
COPY dist ./dist

EXPOSE 3000

ENV PORT=3000

CMD ["node", "server.js"]
