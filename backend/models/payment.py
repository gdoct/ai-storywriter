from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class MockPurchaseRequest(BaseModel):
    packageId: str
    credits: int
    amount: float
    simulateFailure: Optional[bool] = False
    paymentMethod: Optional[str] = "card"

class PaymentError(BaseModel):
    code: str
    message: str
    retryable: bool

class Transaction(BaseModel):
    id: str
    user_id: str
    package_id: str
    credits: int
    amount: float
    payment_method: str
    timestamp: str
    status: str

class MockPurchaseResponse(BaseModel):
    success: bool
    transaction: Optional[Transaction] = None
    newBalance: Optional[int] = None
    error: Optional[PaymentError] = None

class CreditPackage(BaseModel):
    id: str
    name: str
    credits: int
    price: float
    features: List[str]
    isPopular: Optional[bool] = False
    isBestValue: Optional[bool] = False

class CreditPackagesResponse(BaseModel):
    packages: List[CreditPackage]

class UserProfile(BaseModel):
    username: str
    email: str
    tier: str
    credits: int
    created_at: str
    last_active: str

class AddCreditsRequest(BaseModel):
    credits: int

class AddCreditsResponse(BaseModel):
    success: bool
    newBalance: int

class UpgradeUserRequest(BaseModel):
    email: str

class UpgradeUserResponse(BaseModel):
    success: bool
    message: str

class ErrorResponse(BaseModel):
    error: str