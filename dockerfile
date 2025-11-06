# Use a lightweight Node base
FROM node:20-alpine3.18 AS base

# Set working directory inside container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production=false

# Copy the rest of the application
COPY . .

# Expose app port
EXPOSE 3002

# Set NODE_ENV and start command
ENV NODE_ENV=development

# Default command to start app
CMD ["npm", "run", "start"]
