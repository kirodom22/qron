#!/bin/bash

echo "🎮 Lightcycle Arena - Setup Script"
echo "=================================="
echo ""

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"
echo ""

# Install dependencies
echo "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created"
    echo "⚠️  Please edit .env with your configuration"
else
    echo "✅ .env file already exists"
fi
echo ""

# Create necessary directories
echo "Creating directories..."
mkdir -p logs
mkdir -p backups
echo "✅ Directories created"
echo ""

echo "=================================="
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Run 'npm run dev' to start development server"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "For production deployment, see DEPLOYMENT.md"
echo "=================================="
