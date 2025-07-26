import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

if __name__ == "__main__":
    # Get port from environment variable or use default
    port = int(os.getenv("PORT", 8000))
    
    # Get host from environment variable or use default
    host = os.getenv("HOST", "0.0.0.0")
    
    # Get reload setting from environment variable or use default
    reload = os.getenv("RELOAD", "True").lower() == "true"
    
    print(f"Starting ChronoFlow API server at {host}:{port}")
    
    # Run the FastAPI application
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=reload
    )