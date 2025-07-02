# BlockMusic Wallet Integration

This project integrates Reown Cloud's WalletKit with a modern web application.

## Project Structure

- Frontend: React + TypeScript + Vite
- Backend: Flask + Python
- Styling: Tailwind CSS

## Setup Instructions

### Main Application Setup
1. Navigate to the project directory:
```bash
cd project
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Install frontend dependencies:
```bash
npm install
```

4. Run the development servers:
```bash
# Backend (in one terminal)
python app.py

# Frontend (in another terminal)
npm run dev
```

### Artist Platform Setup
1. Navigate to the artist-platform directory:
```bash
cd artist-platform
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Run the artist platform server:
```bash
python app.py
```

### Environment Variables
Create `.env` files in both directories with:
- `SECRET_KEY` for security
- `DATABASE_URL` for database connection
- Other configuration settings as needed

## Project Structure

```
BLockMusic(Pricesadj)/
├── project/             # Main application
│   ├── src/            # Frontend source code
│   ├── app.py          # Flask backend
│   ├── requirements.txt # Python dependencies
│   └── .env            # Environment variables
├── artist-platform/    # Artist platform
│   ├── src/           # Frontend source code
│   ├── app.py         # Flask backend
│   ├── requirements.txt # Python dependencies
│   └── .env           # Environment variables
└── README.md          # Project documentation
```
