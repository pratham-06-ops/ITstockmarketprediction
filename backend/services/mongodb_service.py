from datetime import datetime
from typing import List, Optional, Dict, Any
from bson import ObjectId
from database import mongodb
from models.mongodb_models import User, Prediction
from config import Config
import logging


def serialize_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB document to JSON-safe dict"""
    if not doc:
        return doc

    # Convert root _id
    if "_id" in doc:
        doc["id"] = str(doc["_id"])
        doc.pop("_id", None)

    # Convert other fields
    for k, v in list(doc.items()):
        if isinstance(v, ObjectId):
            doc[k] = str(v)
        elif isinstance(v, datetime):
            doc[k] = v.isoformat()
        elif isinstance(v, dict):
            doc[k] = serialize_doc(v)
        elif isinstance(v, list):
            doc[k] = [serialize_doc(i) if isinstance(i, dict) else i for i in v]

    return doc


class MongoDBService:
    def __init__(self):
        self.users_collection = mongodb.get_collection(Config.USERS_COLLECTION)
        self.predictions_collection = mongodb.get_collection(Config.PREDICTIONS_COLLECTION)
        self._create_indexes()

    def _create_indexes(self):
        """Create database indexes for better performance"""
        try:
            self.users_collection.create_index("username", unique=True)
            self.users_collection.create_index("email", unique=True)
            self.predictions_collection.create_index("user_id")
            self.predictions_collection.create_index("stock_symbol")
            self.predictions_collection.create_index("prediction_date")
            self.predictions_collection.create_index([("user_id", 1), ("prediction_date", -1)])
            logging.info("Database indexes created successfully")
        except Exception as e:
            logging.error(f"Error creating indexes: {e}")

    # ---------------- User operations ----------------
    def create_user(self, user: User) -> str:
        try:
            result = self.users_collection.insert_one(user.to_dict())
            return str(result.inserted_id)
        except Exception as e:
            logging.error(f"Error creating user: {e}")
            raise e

    def get_user_by_username(self, username: str) -> Optional[User]:
        try:
            user_data = self.users_collection.find_one({"username": username})
            return User.from_dict(user_data) if user_data else None
        except Exception as e:
            logging.error(f"Error getting user by username: {e}")
            raise e

    def get_user_by_email(self, email: str) -> Optional[User]:
        try:
            user_data = self.users_collection.find_one({"email": email})
            return User.from_dict(user_data) if user_data else None
        except Exception as e:
            logging.error(f"Error getting user by email: {e}")
            raise e

    def get_user_by_id(self, user_id: str) -> Optional[User]:
        try:
            user_data = self.users_collection.find_one({"_id": ObjectId(user_id)})
            return User.from_dict(user_data) if user_data else None
        except Exception as e:
            logging.error(f"Error getting user by ID: {e}")
            raise e

    def update_user_password(self, user_id: str, new_password_hash: str) -> bool:
        try:
            result = self.users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"password_hash": new_password_hash}}
            )
            return result.modified_count > 0
        except Exception as e:
            logging.error(f"Error updating user password: {e}")
            raise e

    def get_all_users(self) -> List[Dict[str, Any]]:
        try:
            pipeline = [
                {
                    "$lookup": {
                        "from": "predictions",
                        "localField": "_id",
                        "foreignField": "user_id",
                        "as": "predictions"
                    }
                },
                {
                    "$addFields": {
                        "prediction_count": {"$size": "$predictions"}
                    }
                },
                {
                    "$project": {
                        "predictions": 0,
                        "password_hash": 0
                    }
                }
            ]
            users = list(self.users_collection.aggregate(pipeline))
            return [serialize_doc(u) for u in users]
        except Exception as e:
            logging.error(f"Error getting all users: {e}")
            raise e

    def delete_user(self, user_id: str) -> bool:
        """Delete a user by ID"""
        try:
            result = self.users_collection.delete_one({"_id": ObjectId(user_id)})
            return result.deleted_count > 0
        except Exception as e:
            logging.error(f"Error deleting user: {e}")
            return False

    # ---------------- Prediction operations ----------------
    def create_prediction(self, prediction: Prediction) -> str:
        try:
            result = self.predictions_collection.insert_one(prediction.to_dict())
            return str(result.inserted_id)
        except Exception as e:
            logging.error(f"Error creating prediction: {e}")
            raise e

    def get_user_predictions(self, user_id: str) -> List[Dict[str, Any]]:
        try:
            predictions = list(self.predictions_collection.find(
                {"user_id": ObjectId(user_id)}
            ).sort("prediction_date", -1))
            return [serialize_doc(p) for p in predictions]
        except Exception as e:
            logging.error(f"Error getting user predictions: {e}")
            raise e

    def get_all_predictions(self) -> List[Dict[str, Any]]:
        try:
            pipeline = [
                {
                    "$lookup": {
                        "from": "users",
                        "let": {"user_id": "$user_id"},
                        "pipeline": [
                            {"$match": {"$expr": {"$eq": ["$_id", {"$toObjectId": "$$user_id"}]}}}
                        ],
                        "as": "user"
                    }
                },
                {"$unwind": "$user"},
                {
                    "$project": {
                        "_id": 1,
                        "user_id": 1,
                        "username": "$user.username",
                        "stock_symbol": 1,
                        "predicted_price": 1,
                        "actual_price": 1,
                        "prediction_date": 1,
                        "model_used": 1,
                        "confidence_score": 1
                    }
                },
                {"$sort": {"prediction_date": -1}}
            ]
            predictions = list(self.predictions_collection.aggregate(pipeline))
            return [serialize_doc(p) for p in predictions]
        except Exception as e:
            logging.error(f"Error getting all predictions: {e}")
            raise e

    def update_prediction(self, prediction_id: str, updates: Dict[str, Any]) -> bool:
        try:
            result = self.predictions_collection.update_one(
                {"_id": ObjectId(prediction_id)},
                {"$set": updates}
            )
            return result.modified_count > 0
        except Exception as e:
            logging.error(f"Error updating prediction: {e}")
            raise e

    def delete_prediction(self, prediction_id: str) -> bool:
        try:
            result = self.predictions_collection.delete_one({"_id": ObjectId(prediction_id)})
            return result.deleted_count > 0
        except Exception as e:
            logging.error(f"Error deleting prediction: {e}")
            raise e

    def get_prediction_by_id(self, prediction_id: str) -> Optional[Dict[str, Any]]:
        try:
            prediction = self.predictions_collection.find_one({"_id": ObjectId(prediction_id)})
            return serialize_doc(prediction) if prediction else None
        except Exception as e:
            logging.error(f"Error getting prediction by ID: {e}")
            raise e

    # ---------------- Statistics operations ----------------
    def get_stats(self) -> Dict[str, Any]:
        try:
            total_users = self.users_collection.count_documents({})
            total_predictions = self.predictions_collection.count_documents({})

            predictions_with_actual = self.predictions_collection.find(
                {"actual_price": {"$ne": None}}
            )

            accuracy_scores = []
            for pred in predictions_with_actual:
                if pred.get("actual_price") and pred.get("predicted_price"):
                    accuracy = abs(pred["actual_price"] - pred["predicted_price"]) / pred["actual_price"]
                    accuracy_scores.append(accuracy)

            average_accuracy = sum(accuracy_scores) / len(accuracy_scores) if accuracy_scores else 0

            return {
                "total_users": total_users,
                "total_predictions": total_predictions,
                "average_accuracy": average_accuracy
            }
        except Exception as e:
            logging.error(f"Error getting stats: {e}")
            raise e


# Global MongoDB service instance
mongodb_service = MongoDBService()
