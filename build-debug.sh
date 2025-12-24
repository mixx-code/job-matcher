#!/bin/bash

echo "🚀 Building job-matcher with debug..."

# Clean previous builds
rm -rf .next 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

# Build dengan output verbose
docker build --progress=plain --no-cache -t job-matcher-debug . 2>&1 | tee docker-build.log

echo ""
echo "📊 Build completed. Check docker-build.log for details"

# Cek apakah image berhasil dibuat
if docker images | grep -q "job-matcher-debug"; then
    echo "✅ Image created successfully"
    
    # Test run container
    echo "🧪 Testing container..."
    docker run --rm -d --name test-build -p 3001:3000 job-matcher-debug
    
    sleep 5
    
    # Cek container status
    if docker ps | grep -q "test-build"; then
        echo "✅ Container is running"
        echo "🌐 Open http://localhost:3001"
    else
        echo "❌ Container failed to start"
        docker logs test-build
    fi
    
    # Cleanup
    docker stop test-build 2>/dev/null || true
    docker rm test-build 2>/dev/null || true
else
    echo "❌ Image creation failed"
    grep -A5 -B5 "ERROR\|Failed\|error" docker-build.log | tail -20
fi