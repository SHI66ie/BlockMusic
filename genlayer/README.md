# BlockMusic GenLayer Docker Setup

This directory contains Docker configuration for running BlockMusic's GenLayer intelligent contracts in a containerized environment.

## Overview

GenLayer intelligent contracts provide AI-powered capabilities for:
- **Content Moderation** - AI analysis of music uploads for policy compliance
- **Copyright Verification** - Detection of potential copyright infringement
- **Music Recommendations** - Personalized track recommendations based on listening patterns

## Prerequisites

- Docker (v20.10+)
- Docker Compose (v2.0+)
- (Optional) GenLayer CLI for local development

## Quick Start

### 1. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- `GENLAYER_NETWORK` - Network to connect to (simulator/testnet/mainnet)
- `MUSIC_NFT_CONTRACT` - Address of your deployed MusicNFT contract
- `WEB3_PROVIDER_URL` - Base Sepolia RPC URL

### 2. Build and Run with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f genlayer-api

# Stop services
docker-compose down
```

### 3. Build and Run with Docker (without Compose)

```bash
# Build the image
docker build -t blockmusic-genlayer .

# Run the container
docker run -d \
  --name blockmusic-genlayer \
  -p 8000:8000 \
  --env-file .env \
  blockmusic-genlayer
```

## API Endpoints

Once running, the API is available at `http://localhost:8000`

### Health Check
```bash
curl http://localhost:8000/health
```

### Content Moderation
```bash
curl -X POST http://localhost:8000/moderate \
  -H "Content-Type: application/json" \
  -d '{
    "track_id": "track_123",
    "track_title": "My Song",
    "artist_name": "Artist Name",
    "album_name": "My Album",
    "genre": "Hip Hop",
    "description": "A great song",
    "is_explicit": false
  }'
```

### Copyright Verification
```bash
curl -X POST http://localhost:8000/copyright \
  -H "Content-Type: application/json" \
  -d '{
    "track_id": "track_123",
    "track_title": "My Song",
    "artist_name": "Artist Name",
    "claimed_original": true,
    "sample_sources": "Sample 1, Sample 2"
  }'
```

### Music Recommendations
```bash
curl -X POST http://localhost:8000/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "genres_listened": "Hip Hop, R&B",
    "favorite_artists": "Artist1, Artist2",
    "recent_tracks": "track_1,track_2,track_3",
    "available_track_ids": "track_1,track_2,track_3,track_4,track_5"
  }'
```

## Architecture

```
┌─────────────────┐
│   FastAPI       │
│   (Port 8000)   │
└────────┬────────┘
         │
         ├─► MusicContentModerator
         ├─► CopyrightVerifier
         └─► MusicRecommender
                │
                ▼
         ┌──────────────┐
         │   GenLayer    │
         │   Network     │
         └──────────────┘
                │
                ▼
         ┌──────────────┐
         │  Base Sepolia │
         │  (EVM)        │
         └──────────────┘
```

## Services

### genlayer-api
Main API service that wraps GenLayer contracts with HTTP endpoints.

- **Port**: 8000
- **Environment**: See `.env.example`
- **Volumes**: 
  - `./contracts:/app/contracts` - Contract files
  - `./logs:/app/logs` - Application logs

### redis (Optional)
Redis instance for caching contract results and API responses.

- **Port**: 6379
- **Volume**: `redis-data` - Persistent data storage

## Development

### Local Development without Docker

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export GENLAYER_NETWORK=simulator
export MUSIC_NFT_CONTRACT=0xF29A2DCC8877fac176C36F30d6245C4320e90841

# Run API server
python api.py
```

### Testing GenLayer Contracts

```bash
# Install GenLayer CLI
npm install -g genlayer

# Initialize GenLayer project
genlayer init

# Deploy to simulator
genlayer deploy --network simulator

# Call contract method
genlayer call MusicContentModerator moderate_content \
  --args "track_123,My Song,Artist Name,My Album,Hip Hop,A great song,false"
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs genlayer-api

# Rebuild without cache
docker-compose build --no-cache
```

### Connection to GenLayer network fails
- Ensure `GENLAYER_RPC_URL` is correct in `.env`
- Check if GenLayer network is running
- Verify network connectivity

### API returns 500 errors
- Check container logs for detailed error messages
- Verify environment variables are set correctly
- Ensure MusicNFT contract address is valid

## Production Deployment

### Using Docker Compose

Update `docker-compose.yml` for production:
- Remove volume mounts for contracts/logs
- Set `restart: always`
- Use proper environment variable management
- Enable Redis for caching

### Using Kubernetes

Example Kubernetes manifests can be added in `k8s/` directory:
- `deployment.yaml` - Pod deployment
- `service.yaml` - Service exposure
- `configmap.yaml` - Configuration
- `secret.yaml` - Sensitive data

## Monitoring

### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f genlayer-api
```

### Metrics (Future)
- Add Prometheus metrics endpoint
- Set up Grafana dashboards
- Monitor contract execution times

## Security

- Never commit `.env` file with real private keys
- Use secrets management in production (AWS Secrets Manager, HashiCorp Vault)
- Enable HTTPS/TLS for API in production
- Implement rate limiting on API endpoints
- Validate all input data before processing

## License

MIT
