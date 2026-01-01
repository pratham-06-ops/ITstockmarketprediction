# Stock Market Prediction Project - System Flowchart

## 🏗️ Overall System Architecture

```mermaid
graph TB
    subgraph "Frontend (React.js)"
        A[User Interface] --> B[Login/Register]
        A --> C[Dashboard]
        A --> D[Stock Prediction]
        A --> E[History/Charts]
        A --> F[Admin Panel]
    end
    
    subgraph "Backend (Flask)"
        G[API Server] --> H[Authentication]
        G --> I[Stock Data Processing]
        G --> J[ML Models]
        G --> K[Database]
    end
    
    subgraph "Database (SQLite)"
        K --> L[Users Table]
        K --> M[Predictions Table]
    end
    
    subgraph "ML Models"
        J --> N[LSTM Model]
        J --> O[Linear Regression]
        J --> P[Stock Predictor]
    end
    
    A <--> G
    G <--> K
    I <--> J
```

## 🔐 Authentication Flow

```mermaid
flowchart TD
    A[User Opens App] --> B{User Logged In?}
    B -->|No| C[Show Login Page]
    B -->|Yes| D[Show Dashboard]
    
    C --> E[Enter Credentials]
    E --> F[Submit Login]
    F --> G{Valid Credentials?}
    
    G -->|No| H[Show Error Message]
    H --> C
    
    G -->|Yes| I[Store User Data]
    I --> J[Set Auth Token]
    J --> D
    
    D --> K[User Actions]
    K --> L[Logout]
    L --> M[Clear Session]
    M --> C
```

## 📊 Stock Prediction Flow

```mermaid
flowchart TD
    A[User Dashboard] --> B[Select Stock]
    B --> C[Choose Model Type]
    C --> D[Submit Prediction Request]
    
    D --> E[Backend API]
    E --> F[Load Historical Data]
    F --> G{Model Type?}
    
    G -->|LSTM| H[LSTM Model]
    G -->|Linear| I[Linear Regression]
    
    H --> J[Process Data]
    I --> J
    J --> K[Generate Prediction]
    K --> L[Save to Database]
    L --> M[Return Results]
    
    M --> N[Display Prediction]
    N --> O[Show Charts]
    O --> P[Save to History]
```

## 👥 User Management Flow

```mermaid
flowchart TD
    A[User Management] --> B{User Type?}
    
    B -->|Regular User| C[User Dashboard]
    B -->|Admin| D[Admin Dashboard]
    
    C --> E[Make Predictions]
    C --> F[View History]
    C --> G[Change Password]
    
    D --> H[View All Users]
    D --> I[View All Predictions]
    D --> J[System Statistics]
    D --> K[User Management]
    
    E --> L[Stock Selection]
    L --> M[Model Selection]
    M --> N[Prediction Results]
    
    F --> O[Personal History]
    O --> P[Charts & Analytics]
```

## 🔄 Data Flow Architecture

```mermaid
flowchart LR
    subgraph "Data Sources"
        A[CSV Stock Data]
        B[User Input]
        C[Historical Predictions]
    end
    
    subgraph "Processing"
        D[Data Processor]
        E[ML Models]
        F[Chart Generator]
    end
    
    subgraph "Storage"
        G[SQLite Database]
        H[Local Storage]
    end
    
    subgraph "Output"
        I[Prediction Results]
        J[Charts & Graphs]
        K[User Interface]
    end
    
    A --> D
    B --> D
    C --> D
    D --> E
    E --> I
    D --> F
    F --> J
    I --> G
    J --> K
    G --> K
    H --> K
```

## 🛠️ API Endpoints Flow

```mermaid
flowchart TD
    A[Frontend Request] --> B{Endpoint Type?}
    
    B -->|Authentication| C[/api/login]
    B -->|Authentication| D[/api/register]
    B -->|Authentication| E[/api/logout]
    B -->|Authentication| F[/api/change-password]
    
    B -->|Stock Data| G[/api/stocks]
    B -->|Stock Data| H[/api/charts/<stock>]
    
    B -->|Prediction| I[/api/predict]
    B -->|History| J[/api/history]
    
    B -->|Admin| K[/api/admin/users]
    B -->|Admin| L[/api/admin/predictions]
    B -->|Stats| M[/api/stats]
    
    C --> N[Validate Credentials]
    D --> O[Create User]
    E --> P[Clear Session]
    F --> Q[Update Password]
    
    G --> R[Return Stock List]
    H --> S[Generate Charts]
    I --> T[Run ML Model]
    J --> U[Get User History]
    
    K --> V[Get All Users]
    L --> W[Get All Predictions]
    M --> X[Get Statistics]
```

