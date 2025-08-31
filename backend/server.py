from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Supabase connection
supabase_url = os.environ['SUPABASE_URL']
supabase_service_key = os.environ['SUPABASE_SERVICE_KEY']
supabase_anon_key = os.environ['SUPABASE_ANON_KEY']

# Create two clients: one for auth (anon) and one for admin operations (service)
supabase_auth: Client = create_client(supabase_url, supabase_anon_key)  # For authentication
supabase: Client = create_client(supabase_url, supabase_service_key)    # For database operations

# Security
SECRET_KEY = "crm-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI(title="CRM API with Supabase", version="1.0.0")
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

# Ticket Models
class TicketCreate(BaseModel):
    title: str
    description: str
    category: str = "technical"
    priority: str = "medium"
    contact_id: Optional[str] = None
    assigned_to: Optional[str] = None

class Ticket(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    category: str = "technical"
    priority: str = "medium"
    status: str = "open"
    contact_id: Optional[str] = None
    assigned_to: Optional[str] = None
    resolved_at: Optional[datetime] = None
    satisfaction_rating: Optional[int] = None
    tags: Optional[List[str]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TicketCommentCreate(BaseModel):
    ticket_id: str
    content: str
    type: str = "internal"

class TicketComment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ticket_id: str
    author_id: str
    content: str
    type: str = "internal"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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

# Role-based permission system
def check_permission(required_role: str, user_role: str) -> bool:
    """Check if user has required permission"""
    role_hierarchy = {
        "viewer": 1,
        "user": 2, 
        "manager": 3,
        "admin": 4
    }
    
    required_level = role_hierarchy.get(required_role, 0)
    user_level = role_hierarchy.get(user_role, 0)
    
    return user_level >= required_level

def require_role(required_role: str):
    """Decorator to require specific role"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Get current_user from kwargs
            current_user = kwargs.get('current_user')
            if not current_user:
                raise HTTPException(status_code=403, detail="Authentication required")
            
            if not check_permission(required_role, current_user.role):
                raise HTTPException(
                    status_code=403, 
                    detail=f"Insufficient permissions. Required: {required_role}, Current: {current_user.role}"
                )
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    try:
        result = supabase.table('profiles').select("*").eq('email', email).execute()
        if not result.data:
            raise HTTPException(status_code=401, detail="User not found")
        user_data = result.data[0]
        return User(**user_data)
    except Exception as e:
        raise HTTPException(status_code=401, detail="User not found")

# Auth Routes
@api_router.post("/auth/register", response_model=User)
async def register(user: UserCreate):
    try:
        # Create user in Supabase Auth using anon client
        auth_response = supabase_auth.auth.sign_up({
            "email": user.email,
            "password": user.password
        })
        
        if auth_response.user is None:
            raise HTTPException(status_code=400, detail="Registration failed")
        
        user_id = auth_response.user.id
        
        # Create profile in profiles table using service client
        profile_data = {
            "id": user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        result = supabase.table('profiles').insert(profile_data).execute()
        
        return User(
            id=user_id,
            name=user.name,
            email=user.email,
            role=user.role,
            created_at=datetime.now(timezone.utc)
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")

@api_router.post("/auth/login", response_model=Token)
async def login(user: UserLogin):
    try:
        # Authenticate with Supabase Auth using anon client
        auth_response = supabase_auth.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password
        })
        
        if auth_response.user is None:
            raise HTTPException(status_code=400, detail="Invalid credentials")
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid credentials")

# Dashboard Route
@api_router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    try:
        # Get counts
        contacts_result = supabase.table('contacts').select("id", count="exact").execute()
        leads_result = supabase.table('leads').select("id", count="exact").execute()
        deals_result = supabase.table('deals').select("id", count="exact").execute()
        
        total_contacts = contacts_result.count or 0
        total_leads = leads_result.count or 0
        total_deals = deals_result.count or 0
        
        # Calculate total revenue (closed won deals)
        won_deals = supabase.table('deals').select("value").eq('pipeline_stage', 'closed_won').execute()
        total_revenue = sum(deal['value'] for deal in won_deals.data) if won_deals.data else 0
        
        # Calculate conversion rate
        converted_leads = supabase.table('leads').select("id", count="exact").eq('status', 'converted').execute()
        conversion_rate = (converted_leads.count / total_leads * 100) if total_leads > 0 else 0
        
        # Recent activities
        activities_result = supabase.table('activities').select("*").order('created_at', desc=True).limit(5).execute()
        recent_activities = [Activity(**activity) for activity in activities_result.data] if activities_result.data else []
        
        return DashboardStats(
            total_contacts=total_contacts,
            total_leads=total_leads,
            total_deals=total_deals,
            total_revenue=total_revenue,
            conversion_rate=conversion_rate,
            recent_activities=recent_activities
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard stats: {str(e)}")

# Contact Routes
@api_router.post("/contacts", response_model=Contact)
async def create_contact(contact: ContactCreate, current_user: User = Depends(get_current_user)):
    try:
        contact_data = contact.dict()
        contact_data['id'] = str(uuid.uuid4())
        contact_data['created_by'] = current_user.id
        contact_data['created_at'] = datetime.now(timezone.utc).isoformat()
        contact_data['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        result = supabase.table('contacts').insert(contact_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=400, detail="Failed to create contact")
            
        return Contact(**result.data[0])
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating contact: {str(e)}")

@api_router.get("/contacts", response_model=List[Contact])
async def get_contacts(current_user: User = Depends(get_current_user)):
    try:
        result = supabase.table('contacts').select("*").order('created_at', desc=True).execute()
        return [Contact(**contact) for contact in result.data] if result.data else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching contacts: {str(e)}")

@api_router.get("/contacts/{contact_id}", response_model=Contact)
async def get_contact(contact_id: str, current_user: User = Depends(get_current_user)):
    try:
        result = supabase.table('contacts').select("*").eq('id', contact_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Contact not found")
            
        return Contact(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching contact: {str(e)}")

@api_router.put("/contacts/{contact_id}", response_model=Contact)
async def update_contact(contact_id: str, contact_update: ContactCreate, current_user: User = Depends(get_current_user)):
    try:
        update_data = contact_update.dict()
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        result = supabase.table('contacts').update(update_data).eq('id', contact_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Contact not found")
            
        return Contact(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating contact: {str(e)}")

@api_router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str, current_user: User = Depends(get_current_user)):
    # Check permissions: only managers and admins can delete
    if not check_permission("manager", current_user.role):
        raise HTTPException(
            status_code=403, 
            detail="Insufficient permissions. Only managers and admins can delete contacts."
        )
    
    try:
        result = supabase.table('contacts').delete().eq('id', contact_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Contact not found")
            
        return {"message": "Contact deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting contact: {str(e)}")

# Lead Routes
@api_router.post("/leads", response_model=Lead)
async def create_lead(lead: LeadCreate, current_user: User = Depends(get_current_user)):
    try:
        lead_data = lead.dict()
        lead_data['id'] = str(uuid.uuid4())
        lead_data['created_by'] = current_user.id
        lead_data['created_at'] = datetime.now(timezone.utc).isoformat()
        lead_data['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        result = supabase.table('leads').insert(lead_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=400, detail="Failed to create lead")
            
        return Lead(**result.data[0])
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating lead: {str(e)}")

@api_router.get("/leads", response_model=List[Lead])
async def get_leads(current_user: User = Depends(get_current_user)):
    try:
        result = supabase.table('leads').select("*").order('created_at', desc=True).execute()
        return [Lead(**lead) for lead in result.data] if result.data else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching leads: {str(e)}")

@api_router.put("/leads/{lead_id}", response_model=Lead)
async def update_lead(lead_id: str, lead_update: LeadCreate, current_user: User = Depends(get_current_user)):
    try:
        update_data = lead_update.dict()
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        result = supabase.table('leads').update(update_data).eq('id', lead_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Lead not found")
            
        return Lead(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating lead: {str(e)}")

@api_router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, current_user: User = Depends(get_current_user)):
    # Check permissions: only managers and admins can delete
    if not check_permission("manager", current_user.role):
        raise HTTPException(
            status_code=403, 
            detail="Insufficient permissions. Only managers and admins can delete leads."
        )
    
    try:
        result = supabase.table('leads').delete().eq('id', lead_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Lead not found")
            
        return {"message": "Lead deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting lead: {str(e)}")

@api_router.delete("/deals/{deal_id}")
async def delete_deal(deal_id: str, current_user: User = Depends(get_current_user)):
    # Check permissions: only managers and admins can delete
    if not check_permission("manager", current_user.role):
        raise HTTPException(
            status_code=403, 
            detail="Insufficient permissions. Only managers and admins can delete deals."
        )
    
    try:
        result = supabase.table('deals').delete().eq('id', deal_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Deal not found")
            
        return {"message": "Deal deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting deal: {str(e)}")

# Deal Routes
@api_router.post("/deals", response_model=Deal)
async def create_deal(deal: DealCreate, current_user: User = Depends(get_current_user)):
    try:
        deal_data = deal.dict()
        deal_data['id'] = str(uuid.uuid4())
        deal_data['created_by'] = current_user.id
        deal_data['created_at'] = datetime.now(timezone.utc).isoformat()
        deal_data['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        result = supabase.table('deals').insert(deal_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=400, detail="Failed to create deal")
            
        return Deal(**result.data[0])
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating deal: {str(e)}")

@api_router.get("/deals", response_model=List[Deal])
async def get_deals(current_user: User = Depends(get_current_user)):
    try:
        result = supabase.table('deals').select("*").order('created_at', desc=True).execute()
        return [Deal(**deal) for deal in result.data] if result.data else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching deals: {str(e)}")

@api_router.put("/deals/{deal_id}", response_model=Deal)
async def update_deal(deal_id: str, deal_update: DealCreate, current_user: User = Depends(get_current_user)):
    try:
        update_data = deal_update.dict()
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        result = supabase.table('deals').update(update_data).eq('id', deal_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Deal not found")
            
        return Deal(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating deal: {str(e)}")

@api_router.delete("/deals/{deal_id}")
async def delete_deal(deal_id: str, current_user: User = Depends(get_current_user)):
    try:
        result = supabase.table('deals').delete().eq('id', deal_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Deal not found")
            
        return {"message": "Deal deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting deal: {str(e)}")

# Activity Routes
@api_router.post("/activities", response_model=Activity)
async def create_activity(activity: ActivityCreate, current_user: User = Depends(get_current_user)):
    try:
        activity_data = activity.dict()
        activity_data['id'] = str(uuid.uuid4())
        activity_data['created_by'] = current_user.id
        activity_data['created_at'] = datetime.now(timezone.utc).isoformat()
        
        # Handle due_date conversion
        if activity_data.get('due_date'):
            activity_data['due_date'] = activity_data['due_date'].isoformat()
        
        result = supabase.table('activities').insert(activity_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=400, detail="Failed to create activity")
            
        return Activity(**result.data[0])
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating activity: {str(e)}")

@api_router.get("/activities", response_model=List[Activity])
async def get_activities(contact_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    try:
        query = supabase.table('activities').select("*")
        
        if contact_id:
            query = query.eq('contact_id', contact_id)
            
        result = query.order('created_at', desc=True).execute()
        return [Activity(**activity) for activity in result.data] if result.data else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching activities: {str(e)}")

@api_router.put("/activities/{activity_id}", response_model=Activity)
async def update_activity(activity_id: str, activity_update: ActivityCreate, current_user: User = Depends(get_current_user)):
    try:
        update_data = activity_update.dict()
        
        # Handle due_date conversion
        if update_data.get('due_date'):
            update_data['due_date'] = update_data['due_date'].isoformat()
        
        result = supabase.table('activities').update(update_data).eq('id', activity_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Activity not found")
            
        return Activity(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating activity: {str(e)}")

@api_router.delete("/activities/{activity_id}")
async def delete_activity(activity_id: str, current_user: User = Depends(get_current_user)):
    try:
        result = supabase.table('activities').delete().eq('id', activity_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Activity not found")
            
        return {"message": "Activity deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting activity: {str(e)}")

# Search Route
@api_router.get("/search")
async def search(q: str, type: str = "all", current_user: User = Depends(get_current_user)):
    try:
        results = {"contacts": [], "leads": [], "deals": []}
        
        if type in ["all", "contacts"]:
            contacts_result = supabase.table('contacts').select("*").or_(f'first_name.ilike.%{q}%,last_name.ilike.%{q}%,email.ilike.%{q}%,company.ilike.%{q}%').limit(10).execute()
            results["contacts"] = [Contact(**contact) for contact in contacts_result.data] if contacts_result.data else []
        
        if type in ["all", "leads"]:
            leads_result = supabase.table('leads').select("*").or_(f'source.ilike.%{q}%,status.ilike.%{q}%,notes.ilike.%{q}%').limit(10).execute()
            results["leads"] = [Lead(**lead) for lead in leads_result.data] if leads_result.data else []
        
        if type in ["all", "deals"]:
            deals_result = supabase.table('deals').select("*").or_(f'title.ilike.%{q}%,pipeline_stage.ilike.%{q}%,notes.ilike.%{q}%').limit(10).execute()
            results["deals"] = [Deal(**deal) for deal in deals_result.data] if deals_result.data else []
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching: {str(e)}")

# Ticket Routes
@api_router.post("/tickets", response_model=Ticket)
async def create_ticket(ticket: TicketCreate, current_user: User = Depends(get_current_user)):
    try:
        ticket_data = ticket.dict()
        ticket_data['id'] = str(uuid.uuid4())
        ticket_data['created_by'] = current_user.id
        ticket_data['created_at'] = datetime.now(timezone.utc).isoformat()
        ticket_data['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        result = supabase.table('tickets').insert(ticket_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=400, detail="Failed to create ticket")
            
        return Ticket(**result.data[0])
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating ticket: {str(e)}")

@api_router.get("/tickets", response_model=List[Ticket])
async def get_tickets(current_user: User = Depends(get_current_user)):
    try:
        result = supabase.table('tickets').select("*").order('created_at', desc=True).execute()
        return [Ticket(**ticket) for ticket in result.data] if result.data else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tickets: {str(e)}")

@api_router.get("/tickets/{ticket_id}", response_model=Ticket)
async def get_ticket(ticket_id: str, current_user: User = Depends(get_current_user)):
    try:
        result = supabase.table('tickets').select("*").eq('id', ticket_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Ticket not found")
            
        return Ticket(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching ticket: {str(e)}")

@api_router.put("/tickets/{ticket_id}", response_model=Ticket)
async def update_ticket(ticket_id: str, ticket_update: TicketCreate, current_user: User = Depends(get_current_user)):
    try:
        update_data = ticket_update.dict()
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        result = supabase.table('tickets').update(update_data).eq('id', ticket_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Ticket not found")
            
        return Ticket(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating ticket: {str(e)}")

@api_router.delete("/tickets/{ticket_id}")
async def delete_ticket(ticket_id: str, current_user: User = Depends(get_current_user)):
    # Check permissions: only managers and admins can delete tickets
    if not check_permission("manager", current_user.role):
        raise HTTPException(
            status_code=403, 
            detail="Insufficient permissions. Only managers and admins can delete tickets."
        )
    
    try:
        result = supabase.table('tickets').delete().eq('id', ticket_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Ticket not found")
            
        return {"message": "Ticket deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting ticket: {str(e)}")

# Ticket Comments Routes
@api_router.post("/tickets/{ticket_id}/comments", response_model=TicketComment)
async def create_ticket_comment(ticket_id: str, comment: TicketCommentCreate, current_user: User = Depends(get_current_user)):
    try:
        comment_data = {
            "id": str(uuid.uuid4()),
            "ticket_id": ticket_id,
            "author_id": current_user.id,
            "content": comment.content,
            "type": comment.type,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        result = supabase.table('ticket_comments').insert(comment_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=400, detail="Failed to create comment")
            
        return TicketComment(**result.data[0])
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating comment: {str(e)}")

@api_router.get("/tickets/{ticket_id}/comments", response_model=List[TicketComment])
async def get_ticket_comments(ticket_id: str, current_user: User = Depends(get_current_user)):
    try:
        result = supabase.table('ticket_comments').select("*").eq('ticket_id', ticket_id).order('created_at', desc=True).execute()
        return [TicketComment(**comment) for comment in result.data] if result.data else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching comments: {str(e)}")

# Health check
@api_router.get("/health")
async def health_check():
    try:
        # Test Supabase connection
        result = supabase.table('profiles').select("id").limit(1).execute()
        return {"status": "healthy", "timestamp": datetime.now(timezone.utc), "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "timestamp": datetime.now(timezone.utc), "database": "disconnected", "error": str(e)}

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)