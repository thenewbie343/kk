from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import uuid
from datetime import datetime
import smtplib
import csv
import io
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi.responses import StreamingResponse

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class MenuItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    category: str  # "bakery" or "cafe"
    image: str
    ingredients: Optional[List[str]] = []
    available: bool = True

class CartItem(BaseModel):
    id: str
    name: str
    price: float
    quantity: int
    category: str

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str
    customer_email: str
    customer_phone: str
    items: List[CartItem]
    total_amount: float
    pickup_time: str
    special_requests: Optional[str] = ""
    order_date: datetime = Field(default_factory=datetime.utcnow)
    status: str = "pending"

class OrderCreate(BaseModel):
    customer_name: str
    customer_email: str
    customer_phone: str
    items: List[CartItem]
    total_amount: float
    pickup_time: str
    special_requests: Optional[str] = ""

# Sample menu items
SAMPLE_MENU_ITEMS = [
    # Bakery Items
    {
        "name": "Artisan Croissants",
        "description": "Buttery, flaky croissants baked fresh daily with French butter",
        "price": 3.50,
        "category": "bakery",
        "image": "https://images.unsplash.com/photo-1555507036-ab1f4038808a",
        "ingredients": ["French flour", "Butter", "Yeast", "Milk"],
        "available": True
    },
    {
        "name": "Pain au Chocolat",
        "description": "Classic French pastry with rich dark chocolate",
        "price": 4.25,
        "category": "bakery",
        "image": "https://images.unsplash.com/photo-1483695028939-5bb13f8648b0",
        "ingredients": ["Pastry dough", "Dark chocolate", "Butter"],
        "available": True
    },
    {
        "name": "Artisan Sourdough Bread",
        "description": "Traditional sourdough with a perfect crust and tangy flavor",
        "price": 6.50,
        "category": "bakery",
        "image": "https://images.unsplash.com/photo-1534432182912-63863115e106",
        "ingredients": ["Sourdough starter", "Organic flour", "Sea salt"],
        "available": True
    },
    {
        "name": "French Macarons",
        "description": "Delicate almond cookies with smooth ganache filling",
        "price": 2.75,
        "category": "bakery",
        "image": "https://images.unsplash.com/photo-1556742059-47b93231f536",
        "ingredients": ["Almond flour", "Sugar", "Egg whites", "Various flavors"],
        "available": True
    },
    {
        "name": "Cinnamon Danish",
        "description": "Flaky pastry swirled with cinnamon sugar and glaze",
        "price": 4.00,
        "category": "bakery",
        "image": "https://images.unsplash.com/photo-1534432182912-63863115e106",
        "ingredients": ["Danish dough", "Cinnamon", "Sugar", "Glaze"],
        "available": True
    },
    {
        "name": "Chocolate Eclair",
        "description": "Choux pastry filled with vanilla cream, topped with chocolate",
        "price": 4.75,
        "category": "bakery",
        "image": "https://images.unsplash.com/photo-1483695028939-5bb13f8648b0",
        "ingredients": ["Choux pastry", "Vanilla cream", "Chocolate glaze"],
        "available": True
    },
    # Café Items
    {
        "name": "Signature Latte",
        "description": "Expertly crafted with our house blend and steamed milk",
        "price": 4.50,
        "category": "cafe",
        "image": "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
        "ingredients": ["Espresso", "Steamed milk", "Latte art"],
        "available": True
    },
    {
        "name": "Cappuccino",
        "description": "Rich espresso topped with velvety microfoam",
        "price": 4.25,
        "category": "cafe",
        "image": "https://images.unsplash.com/photo-1506619216599-9d16d0903dfd",
        "ingredients": ["Double espresso", "Steamed milk", "Microfoam"],
        "available": True
    },
    {
        "name": "Cold Brew Coffee",
        "description": "Smooth, refreshing cold brew steeped for 24 hours",
        "price": 3.75,
        "category": "cafe",
        "image": "https://images.unsplash.com/photo-1447933601403-0c6688de566e",
        "ingredients": ["Cold brew concentrate", "Ice", "Optional milk"],
        "available": True
    },
    {
        "name": "Caramel Macchiato",
        "description": "Vanilla syrup, steamed milk, espresso, and caramel drizzle",
        "price": 5.25,
        "category": "cafe",
        "image": "https://images.unsplash.com/photo-1518057111178-44a106bad636",
        "ingredients": ["Espresso", "Vanilla syrup", "Steamed milk", "Caramel"],
        "available": True
    },
    {
        "name": "Green Tea Latte",
        "description": "Premium matcha powder with steamed milk and honey",
        "price": 4.75,
        "category": "cafe",
        "image": "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
        "ingredients": ["Matcha powder", "Steamed milk", "Honey"],
        "available": True
    },
    {
        "name": "Hot Chocolate",
        "description": "Rich Belgian chocolate with whipped cream and marshmallows",
        "price": 4.00,
        "category": "cafe",
        "image": "https://images.unsplash.com/photo-1506619216599-9d16d0903dfd",
        "ingredients": ["Belgian chocolate", "Steamed milk", "Whipped cream"],
        "available": True
    },
    # Café Savory Items
    {
        "name": "Spiced Meat Patty Burger",
        "description": "Juicy beef patty seasoned with our secret spice blend, served on fresh brioche",
        "price": 8.99,
        "category": "cafe",
        "image": "https://images.unsplash.com/photo-1518057111178-44a106bad636",
        "ingredients": ["Beef patty", "Brioche bun", "Secret spices", "Fresh lettuce"],
        "available": True
    },
    {
        "name": "Garden Veggie Patty",
        "description": "House-made quinoa and black bean patty with avocado and fresh herbs",
        "price": 7.99,
        "category": "cafe",
        "image": "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
        "ingredients": ["Quinoa", "Black beans", "Avocado", "Fresh herbs"],
        "available": True
    },
    {
        "name": "Grilled Chicken Sandwich",
        "description": "Tender grilled chicken breast with pesto and sundried tomatoes",
        "price": 9.50,
        "category": "cafe",
        "image": "https://images.unsplash.com/photo-1447933601403-0c6688de566e",
        "ingredients": ["Chicken breast", "Pesto sauce", "Sundried tomatoes", "Ciabatta"],
        "available": True
    },
    {
        "name": "Fresh Breakfast Wrap",
        "description": "Scrambled eggs, crispy bacon, and cheese wrapped in a warm tortilla",
        "price": 6.75,
        "category": "cafe",
        "image": "https://images.unsplash.com/photo-1518057111178-44a106bad636",
        "ingredients": ["Eggs", "Bacon", "Cheese", "Tortilla wrap"],
        "available": True
    }
]

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Welcome to Artisan Bakery & Café API"}

