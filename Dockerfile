# Use the official Node.js image from the Docker Hub
FROM node:20.12.1

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Expose the port that your app runs on
EXPOSE 7000

# Command to run your application
CMD ["npm", "start"]
