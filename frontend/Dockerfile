FROM node:24-alpine

WORKDIR /app

# Install system dependencies for native modules and husky
RUN apk add --no-cache git python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies (skip husky and all lifecycle scripts in Docker build)
RUN npm install --ignore-scripts

# Copy application code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
