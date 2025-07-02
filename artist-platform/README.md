# Artist Platform

A platform for artists to upload and monetize their music through subscriptions and streaming.

## Features

- User registration and authentication
- Artist profile management
- Track upload and management
- Subscription system
- Streaming with payment processing
- Artist earnings tracking

## Deployment Guide

### Prerequisites

- Python 3.8+
- Node.js 14+
- PostgreSQL (for Railway deployment)

### Railway Deployment

1. Push your code to GitHub
2. Create a new Railway project
3. Connect your GitHub repository
4. Set up the following environment variables:
   - `SECRET_KEY`: Your application secret key
   - `DATABASE_URL`: Your PostgreSQL database URL (provided by Railway)
   - `PORT`: 5001

5. Railway will automatically:
   - Create a PostgreSQL database
   - Set up SSL certificates
   - Configure environment variables
   - Deploy your application

### Local Development

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file with:
   ```
   SECRET_KEY=your-secret-key
   DATABASE_URL=sqlite:///artist_platform.db
   PORT=5001
   ```
5. Run the application:
   ```bash
   python app.py
   ```

## API Documentation

### Authentication

- `POST /api/register` - Register a new user
- `POST /api/login` - Login user

### Artist Features

- `POST /api/upload/track` - Upload a new track
- `GET /api/tracks` - Get all tracks
- `POST /api/subscribe/<artist_id>` - Subscribe to an artist
- `POST /api/stream/<track_id>` - Stream a track

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Secure file uploads
- CORS protection
- Input validation
