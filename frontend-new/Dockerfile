FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy project files
COPY . .

# Build the app
RUN npm run build

# Install serve to run the application
RUN npm install -g serve

# Expose port
EXPOSE 5173

# Command to run the application in development mode
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# For production, use:
# CMD ["serve", "-s", "dist", "-l", "5173"]