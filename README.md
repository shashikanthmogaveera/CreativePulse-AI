# CreativePulse AI

An AI-powered creative analytics platform for marketing teams that connects what a creative looks like with how it performs, turning those observed relationships into measurable Creative DNA.

## Overview

CreativePulse helps marketing teams answer:
1. Which creatives perform better?
2. What visual characteristics are associated with performance differences?
3. How strong is the evidence?
4. Which creatives should be investigated further?
5. How can existing creatives be repurposed into different formats?

**Important**: CreativePulse is an analytics/evidence system, not a causal inference system. It identifies associations and patterns, never claiming that visual features "cause" better performance.

## Architecture

```
┌────────────────────┐
│     Next.js UI     │
│                    │
│ Dashboard          │
│ Library            │
│ Creative DNA       │
│ Performance        │
│ Repurpose          │
│ AI Assistant       │
└─────────┬──────────┘
          │ REST API
          ↓
┌────────────────────┐
│     FastAPI        │
│                    │
│ Auth               │
│ Analysis lifecycle │
│ Upload             │
│ Analytics          │
│ Creative DNA       │
│ Repurpose          │
└───────┬───────┬────┘
        │       │
┌───────┘       └───────────────┐
↓                               ↓
┌─────────────────┐     ┌─────────────────┐
│   PostgreSQL    │     │   Cloudinary    │
│                 │     │                 │
│ users           │     │ creatives       │
│ analyses        │     │ transformations │
│ assets          │     │ optimized media │
│ performance     │     │                 │
│ features        │     └─────────────────┘
│ DNA insights    │
│ generated       │
└─────────────────┘
```

## Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Responsive SaaS dashboard design

**Backend:**
- Python
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- Pandas, NumPy
- Pillow (image processing)
- SciPy (statistics)
- PyJWT, bcrypt
- Cloudinary SDK

**Infrastructure:**
- PostgreSQL
- Cloudinary
- Environment-based configuration

## Database Schema

### users
- id, email, password_hash, created_at, updated_at

### analyses
- id, user_id, name, description, status, current_stage, created_at, updated_at

### assets
- id, analysis_id, creative_id, filename, cloudinary_public_id, cloudinary_url, secure_url, width, height, format, bytes, source, created_at

### performance_records
- id, analysis_id, creative_id, platform, impressions, clicks, conversions, spend, revenue, date, created_at

### creative_features
- id, analysis_id, creative_id, aspect_ratio, brightness, contrast, edge_density, dominant_color, bright_background, portrait, landscape, human_present, feature_sources, created_at

### creative_dna_insights
- id, analysis_id, feature_name, metric_name, positive_group, negative_group, positive_median, negative_median, percent_difference, sample_size_positive, sample_size_negative, p_value, effect_size, evidence_tier, explanation, created_at

### generated_assets
- id, analysis_id, source_asset_id, format, transformation, generated_url, created_at

## Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/creativepulse

# JWT
JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Create a `.env.local` file in the `frontend/` directory:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Cloudinary account (optional for basic functionality)

### PostgreSQL Setup

1. Install PostgreSQL
2. Create database:
```sql
CREATE DATABASE creativepulse;
CREATE USER creativepulse_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE creativepulse TO creativepulse_user;
```

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Unix/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit: http://localhost:3000

## Running Migrations

```bash
cd backend

# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Running Tests

```bash
cd backend
pytest

cd frontend
npm run type-check
npm run lint
```

## Demo Pipeline

Generate demo data and run analysis:

```bash
cd scripts
python run_demo_analysis.py
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Analytics Methodology

### Performance Metrics
- **CTR**: clicks / impressions
- **Conversion Rate**: conversions / clicks
- **CPC**: spend / clicks
- **ROAS**: revenue / spend
- **CPM**: (spend / impressions) * 1000

### Visual Feature Extraction
- Aspect ratio
- Brightness (mean normalized pixel brightness)
- Contrast (standard deviation of luminance)
- Edge density (proportion of edge pixels)
- Dominant color
- Bright background
- Portrait/Landscape orientation
- Human presence (when available)

### Creative DNA Statistical Analysis

For each visual feature, creatives are grouped into positive/negative cohorts and compared using:

- **Mann-Whitney U Test**: Non-parametric test appropriate for performance distributions
- **Rank-Biserial Effect Size**: Measures the magnitude of difference
- **Median Comparison**: Shows practical difference
- **Minimum Sample Size**: 5 creatives per group required

### Evidence Tiers

- **Strong**: Statistically significant + meaningful effect + sufficient sample
- **Moderate**: Meaningful effect with weaker statistical evidence
- **Weak**: Small effect or weak statistical evidence
- **No Clear Evidence**: Little/no observed difference
- **Insufficient Evidence**: Group size below minimum threshold

## Association vs. Causation

**Critical Principle**: CreativePulse identifies associations and patterns in your data. It never claims that visual features "cause" better performance.

Language used:
- "associated with"
- "observed difference"
- "higher median"
- "statistical evidence"
- "relationship"
- "pattern"

Language never used:
- "causes"
- "guarantees"
- "will increase"
- "makes creatives successful"

## Cloudinary Integration

Cloudinary provides:
- Asset storage and optimization
- Signed upload for security
- Responsive transformations
- Format conversion
- Quality optimization
- Creative repurposing

Supported repurposing formats:
- 4:5 (Instagram portrait)
- 9:16 (Story format)
- 16:9 (Landscape/YouTube)
- 1:1 (Square/Feed)

## Product Flow

```
Upload creative assets
        +
Upload performance data
        ↓
CreativePulse validates and connects them
        ↓
Computes performance metrics
        ↓
Extracts visual characteristics
        ↓
Statistically compares characteristics
        ↓
Generates Creative DNA
        ↓
Shows evidence-backed insights
        ↓
Allows creatives to be repurposed through Cloudinary
```

## Limitations

- Small sample sizes may produce unreliable results
- Association does not imply causation
- Visual features are deterministic approximations
- Platform differences may confound results
- Temporal factors not accounted for
- Selection bias in uploaded creatives

## Security

- JWT-based authentication
- bcrypt password hashing
- Environment-based secrets
- Cloudinary signed uploads
- Analysis ownership validation
- Input validation on all uploads

## License

Hackathon Project

## Contact

For questions or issues, please create an issue in the repository.