@api_router.get("/menu", response_model=List[MenuItem])
async def get_menu():
    """Get all menu items"""
    # Check if menu items exist, if not create them
    count = await db.menu_items.count_documents({})
    if count == 0:
        # Insert sample menu items
        menu_items = [MenuItem(**item) for item in SAMPLE_MENU_ITEMS]
        await db.menu_items.insert_many([item.dict() for item in menu_items])
    
    items = await db.menu_items.find().to_list(1000)
    return [MenuItem(**item) for item in items]

@api_router.get("/menu/{category}", response_model=List[MenuItem])
async def get_menu_by_category(category: str):
    """Get menu items by category (bakery or cafe)"""
    # Ensure menu items exist
    count = await db.menu_items.count_documents({})
    if count == 0:
        menu_items = [MenuItem(**item) for item in SAMPLE_MENU_ITEMS]
        await db.menu_items.insert_many([item.dict() for item in menu_items])
    
    items = await db.menu_items.find({"category": category}).to_list(1000)
    return [MenuItem(**item) for item in items]

@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate):
    """Create a new order"""
    order = Order(**order_data.dict())
    await db.orders.insert_one(order.dict())
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_orders():
    """Get all orders"""
    orders = await db.orders.find().sort("order_date", -1).to_list(1000)
    return [Order(**order) for order in orders]

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    """Get specific order by ID"""
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return Order(**order)

@api_router.get("/analytics")
async def get_analytics():
    """Get basic analytics"""
    total_orders = await db.orders.count_documents({})
    
    # Get popular items
    pipeline = [
        {"$unwind": "$items"},
        {"$group": {"_id": "$items.name", "count": {"$sum": "$items.quantity"}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    popular_items = await db.orders.aggregate(pipeline).to_list(5)
    
    # Calculate revenue
    revenue_pipeline = [
        {"$group": {"_id": None, "total_revenue": {"$sum": "$total_amount"}}}
    ]
    revenue_result = await db.orders.aggregate(revenue_pipeline).to_list(1)
    total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0
    
    return {
        "total_orders": total_orders,
        "popular_items": popular_items,
        "total_revenue": total_revenue
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()