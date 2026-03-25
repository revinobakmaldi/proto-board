from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None


class LayoutCreate(BaseModel):
    name: str = "Untitled"


class LayoutUpdate(BaseModel):
    name: Optional[str] = None
    components: Optional[list] = None


class LayoutOut(BaseModel):
    id: int
    user_id: int
    name: str
    components: list
    created_at: datetime
    updated_at: datetime