## 🎯 User Journey Flow

```mermaid
flowchart TD
    A[Landing Page] --> B[Login/Register]
    B --> C{Registration?}
    
    C -->|Yes| D[Register Form]
    C -->|No| E[Login Form]
    
    D --> F[Create Account]
    F --> G[Login]
    E --> G
    
    G --> H{User Type?}
    H -->|Admin| I[Admin Dashboard]
    H -->|Regular| J[User Dashboard]
    
    I --> K[Manage Users]
    I --> L[View All Predictions]
    I --> M[System Stats]
    
    J --> N[Make Prediction]
    J --> O[View History]
    J --> P[Change Password]
    
    N --> Q[Select Stock]
    Q --> R[Choose Model]
    R --> S[Get Prediction]
    S --> T[View Results]
    T --> U[Save to History]
    
    O --> V[View Charts]
    V --> W[Analytics]
```

## 🔧 Error Handling Flow

```mermaid
flowchart TD
    A[User Action] --> B{Valid Request?}
    B -->|No| C[Show Validation Error]
    B -->|Yes| D[Process Request]
    
    D --> E{Backend Error?}
    E -->|Yes| F[Log Error]
    F --> G[Return Error Response]
    G --> H[Show Error Message]
    
    E -->|No| I[Process Successfully]
    I --> J[Return Success Response]
    J --> K[Update UI]
    
    C --> L[User Fixes Input]
    L --> A
    
    H --> M[User Retries]
    M --> A
```

## 📈 ML Model Prediction Flow

```mermaid
flowchart TD
    A[Prediction Request] --> B[Load Stock Data]
    B --> C[Data Preprocessing]
    C --> D{Model Type?}
    
    D -->|LSTM| E[LSTM Model]
    D -->|Linear| F[Linear Regression]
    
    E --> G[Sequence Preparation]
    F --> H[Feature Engineering]
    
    G --> I[LSTM Prediction]
    H --> J[Linear Prediction]
    
    I --> K[Post-processing]
    J --> K
    
    K --> L[Confidence Calculation]
    L --> M[Save Prediction]
    M --> N[Return Results]
```

## 🎨 Frontend Component Flow

```mermaid
flowchart TD
    A[App.js] --> B[AuthContext]
    A --> C[Router]
    
    C --> D[Login Page]
    C --> E[Register Page]
    C --> F[User Dashboard]
    C --> G[Admin Dashboard]
    C --> H[Prediction Page]
    C --> I[History Page]
    C --> J[About Page]
    
    B --> K[Authentication State]
    K --> L{Is Authenticated?}
    
    L -->|Yes| M[Protected Routes]
    L -->|No| N[Public Routes]
    
    M --> F
    M --> G
    M --> H
    M --> I
    
    N --> D
    N --> E
    N --> J
    
    F --> O[Navbar]
    F --> P[Sidebar]
    F --> Q[Main Content]
    
    G --> R[Admin Components]
    H --> S[Prediction Components]
    I --> T[Chart Components]
```

## 🔄 Session Management Flow

```mermaid
flowchart TD
    A[App Start] --> B[Check LocalStorage]
    B --> C{Token Exists?}
    
    C -->|Yes| D[Validate Token]
    C -->|No| E[Show Login]
    
    D --> F{Token Valid?}
    F -->|Yes| G[Set Auth State]
    F -->|No| H[Clear Invalid Token]
    
    G --> I[Load User Data]
    I --> J[Show Dashboard]
    
    H --> E
    E --> K[User Login]
    K --> L[Store New Token]
    L --> G
    
    J --> M[User Actions]
    M --> N[Logout]
    N --> O[Clear Token]
    O --> E
```

## 📊 Database Schema Flow

```mermaid
flowchart TD
    A[Database] --> B[Users Table]
    A --> C[Predictions Table]
    
    B --> D[User ID]
    B --> E[Username]
    B --> F[Email]
    B --> G[Password Hash]
    B --> H[Is Admin]
    B --> I[Created At]
    
    C --> J[Prediction ID]
    C --> K[User ID]
    C --> L[Stock Symbol]
    C --> M[Predicted Price]
    C --> N[Actual Price]
    C --> O[Prediction Date]
    C --> P[Model Used]
    C --> Q[Confidence Score]
    
    D --> R[Foreign Key]
    K --> R
    R --> S[User-Prediction Relationship]
```

This flowchart provides a comprehensive overview of your Stock Market Prediction project's architecture, data flow, user interactions, and system components. Each diagram shows different aspects of the application from authentication to ML model predictions. 