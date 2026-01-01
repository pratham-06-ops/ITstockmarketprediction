from datetime import datetime
from bson import ObjectId
from typing import Optional, List, Dict, Any, Union

class User:
    def __init__(self, username: str, email: str, password_hash: str,
                 is_admin: bool = False, created_at: Optional[datetime] = None):
        self.id = None  # Will be set when retrieved from database
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.is_admin = is_admin
        self.created_at = created_at or datetime.utcnow()

    def to_dict(self):
        return {
            'username': self.username,
            'email': self.email,
            'password_hash': self.password_hash,
            'is_admin': self.is_admin,
            'created_at': self.created_at
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]):
        user = cls(
            username=data['username'],
            email=data['email'],
            password_hash=data['password_hash'],
            is_admin=data.get('is_admin', False),
            created_at=data.get('created_at', datetime.utcnow())
        )
        if '_id' in data:
            user.id = str(data['_id'])
        return user

class Prediction:
    def __init__(self, user_id: Union[str, ObjectId], stock_symbol: str, predicted_price: float,
                 model_used: str, confidence_score: Optional[float] = None,
                 actual_price: Optional[float] = None,
                 prediction_date: Optional[datetime] = None):
        self.user_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
        self.stock_symbol = stock_symbol
        self.predicted_price = predicted_price
        self.model_used = model_used
        self.confidence_score = confidence_score
        self.actual_price = actual_price
        self.prediction_date = prediction_date or datetime.utcnow()

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'stock_symbol': self.stock_symbol,
            'predicted_price': self.predicted_price,
            'model_used': self.model_used,
            'confidence_score': self.confidence_score,
            'actual_price': self.actual_price,
            'prediction_date': self.prediction_date
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]):
        prediction = cls(
            user_id=data['user_id'],
            stock_symbol=data['stock_symbol'],
            predicted_price=data['predicted_price'],
            model_used=data['model_used'],
            confidence_score=data.get('confidence_score'),
            actual_price=data.get('actual_price'),
            prediction_date=data.get('prediction_date', datetime.utcnow())
        )
        if '_id' in data:
            prediction.id = str(data['_id'])
        return prediction
