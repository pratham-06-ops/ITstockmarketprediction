from app import app, db, User, bcrypt

def create_regular_user():
    with app.app_context():
        # Check if user123 already exists
        existing_user = User.query.filter_by(username='user123').first()
        if existing_user:
            print("User 'user123' already exists!")
            return
        
        # Create new user
        hashed_password = bcrypt.generate_password_hash('password123').decode('utf-8')
        new_user = User(
            username='user123',
            email='user123@example.com',
            password_hash=hashed_password,
            is_admin=False
        )
        
        db.session.add(new_user)
        db.session.commit()
        print("User 'user123' created successfully!")
        print("Username: user123")
        print("Password: password123")

if __name__ == "__main__":
    create_regular_user() 