import os
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.llms import Ollama
from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA

VECTORSTORE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "vectorstores")
REFUSAL_MESSAGE = "Sorry, I can only answer questions strictly based on the provided medical dataset."

def get_rag_chain(agent_name: str, system_prompt: str, model_name: str = "llama3"):
    """
    Creates a RetrievalQA chain for a specific agent.
    """
    vectorstore_path = os.path.join(VECTORSTORE_DIR, agent_name)
    
    if not os.path.exists(vectorstore_path):
        raise FileNotFoundError(f"Vectorstore for {agent_name} not found at {vectorstore_path}. Please run ingest.py first.")

    # Load Vectorstore
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vectorstore = FAISS.load_local(vectorstore_path, embeddings, allow_dangerous_deserialization=True)
    
    # Create Retriever
    retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

    # LLM
    llm = Ollama(model=model_name, temperature=0)

    # Prompt Template
    template = f"""{system_prompt}

Context:
{{context}}

Question:
{{question}}

Answer (if not in context, reply EXACTLY "{REFUSAL_MESSAGE}"):
"""
    
    prompt = PromptTemplate(
        template=template,
        input_variables=["context", "question"]
    )

    # Chain
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True,
        chain_type_kwargs={"prompt": prompt}
    )
    
    return qa_chain

def query_agent(agent_name: str, question: str, system_prompt: str):
    try:
        chain = get_rag_chain(agent_name, system_prompt)
        response = chain.invoke({"query": question})
        answer = response["result"]
        source_docs = response["source_documents"]

        # Basic Check: If no docs retrieved (unlikely with k=4 unless empty store), or strict refusal needed logic
        if not source_docs:
             return REFUSAL_MESSAGE
        
        # We rely on the LLM to follow the instruction for refusal if context is irrelevant
        # But we force the exact string if the LLM output matches close to it or if it's empty
        if not answer.strip():
            return REFUSAL_MESSAGE

        return answer
    except Exception as e:
        print(f"Error querying {agent_name}: {e}")
        # Log error
        return "An error occurred while processing your request."
