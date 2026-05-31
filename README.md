# Inventra — Inventory & Order Management System

A production-ready, modern SaaS inventory and order management system built with FastAPI, React, PostgreSQL, and Docker.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.12-blue.svg)
![React](https://img.shields.io/badge/react-18-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-green.svg)

## ✨ Features

- **Dashboard** — Real-time KPI cards, low stock alerts, recent orders, and inventory value tracking
- **Product Management** — Full CRUD with SKU uniqueness, stock tracking, and search
- **Customer Management** — Customer registry with email uniqueness, avatar initials, and search
- **Order Management** — Professional order creation with product picker, quantity controls, and dynamic totals
- **Invoice View** — Order details rendered in an invoice-style layout
- **Responsive Design** — Desktop tables convert to mobile cards, sidebar becomes drawer
- **Modern UI/UX** — Inspired by Linear, Stripe, and Vercel dashboards

## 🏗️ Architecture

```mermaid
graph TB
    subgraph "Client"
        FE[React SPA<br/>Vite + MUI]
    end

    subgraph "Reverse Proxy"
        NG[Nginx]
    end

    subgraph "API Server"
        BE[FastAPI<br/>Uvicorn]
    end

    subgraph "Database"
        PG[(PostgreSQL 16)]
    end

    FE --> NG
    NG -->|/api/*| BE
    NG -->|static| FE
    BE --> PG
```

## 📊 Database Schema

```mermaid
erDiagram
    Product {
        int id PK
        string name
        string sku UK
        float price
        int quantity_in_stock
        datetime created_at
        datetime updated_at
    }
    Customer {
        int id PK
        string full_name
        string email UK
        string phone
        datetime created_at
    }
    Order {
        int id PK
        int customer_id FK
        float total_amount
        datetime created_at
    }
    OrderItem {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
        float unit_price
        float subtotal
    }
    Customer ||--o{ Order : places
    Order ||--|{ OrderItem : contains
    Product ||--o{ OrderItem : referenced_in
```

## 📡 API Documentation

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/products` | Create product |
| GET | `/api/v1/products` | List products (with `?search=`) |
| GET | `/api/v1/products/{id}` | Get product |
| PUT | `/api/v1/products/{id}` | Update product |
| DELETE | `/api/v1/products/{id}` | Delete product |

### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/customers` | Create customer |
| GET | `/api/v1/customers` | List customers (with `?search=`) |
| GET | `/api/v1/customers/{id}` | Get customer |
| DELETE | `/api/v1/customers/{id}` | Delete customer |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/orders` | Create order (with stock validation) |
| GET | `/api/v1/orders` | List orders |
| GET | `/api/v1/orders/{id}` | Get order details |
| DELETE | `/api/v1/orders/{id}` | Delete order |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dashboard/summary` | Dashboard KPIs & activity |

### Swagger UI
Available at: `http://localhost:8000/docs`

## 🚀 Quick Start with Docker

```bash
# Clone the repository
git clone <repository-url>
cd inventory-management-system

# Start all services
docker compose up --build

# Access the application
# Frontend:  http://localhost
# Backend:   http://localhost:8000
# API Docs:  http://localhost:8000/docs
```

## 🛠️ Local Development Setup

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env

# Start PostgreSQL (or use Docker)
docker run -d --name postgres -p 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=inventory_db \
  postgres:16-alpine

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start dev server
npm run dev
```

## 🧪 Testing

```bash
cd backend
pytest tests/ -v
```

### Test Coverage
- ✅ Product CRUD
- ✅ Duplicate SKU validation
- ✅ Customer CRUD
- ✅ Duplicate email validation
- ✅ Order creation with stock validation
- ✅ Insufficient stock handling
- ✅ Stock reduction verification
- ✅ Dashboard summary
- ✅ Input validation (price, email, empty items)

## 🐳 Docker Architecture

| Service | Image | Port |
|---------|-------|------|
| `frontend` | Node build → Nginx | `80` |
| `backend` | Python 3.12 slim | `8000` |
| `postgres` | PostgreSQL 16 Alpine | `5432` |

Features:
- Named volume for database persistence
- Health checks for all services
- Service dependency ordering
- Internal Docker network
- Restart policies

## 🌐 Deployment

### Backend (Render)

| Setting | Value |
|---------|-------|
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Environment | `DATABASE_URL`, `SECRET_KEY`, `ALLOWED_ORIGINS` |

### Frontend (Vercel)

| Setting | Value |
|---------|-------|
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Environment | `VITE_API_BASE_URL=https://your-api.onrender.com/api/v1` |

## 🔐 Environment Variables

### Backend
| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/inventory_db` |
| `SECRET_KEY` | Application secret key | `dev-secret-key` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:5173` |

### Frontend
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `/api/v1` |

## 🗂️ Project Structure

```
inventory-management-system/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers
│   │   ├── core/         # Configuration
│   │   ├── db/           # Database session
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   ├── utils/        # Exception handlers
│   │   └── main.py       # FastAPI app
│   ├── tests/            # Pytest tests
│   ├── alembic/          # Database migrations
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/          # Axios client
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # React Context state
│   │   ├── layouts/      # App layout with sidebar
│   │   ├── pages/        # Page components
│   │   └── utils/        # MUI theme
│   ├── nginx.conf
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .github/workflows/ci.yml
└── README.md
```

## 🔮 Future Improvements

- [ ] User authentication (JWT)
- [ ] Role-based access control
- [ ] Product categories and tags
- [ ] Order status tracking (pending → shipped → delivered)
- [ ] Export reports to CSV/PDF
- [ ] Bulk import products
- [ ] Email notifications for low stock
- [ ] Analytics and charts
- [ ] Audit log
- [ ] API rate limiting

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
