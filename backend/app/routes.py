from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from .database import get_db, User, Layout
from .schemas import UserCreate, UserOut, Token, LayoutCreate, LayoutUpdate, LayoutOut
from .auth import verify_password, get_password_hash, create_access_token, get_current_user, ACCESS_TOKEN_EXPIRE_HOURS

router = APIRouter(prefix="/api")


@router.post("/auth/register", response_model=UserOut)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == payload.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    user = User(username=payload.username, hashed_password=get_password_hash(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/auth/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    access_token = create_access_token(data={"sub": user.username}, expires_delta=timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/auth/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


# Layouts
@router.get("/layouts", response_model=list[LayoutOut])
def list_layouts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Layout).filter(Layout.user_id == current_user.id).order_by(Layout.updated_at.desc()).all()


@router.post("/layouts", response_model=LayoutOut)
def create_layout(payload: LayoutCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    layout = Layout(user_id=current_user.id, name=payload.name, components=[])
    db.add(layout)
    db.commit()
    db.refresh(layout)
    return layout


@router.get("/layouts/{layout_id}", response_model=LayoutOut)
def get_layout(layout_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    layout = db.query(Layout).filter(Layout.id == layout_id, Layout.user_id == current_user.id).first()
    if not layout:
        raise HTTPException(status_code=404, detail="Layout not found")
    return layout


@router.put("/layouts/{layout_id}", response_model=LayoutOut)
def update_layout(layout_id: int, payload: LayoutUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    layout = db.query(Layout).filter(Layout.id == layout_id, Layout.user_id == current_user.id).first()
    if not layout:
        raise HTTPException(status_code=404, detail="Layout not found")
    if payload.name is not None:
        layout.name = payload.name
    if payload.components is not None:
        layout.components = payload.components
    db.commit()
    db.refresh(layout)
    return layout


@router.delete("/layouts/{layout_id}")
def delete_layout(layout_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    layout = db.query(Layout).filter(Layout.id == layout_id, Layout.user_id == current_user.id).first()
    if not layout:
        raise HTTPException(status_code=404, detail="Layout not found")
    db.delete(layout)
    db.commit()
    return {"ok": True}
