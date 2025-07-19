#!/bin/bash
# This script provides conceptual steps for deploying the gateway.
# In a Next.js setup, the deployment of the gateway is part of the Next.js app deployment.

echo "--- DITAPI Gateway Deployment Script ---"

# 1. Build the Next.js application (which includes the gateway API routes)
echo "Building Next.js application..."
npm run build

# 2. (Optional) Build and push Docker image for the gateway if deployed separately
# This step is relevant if you decide to extract the gateway into its own microservice.
# For a Next.js App Router setup, the gateway is part of the Next.js app.
# echo "Building Docker image for DITAPI Gateway..."
# docker build -t your-docker-registry/ditapi-gateway:latest .
# echo "Pushing Docker image..."
# docker push your-docker-registry/ditapi-gateway:latest

# 3. Deploy to Kubernetes (if using K8s)
echo "Applying Kubernetes configurations..."
# Ensure your Kubernetes context is set correctly
# kubectl apply -f gateway/k8s/deployment.yaml
# kubectl apply -f gateway/k8s/service.yaml
# kubectl apply -f gateway/k8s/ingress.yaml # If using Ingress

echo "Deployment steps for DITAPI Gateway (as part of Next.js app) completed."
echo "For Vercel deployment, simply push your changes to your Git repository and Vercel will handle the build and deployment."
echo "Ensure your environment variables are configured on Vercel."
