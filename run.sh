#!/bin/bash

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
npm run build
cd ..

# Start backend server
echo "Starting backend server..."
cd backend
npm start &
cd ..

# Start frontend server
echo "Starting frontend server..."
npm run dev
