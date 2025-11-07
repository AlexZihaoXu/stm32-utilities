#!/bin/bash

# STM32 Utilities - Linux/macOS Deploy Script

set -e  # Exit on error

echo "🚀 Starting deployment for STM32 Utilities..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose found"

# Stop and remove existing container if it exists
if [ "$(docker ps -aq -f name=stm32-utilities)" ]; then
    echo "🔄 Stopping and removing existing container..."
    docker-compose down
fi

# Remove old images
if [ "$(docker images -q stm32-utilities_stm32-utilities 2> /dev/null)" ]; then
    echo "🧹 Removing old image..."
    docker rmi stm32-utilities_stm32-utilities
fi

# Build and start the container
echo "🔨 Building Docker image..."
docker-compose build --no-cache

echo "🚢 Starting container..."
docker-compose up -d

# Wait for container to be healthy
echo "⏳ Waiting for application to start..."
sleep 3

# Check if container is running
if [ "$(docker ps -q -f name=stm32-utilities)" ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Application is running at: http://localhost:3000"
    echo ""
    echo "Useful commands:"
    echo "  - View logs: docker-compose logs -f"
    echo "  - Stop: docker-compose down"
    echo "  - Restart: docker-compose restart"
else
    echo "❌ Deployment failed. Check logs with: docker-compose logs"
    exit 1
fi
