#!/bin/bash

# ------------------------------
# Functions
# ------------------------------
timestamp() {
  date +"%Y%m%d%H%M%S"
}

# ------------------------------
# Variables
# ------------------------------
APP_ENV=prod
DOCKERFILE="frontend/docker/$APP_ENV/Dockerfile"
DOCKER_REPO_NAME="010497/ion-reader"
PACKAGE_VERSION=$(node -p "require('./frontend/package.json').version")
TAG_VERSION_BUILD_NUMBER="$DOCKER_REPO_NAME:$PACKAGE_VERSION-build.$(timestamp)"
TAG_VERSION="$DOCKER_REPO_NAME:$PACKAGE_VERSION"
TAG_LATEST="$DOCKER_REPO_NAME:latest"

# ------------------------------
# Script
# ------------------------------
echo "Building Docker image..."
echo "Dockerfile: $DOCKERFILE"
echo "Tag: $TAG_VERSION_BUILD_NUMBER"

# Build the Docker image
docker build -t "$TAG_VERSION_BUILD_NUMBER" -t "$TAG_VERSION" -t "$TAG_LATEST" -f "$DOCKERFILE" ./frontend

# Check if build was successful
if [ $? -ne 0 ]; then
  echo "Error: Docker build failed!"
  exit 1
fi

echo "Docker image built successfully!"
echo "Tags:"
echo "- $TAG_VERSION_BUILD_NUMBER"
echo "- $TAG_VERSION"
echo "- $TAG_LATEST"

# Ask for confirmation before pushing
read -p "Do you want to push the image to DockerHub? (y/n): " PUSH_CONFIRMATION

if [ "$PUSH_CONFIRMATION" = "y" ] || [ "$PUSH_CONFIRMATION" = "Y" ]; then
  echo "Pushing Docker image to DockerHub..."
  
  # Check if user is logged in to Docker
  if ! docker info | grep -q "Username"; then
    echo "You are not logged in to DockerHub. Please login:"
    docker login
    
    # Check if login was successful
    if [ $? -ne 0 ]; then
      echo "Error: Docker login failed!"
      exit 1
    fi
  fi
  
  # Push all tags
  docker push "$TAG_VERSION_BUILD_NUMBER"
  docker push "$TAG_VERSION"
  docker push "$TAG_LATEST"
  
  echo "Docker image pushed successfully to DockerHub!"
else
  echo "Skipping push to DockerHub."
fi

echo "Deployment script completed!"
