# MongoDB Setup Guide

This guide will help you set up MongoDB for the Stock Market Prediction application.

## Prerequisites

1. **MongoDB Installation**: Make sure MongoDB is installed on your system
   - Windows: Download from [MongoDB Community Server](https://www.mongodb.com/try/download/community)
   - macOS: `brew install mongodb-community`
   - Linux: Follow [MongoDB Installation Guide](https://docs.mongodb.com/manual/installation/)

2. **Python Dependencies**: Install required Python packages
   ```bash
   pip install -r requirements.txt
   ```

## MongoDB Setup

### 1. Start MongoDB Service

**Windows:**
```bash
# Start MongoDB service
net start MongoDB

# Or run MongoDB manually
mongod --dbpath C:\data\db
```

**macOS/Linux:**
```bash
# Start MongoDB service
sudo systemctl start mongod

# Or run MongoDB manually
mongod --dbpath /data/db
```

### 2. Verify MongoDB Connection

```bash
# Connect to MongoDB shell
mongosh

# Or using mongo (older versions)
mongo
```

### 3. Run Setup Script

```bash
# Navigate to backend directory
cd backend

# Run MongoDB setup script
python setup_mongodb.py
```

This script will:
- Create the database `stock_prediction_db`
- Create collections: `users` and `predictions`
- Create necessary indexes for performance
- Create an admin user (username: `admin`, password: `admin123`)

## Environment Configuration

Create a `.env` file in the backend directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DATABASE=stock_prediction_db

# Flask Configuration
SECRET_KEY=your-secret-key-here-change-in-production

# CORS Configuration
CORS_ORIGINS=http://localhost:3000
```

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password_hash: String,
  is_admin: Boolean,
  created_at: Date
}
```

### Predictions Collection
```javascript
{
  _id: ObjectId,
  user_id: String (references users._id),
  stock_symbol: String,
  predicted_price: Number,
  actual_price: Number,
  prediction_date: Date,
  model_used: String,
  confidence_score: Number
}
```

## Indexes Created

The setup script creates the following indexes for optimal performance:

- `users.username` (unique)
- `users.email` (unique)
- `predictions.user_id`
- `predictions.stock_symbol`
- `predictions.prediction_date`
- `predictions.user_id + prediction_date` (compound)

## Running the Application

1. **Start MongoDB** (if not already running)
2. **Start the Flask backend**:
   ```bash
   cd backend
   python app.py
   ```
3. **Start the React frontend**:
   ```bash
   cd frontend
   npm start
   ```

## Troubleshooting

### Connection Issues

If you encounter connection issues:

1. **Check MongoDB status**:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl status mongod
   ```

2. **Verify MongoDB is listening on port 27017**:
   ```bash
   netstat -an | grep 27017
   ```

3. **Check MongoDB logs**:
   - Windows: `C:\Program Files\MongoDB\Server\6.0\log\mongod.log`
   - macOS/Linux: `/var/log/mongodb/mongod.log`

### Database Access

To access the database directly:

```bash
# Connect to MongoDB shell
mongosh

# Switch to your database
use stock_prediction_db

# View collections
show collections

# View users
db.users.find().pretty()

# View predictions
db.predictions.find().pretty()
```

## Security Considerations

1. **Change default admin password** after setup
2. **Use authentication** in production
3. **Enable SSL/TLS** for production deployments
4. **Set up proper user roles** and permissions
5. **Regular backups** of your database

## Production Deployment

For production deployment:

1. **Use MongoDB Atlas** (cloud) or **MongoDB Enterprise**
2. **Enable authentication**:
   ```javascript
   use admin
   db.createUser({
     user: "admin",
     pwd: "secure_password",
     roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
   })
   ```
3. **Configure replica sets** for high availability
4. **Set up monitoring** and alerting
5. **Regular backups** and disaster recovery plans

## Support

If you encounter any issues:

1. Check MongoDB logs for errors
2. Verify all dependencies are installed
3. Ensure MongoDB service is running
4. Check network connectivity
5. Review the application logs

For more information, refer to the [MongoDB Documentation](https://docs.mongodb.com/).
