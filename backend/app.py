import logging
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from diagnostic_agent import get_diagnostic_response
from masc_agent import get_masc_response

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Security: In production, specify exact frontend URL
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "ok", "service": "AI Healthcare Backend"}

@app.post("/api/diagnostic/chat")
def diagnostic_chat(request_data: dict):
    """
    Endpoint for Diagnostic AI Agent.
    Request Body: {"question": "..."}
    """
    question = request_data.get("question", "")
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")
    
    logger.info(f"Diagnostic Agent received: {question}")
    try:
        answer = get_diagnostic_response(question)
        logger.info("Diagnostic Agent responded")
        return {"answer": answer}
    except Exception as e:
        logger.error(f"Error in Diagnostic Agent: {e}")
        return {"answer": "Sorry, an internal error occurred."}

@app.post("/api/masc/chat")
def masc_chat(request_data: dict):
    """
    Endpoint for MASC AI Agent.
    Request Body: {"question": "..."}
    """
    question = request_data.get("question", "")
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")
    
    logger.info(f"MASC Agent received: {question}")
    try:
        answer = get_masc_response(question)
        logger.info("MASC Agent responded")
        return {"answer": answer}
    except Exception as e:
        logger.error(f"Error in MASC Agent: {e}")
        return {"answer": "Sorry, an internal error occurred."}

# Compatible routes for existing frontend proxy if needed
@app.post("/agent/diagnostic")
def diagnostic_chat_proxy(request_data: dict):
    return diagnostic_chat(request_data)

@app.post("/agent/masc")
def masc_chat_proxy(request_data: dict):
    return masc_chat(request_data)
