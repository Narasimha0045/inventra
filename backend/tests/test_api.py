import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_db


# Use SQLite in-memory for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    """Create tables before each test and drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


# ─── Product Tests ───────────────────────────────────────────────────────────

def test_create_product(client):
    response = client.post("/api/v1/products", json={
        "name": "Test Product",
        "sku": "TEST-001",
        "price": 29.99,
        "quantity_in_stock": 100,
    })
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["name"] == "Test Product"
    assert data["data"]["sku"] == "TEST-001"
    assert data["data"]["price"] == 29.99
    assert data["data"]["quantity_in_stock"] == 100


def test_duplicate_sku(client):
    client.post("/api/v1/products", json={
        "name": "Product A",
        "sku": "DUP-001",
        "price": 10.00,
        "quantity_in_stock": 50,
    })
    response = client.post("/api/v1/products", json={
        "name": "Product B",
        "sku": "DUP-001",
        "price": 20.00,
        "quantity_in_stock": 30,
    })
    assert response.status_code == 409
    data = response.json()
    assert data["success"] is False
    assert "already exists" in data["message"]


def test_list_products(client):
    client.post("/api/v1/products", json={
        "name": "Product 1", "sku": "LIST-001", "price": 10.0, "quantity_in_stock": 5
    })
    client.post("/api/v1/products", json={
        "name": "Product 2", "sku": "LIST-002", "price": 20.0, "quantity_in_stock": 10
    })
    response = client.get("/api/v1/products")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) == 2


def test_get_product(client):
    create_resp = client.post("/api/v1/products", json={
        "name": "Single Product", "sku": "GET-001", "price": 15.0, "quantity_in_stock": 20
    })
    product_id = create_resp.json()["data"]["id"]
    response = client.get(f"/api/v1/products/{product_id}")
    assert response.status_code == 200
    assert response.json()["data"]["name"] == "Single Product"


def test_update_product(client):
    create_resp = client.post("/api/v1/products", json={
        "name": "Old Name", "sku": "UPD-001", "price": 10.0, "quantity_in_stock": 5
    })
    product_id = create_resp.json()["data"]["id"]
    response = client.put(f"/api/v1/products/{product_id}", json={"name": "New Name", "price": 25.0})
    assert response.status_code == 200
    assert response.json()["data"]["name"] == "New Name"
    assert response.json()["data"]["price"] == 25.0


def test_delete_product(client):
    create_resp = client.post("/api/v1/products", json={
        "name": "To Delete", "sku": "DEL-001", "price": 10.0, "quantity_in_stock": 5
    })
    product_id = create_resp.json()["data"]["id"]
    response = client.delete(f"/api/v1/products/{product_id}")
    assert response.status_code == 200
    assert response.json()["success"] is True
    # Verify deleted
    get_resp = client.get(f"/api/v1/products/{product_id}")
    assert get_resp.status_code == 404


def test_product_not_found(client):
    response = client.get("/api/v1/products/99999")
    assert response.status_code == 404
    assert response.json()["success"] is False


# ─── Customer Tests ──────────────────────────────────────────────────────────

def test_create_customer(client):
    response = client.post("/api/v1/customers", json={
        "full_name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["full_name"] == "John Doe"
    assert data["data"]["email"] == "john@example.com"


def test_duplicate_email(client):
    client.post("/api/v1/customers", json={
        "full_name": "Jane Doe", "email": "dup@example.com", "phone": "+1111111111"
    })
    response = client.post("/api/v1/customers", json={
        "full_name": "Jim Doe", "email": "dup@example.com", "phone": "+2222222222"
    })
    assert response.status_code == 409
    data = response.json()
    assert data["success"] is False
    assert "already exists" in data["message"]


def test_list_customers(client):
    client.post("/api/v1/customers", json={
        "full_name": "Customer 1", "email": "c1@example.com"
    })
    client.post("/api/v1/customers", json={
        "full_name": "Customer 2", "email": "c2@example.com"
    })
    response = client.get("/api/v1/customers")
    assert response.status_code == 200
    assert len(response.json()["data"]) == 2


# ─── Order Tests ─────────────────────────────────────────────────────────────

def _create_product_and_customer(client):
    """Helper to create a product and customer for order tests."""
    product_resp = client.post("/api/v1/products", json={
        "name": "Order Product", "sku": "ORD-001", "price": 50.0, "quantity_in_stock": 10
    })
    customer_resp = client.post("/api/v1/customers", json={
        "full_name": "Order Customer", "email": "order@example.com"
    })
    return product_resp.json()["data"]["id"], customer_resp.json()["data"]["id"]


def test_create_order(client):
    product_id, customer_id = _create_product_and_customer(client)
    response = client.post("/api/v1/orders", json={
        "customer_id": customer_id,
        "items": [{"product_id": product_id, "quantity": 2}]
    })
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["total_amount"] == 100.0
    assert len(data["data"]["items"]) == 1


def test_insufficient_stock(client):
    product_id, customer_id = _create_product_and_customer(client)
    response = client.post("/api/v1/orders", json={
        "customer_id": customer_id,
        "items": [{"product_id": product_id, "quantity": 999}]
    })
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert "Insufficient stock" in data["message"]


def test_stock_reduction(client):
    product_id, customer_id = _create_product_and_customer(client)
    # Initial stock = 10
    client.post("/api/v1/orders", json={
        "customer_id": customer_id,
        "items": [{"product_id": product_id, "quantity": 3}]
    })
    # Check product stock after order
    product_resp = client.get(f"/api/v1/products/{product_id}")
    assert product_resp.json()["data"]["quantity_in_stock"] == 7


def test_order_with_invalid_customer(client):
    product_resp = client.post("/api/v1/products", json={
        "name": "Product X", "sku": "ORD-X", "price": 10.0, "quantity_in_stock": 5
    })
    product_id = product_resp.json()["data"]["id"]
    response = client.post("/api/v1/orders", json={
        "customer_id": 99999,
        "items": [{"product_id": product_id, "quantity": 1}]
    })
    assert response.status_code == 404


def test_list_orders(client):
    product_id, customer_id = _create_product_and_customer(client)
    client.post("/api/v1/orders", json={
        "customer_id": customer_id,
        "items": [{"product_id": product_id, "quantity": 1}]
    })
    response = client.get("/api/v1/orders")
    assert response.status_code == 200
    assert len(response.json()["data"]) >= 1


# ─── Dashboard Tests ─────────────────────────────────────────────────────────

def test_dashboard_summary(client):
    # Create some test data
    client.post("/api/v1/products", json={
        "name": "Dashboard Product", "sku": "DASH-001", "price": 100.0, "quantity_in_stock": 3
    })
    client.post("/api/v1/customers", json={
        "full_name": "Dashboard Customer", "email": "dash@example.com"
    })
    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["total_products"] >= 1
    assert data["data"]["total_customers"] >= 1
    # Product with qty 3 should be in low stock (threshold is 5)
    assert len(data["data"]["low_stock_products"]) >= 1


# ─── Validation Tests ────────────────────────────────────────────────────────

def test_invalid_product_price(client):
    response = client.post("/api/v1/products", json={
        "name": "Bad Product", "sku": "BAD-001", "price": -5.0, "quantity_in_stock": 10
    })
    assert response.status_code == 422


def test_invalid_email(client):
    response = client.post("/api/v1/customers", json={
        "full_name": "Bad Email", "email": "not-an-email", "phone": "123"
    })
    assert response.status_code == 422


def test_empty_order_items(client):
    response = client.post("/api/v1/orders", json={
        "customer_id": 1,
        "items": []
    })
    assert response.status_code == 422
