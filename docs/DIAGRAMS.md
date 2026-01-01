## System Diagrams

Below are Mermaid diagrams for the project. You can preview them in GitHub, VS Code (Markdown/Markdown Preview Mermaid), or with the Mermaid CLI.

### Data Flow Diagram (DFD)

```mermaid
flowchart LR
    subgraph External
      U[User]
      A[Admin]
      YF[Yahoo Finance]
    end

    subgraph System[Stock Prediction System]
      FE[React Frontend]
      API[Flask API]
      DP[Data Processor]
      LSTM[LSTM Model]
      CG[Chart Generator]
    end

    subgraph Stores
      CSV[(CSV Files\nTCS/WIPRO/INFOSYS)]
      DB[(SQLite DB\nusers, predictions)]
    end

    U <--> FE
    A <--> FE
    FE <--> API
    API --> DP
    DP <--> CSV
    API --> LSTM
    API --> CG
    API <--> DB
    API <--> YF

    %% Data flows
    U -- credentials / actions --> FE
    FE -- HTTP requests --> API
    API -- read/validate --> DP
    DP -- historical OHLC --> API
    API -- predictions/confidence/tech --> FE
    API -- save prediction --> DB
    API -- current price --> YF
    YF -- live price --> API
    FE -- charts config --> CG
```

### Sequence Diagram (Make Prediction)

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as Frontend (React)
    participant API as Backend (Flask)
    participant DP as DataProcessor
    participant ML as LSTMModel
    participant YF as YahooFinance
    participant DB as SQLite DB

    User->>FE: Select stock + duration
    User->>FE: Click "Make Prediction"
    FE->>API: POST /api/multi-duration-predict {stock, duration}
    API->>YF: Fetch current price
    YF-->>API: current_price
    API->>DP: Load & preprocess CSV
    DP-->>API: cleaned dataframe
    API->>ML: predict(daysAhead)
    ML-->>API: predictions[], confidence, indicators
    API->>DB: INSERT prediction meta
    API-->>FE: prediction payload (actual_price CSV avg, current_price, predictions[])
    FE->>FE: Navigate to /prediction/result
    FE-->>User: Show progress chart and details
```

### Activity Diagram (User Prediction Flow)

```mermaid
stateDiagram-v2
    [*] --> Login
    Login --> Dashboard: success
    Dashboard --> SelectStockDuration
    SelectStockDuration --> SubmitPrediction
    SubmitPrediction --> AwaitResponse
    AwaitResponse --> ShowResult: success
    AwaitResponse --> Error: failure
    ShowResult --> [*]
    Error --> Dashboard
```

### Use Case Diagram (simplified)

```mermaid
flowchart TD
    subgraph System[Stock Prediction System]
      UC_Register([Register])
      UC_Login([Login/Logout])
      UC_Predict([Make Prediction])
      UC_ViewResult([View Result & Charts])
      UC_History([View History])
      UC_AdminPred([View All Predictions])
      UC_AdminUser([Manage Users])
      UC_AdminEdit([Edit/Delete Prediction])
    end

    User[[User]] -- uses --> UC_Register
    User[[User]] -- uses --> UC_Login
    User[[User]] -- uses --> UC_Predict
    User[[User]] -- uses --> UC_ViewResult
    User[[User]] -- uses --> UC_History

    Admin[[Admin]] -- uses --> UC_Login
    Admin[[Admin]] -- uses --> UC_AdminPred
    Admin[[Admin]] -- uses --> UC_AdminUser
    Admin[[Admin]] -- uses --> UC_AdminEdit
```


