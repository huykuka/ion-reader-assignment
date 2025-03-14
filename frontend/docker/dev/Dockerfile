# Use the official lightweight Node.js 20 Alpine image as the base image
FROM node:22-alpine

RUN #apk add --no-cache bash
# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available) to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install --force --verbose

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port that the app runs on
EXPOSE 4200

# Command to start the development server
CMD ["npm", "run", "start"]
