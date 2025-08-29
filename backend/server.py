from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import pymongo

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create indexes
async def create_indexes():
    try:
        await db.users.create_index("email", unique=True)
        await db.contacts.create_index([("company_id", 1), ("email", 1)])
        await db.leads.create_index([("status", 1), ("created_at", -1)])
        await db.deals.create_index([("pipeline_stage", 1), ("created_at", -1)])
        await db.activities.create_index([("contact_id", 1), ("created_at", -1)])
    except:
        pass

# Security
SECRET_KEY = "crm-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI(title="CRM API", version="1.0.0")
api_router = APIRouter(prefix="/api")

# Auth Models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "user"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    role: str = "user"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Token(BaseModel):
    access_token: str
    token_type: str

# Contact Models
class ContactCreate(BaseModel):
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class Contact(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Lead Models
class LeadCreate(BaseModel):
    contact_id: str
    source: str = "website"
    status: str = "new"
    score: int = 0
    notes: Optional[str] = None

class Lead(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    contact_id: str
    source: str = "website"
    status: str = "new"  # new, qualified, contacted, converted, lost
    score: int = 0
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Deal Models
class DealCreate(BaseModel):
    contact_id: str
    title: str
    value: float
    pipeline_stage: str = "prospecting"
    probability: int = 10
    notes: Optional[str] = None

class Deal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    contact_id: str
    title: str
    value: float
    pipeline_stage: str = "prospecting"  # prospecting, qualification, proposal, negotiation, closed_won, closed_lost
    probability: int = 10
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Activity Models
class ActivityCreate(BaseModel):
    contact_id: str
    type: str  # call, email, meeting, task, note
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    completed: bool = False

class Activity(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    contact_id: str
    type: str
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    completed: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Dashboard Models
class DashboardStats(BaseModel):
    total_contacts: int
    total_leads: int
    total_deals: int
    total_revenue: float
    conversion_rate: float
    recent_activities: List[Activity]

# Auth Functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"email": email})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

# Auth Routes
@api_router.post("/auth/register", response_model=User)
async def register(user: UserCreate):
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    user_dict = user.dict()
    del user_dict['password']
    user_obj = User(**user_dict)
    user_data = user_obj.dict()
    user_data['password'] = hashed_password
    
    await db.users.insert_one(user_data)
    return user_obj

@api_router.post("/auth/login", response_model=Token)
async def login(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user['password']):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Dashboard Route
@api_router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    total_contacts = await db.contacts.count_documents({})
    total_leads = await db.leads.count_documents({})
    total_deals = await db.deals.count_documents({})
    
    # Calculate total revenue (closed won deals)
    pipeline = [
        {"$match": {"pipeline_stage": "closed_won"}},
        {"$group": {"_id": None, "total": {"$sum": "$value"}}}
    ]
    revenue_result = await db.deals.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Calculate conversion rate
    converted_leads = await db.leads.count_documents({"status": "converted"})
    conversion_rate = (converted_leads / total_leads * 100) if total_leads > 0 else 0
    
    # Recent activities
    activities = await db.activities.find().sort("created_at", -1).limit(5).to_list(5)
    recent_activities = [Activity(**activity) for activity in activities]
    
    return DashboardStats(
        total_contacts=total_contacts,
        total_leads=total_leads,
        total_deals=total_deals,
        total_revenue=total_revenue,
        conversion_rate=conversion_rate,
        recent_activities=recent_activities
    )

# Contact Routes
@api_router.post("/contacts", response_model=Contact)
async def create_contact(contact: ContactCreate, current_user: User = Depends(get_current_user)):
    contact_obj = Contact(**contact.dict())
    await db.contacts.insert_one(contact_obj.dict())
    return contact_obj

@api_router.get("/contacts", response_model=List[Contact])
async def get_contacts(current_user: User = Depends(get_current_user)):
    contacts = await db.contacts.find().sort("created_at", -1).to_list(1000)
    return [Contact(**contact) for contact in contacts]

@api_router.get("/contacts/{contact_id}", response_model=Contact)
async def get_contact(contact_id: str, current_user: User = Depends(get_current_user)):
    contact = await db.contacts.find_one({"id": contact_id})
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return Contact(**contact)

@api_router.put("/contacts/{contact_id}", response_model=Contact)
async def update_contact(contact_id: str, contact_update: ContactCreate, current_user: User = Depends(get_current_user)):
    update_data = contact_update.dict()
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.contacts.update_one(
        {"id": contact_id}, 
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    updated_contact = await db.contacts.find_one({"id": contact_id})
    return Contact(**updated_contact)

@api_router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str, current_user: User = Depends(get_current_user)):
    result = await db.contacts.delete_one({"id": contact_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"message": "Contact deleted successfully"}

# Lead Routes
@api_router.post("/leads", response_model=Lead)
async def create_lead(lead: LeadCreate, current_user: User = Depends(get_current_user)):
    lead_obj = Lead(**lead.dict())
    await db.leads.insert_one(lead_obj.dict())
    return lead_obj

@api_router.get("/leads", response_model=List[Lead])
async def get_leads(current_user: User = Depends(get_current_user)):
    leads = await db.leads.find().sort("created_at", -1).to_list(1000)
    return [Lead(**lead) for lead in leads]

@api_router.put("/leads/{lead_id}", response_model=Lead)
async def update_lead(lead_id: str, lead_update: LeadCreate, current_user: User = Depends(get_current_user)):
    update_data = lead_update.dict()
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.leads.update_one({"id": lead_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    updated_lead = await db.leads.find_one({"id": lead_id})
    return Lead(**updated_lead)

# Deal Routes
@api_router.post("/deals", response_model=Deal)
async def create_deal(deal: DealCreate, current_user: User = Depends(get_current_user)):
    deal_obj = Deal(**deal.dict())
    await db.deals.insert_one(deal_obj.dict())
    return deal_obj

@api_router.get("/deals", response_model=List[Deal])
async def get_deals(current_user: User = Depends(get_current_user)):
    deals = await db.deals.find().sort("created_at", -1).to_list(1000)
    return [Deal(**deal) for deal in deals]

@api_router.put("/deals/{deal_id}", response_model=Deal)
async def update_deal(deal_id: str, deal_update: DealCreate, current_user: User = Depends(get_current_user)):
    update_data = deal_update.dict()
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.deals.update_one({"id": deal_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    updated_deal = await db.deals.find_one({"id": deal_id})
    return Deal(**updated_deal)

# Activity Routes
@api_router.post("/activities", response_model=Activity)
async def create_activity(activity: ActivityCreate, current_user: User = Depends(get_current_user)):
    activity_obj = Activity(**activity.dict())
    await db.activities.insert_one(activity_obj.dict())
    return activity_obj

@api_router.get("/activities", response_model=List[Activity])
async def get_activities(contact_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if contact_id:
        query["contact_id"] = contact_id
    
    activities = await db.activities.find(query).sort("created_at", -1).to_list(1000)
    return [Activity(**activity) for activity in activities]

@api_router.put("/activities/{activity_id}", response_model=Activity)
async def update_activity(activity_id: str, activity_update: ActivityCreate, current_user: User = Depends(get_current_user)):
    update_data = activity_update.dict()
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.activities.update_one({"id": activity_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    updated_activity = await db.activities.find_one({"id": activity_id})
    return Activity(**updated_activity)

@api_router.delete("/activities/{activity_id}")
async def delete_activity(activity_id: str, current_user: User = Depends(get_current_user)):
    result = await db.activities.delete_one({"id": activity_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Activity not found")
    return {"message": "Activity deleted successfully"}

@api_router.delete("/deals/{deal_id}")
async def delete_deal(deal_id: str, current_user: User = Depends(get_current_user)):
    result = await db.deals.delete_one({"id": deal_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Deal not found")
    return {"message": "Deal deleted successfully"}

@api_router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, current_user: User = Depends(get_current_user)):
    result = await db.leads.delete_one({"id": lead_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"message": "Lead deleted successfully"}

# Search Route
@api_router.get("/search")
async def search(q: str, type: str = "all", current_user: User = Depends(get_current_user)):
    results = {"contacts": [], "leads": [], "deals": []}
    
    if type in ["all", "contacts"]:
        contacts = await db.contacts.find({
            "$or": [
                {"first_name": {"$regex": q, "$options": "i"}},
                {"last_name": {"$regex": q, "$options": "i"}},
                {"email": {"$regex": q, "$options": "i"}},
                {"company": {"$regex": q, "$options": "i"}}
            ]
        }).limit(10).to_list(10)
        results["contacts"] = [Contact(**contact) for contact in contacts]
    
    if type in ["all", "leads"]:
        leads = await db.leads.find({
            "$or": [
                {"source": {"$regex": q, "$options": "i"}},
                {"status": {"$regex": q, "$options": "i"}},
                {"notes": {"$regex": q, "$options": "i"}}
            ]
        }).limit(10).to_list(10)
        results["leads"] = [Lead(**lead) for lead in leads]
    
    if type in ["all", "deals"]:
        deals = await db.deals.find({
            "$or": [
                {"title": {"$regex": q, "$options": "i"}},
                {"pipeline_stage": {"$regex": q, "$options": "i"}},
                {"notes": {"$regex": q, "$options": "i"}}
            ]
        }).limit(10).to_list(10)
        results["deals"] = [Deal(**deal) for deal in deals]
    
    return results

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc)}

# Include the router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db_client():
    await create_indexes()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()