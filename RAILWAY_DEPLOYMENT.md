# Railway Deployment Guide

This guide covers deploying the Etape Training Hub to Railway.app with separate backend and frontend services.

## Architecture

Railway deployment uses two separate services:
- **Backend Service**: FastAPI application with PostgreSQL database
- **Frontend Service**: Nginx serving static React build

The frontend makes API calls directly to the backend URL (no nginx proxying).

## Prerequisites

- Railway account (https://railway.app)
- GitHub repository connected to Railway
- Railway CLI (optional): `npm i -g @railway/cli`

## Backend Deployment

### 1. Create Backend Service

1. Go to Railway dashboard and create a new project
2. Click "New Service" → "GitHub Repo" → Select `etape-training-hub`
3. Configure the service:
   - **Name**: `etape-backend`
   - **Root Directory**: `/backend`
   - **Build Command**: (Railway auto-detects Dockerfile)
   - **Start Command**: (Uses CMD from Dockerfile)

### 2. Add PostgreSQL Database

1. In your Railway project, click "New Service" → "Database" → "PostgreSQL"
2. Railway will automatically create a database and provide connection URL

### 3. Configure Backend Environment Variables

Add these environment variables to the backend service:

```bash
# Database (automatically set by Railway when you add PostgreSQL)
DATABASE_URL=${POSTGRES_URL}

# Security - CHANGE THESE!
SECRET_KEY=your-secret-key-here-use-openssl-rand-hex-32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS - Add your frontend domain
CORS_ORIGINS=["https://your-frontend-domain.railway.app"]

# Optional
PROJECT_NAME=Etape Training Hub
VERSION=1.0.0
```

**Generate a secure SECRET_KEY**:
```bash
openssl rand -hex 32
```

### 4. Deploy Backend

Railway will automatically deploy when you push to GitHub. Get the backend URL from Railway dashboard (e.g., `https://etape-backend-production.up.railway.app`).

## Frontend Deployment

### 1. Create Frontend Service

1. In the same Railway project, click "New Service" → "GitHub Repo" → Select `etape-training-hub`
2. Configure the service:
   - **Name**: `etape-frontend`
   - **Root Directory**: `/frontend`
   - **Build Command**: (Railway auto-detects Dockerfile)
   - **Start Command**: (Uses CMD from Dockerfile)

### 2. Configure Frontend Environment Variables

Add this **build-time** environment variable to the frontend service:

```bash
# Point to your backend service URL (used during build)
VITE_API_BASE_URL=https://your-backend-domain.up.railway.app
```

**IMPORTANT**:
- Use the exact backend URL from Railway (without trailing slash)
- This variable is used during the Docker build process and gets baked into the JavaScript bundle
- After setting this variable, Railway will automatically trigger a rebuild
- Make sure to deploy the backend first to get its URL

**Alternative**: You can also set this as a Docker build argument in Railway:
1. Go to Service Settings → Variables
2. Add `VITE_API_BASE_URL` with your backend URL
3. Railway automatically passes this to the Docker build

### 3. Deploy Frontend

Railway will automatically deploy when you:
- Push changes to GitHub
- Change environment variables (triggers rebuild)

The frontend will be available at the URL shown in Railway dashboard.

## Networking

Railway services can communicate using:
- **Public URLs**: Use the public Railway URLs (recommended for frontend→backend)
- **Private Network**: Enable Railway's private networking for service-to-service communication (optional)

## Environment Variables Reference

### Backend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Auto-set by Railway |
| `SECRET_KEY` | JWT signing key | Generated with `openssl rand -hex 32` |
| `CORS_ORIGINS` | Allowed frontend origins | `["https://frontend.railway.app"]` |

### Frontend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `https://backend.railway.app` |

## Post-Deployment Setup

### 1. Create Admin User

After deployment, create an admin user:

```bash
# Register a user via API
curl -X POST "https://your-backend-domain.railway.app/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secure-password","full_name":"Admin User"}'

# Access the database via Railway CLI or dashboard
# Update the user's role to admin
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

### 2. Verify Deployment

Test the deployment:

```bash
# Health check
curl https://your-backend-domain.railway.app/health

# Frontend
open https://your-frontend-domain.railway.app
```

## Database Migrations

Railway automatically runs the database schema creation on startup via SQLAlchemy's `Base.metadata.create_all()` in `backend/app/main.py`.

For production, consider using Alembic migrations:

```bash
# Connect to Railway via CLI
railway link

# Run migrations
railway run alembic upgrade head
```

## Troubleshooting

### Backend Issues

**Issue**: Database connection fails
- **Solution**: Ensure PostgreSQL service is added and `DATABASE_URL` is set

**Issue**: CORS errors
- **Solution**: Update `CORS_ORIGINS` environment variable with frontend URL

**Issue**: 500 errors
- **Solution**: Check Railway logs for stack traces

### Frontend Issues

**Issue**: API calls fail with 404
- **Solution**: Verify `VITE_API_BASE_URL` is set correctly (no trailing slash)

**Issue**: Blank page after deployment
- **Solution**: Check that build completed successfully and nginx is serving files

**Issue**: Routes return 404
- **Solution**: Ensure nginx.conf has `try_files $uri $uri/ /index.html` for SPA routing

## Monitoring

Railway provides built-in monitoring:
- **Metrics**: CPU, Memory, Network usage
- **Logs**: Real-time application logs
- **Deployments**: History of all deployments

Access via Railway dashboard → Service → Metrics/Logs

## Custom Domain (Optional)

To use a custom domain:

1. Go to Service Settings → Domain
2. Click "Add Custom Domain"
3. Enter your domain (e.g., `app.yourdomain.com`)
4. Add the CNAME record to your DNS provider
5. Update `CORS_ORIGINS` on backend with new domain

## Cost Optimization

Railway offers:
- **Free Tier**: $5 credit/month
- **Pro Plan**: $20/month + usage

Tips:
- Use Railway's sleep mode for development environments
- Monitor resource usage in dashboard
- Scale services based on actual traffic

## Security Checklist

- [ ] Change `SECRET_KEY` from default
- [ ] Set strong database password
- [ ] Configure `CORS_ORIGINS` with only allowed domains
- [ ] Enable Railway's private networking
- [ ] Use environment variables for all secrets
- [ ] Enable Railway's automatic HTTPS
- [ ] Regularly update dependencies
- [ ] Monitor Railway logs for suspicious activity

## Additional Resources

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- FastAPI Deployment: https://fastapi.tiangolo.com/deployment/
