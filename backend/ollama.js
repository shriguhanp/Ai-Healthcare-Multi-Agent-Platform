// Using Ollama HTTP API instead of spawn
async function runOllama(systemPrompt, userMessage) {
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  // Use full model name with tag (e.g., llama3:latest)
  // Default to mistral if llama3 is having issues
  let model = process.env.OLLAMA_MODEL || "mistral:latest";
  
  // Ensure model has a tag
  if (!model.includes(':')) {
    model = `${model}:latest`;
  }
  
  // If llama3 is specified but we want to allow fallback, we can try mistral
  const fallbackModel = "mistral:latest";
  
  const timeout = 120000; // 2 minute timeout

  // Create a promise that rejects after timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('TIMEOUT')), timeout);
  });

  // Create the fetch promise
  const fetchPromise = (async () => {
    try {
      console.log(`[Ollama] Calling ${ollamaUrl}/api/chat with model: ${model}`);
      console.log(`[Ollama] System prompt length: ${systemPrompt.length}, User message length: ${userMessage.length}`);
      
      // Limit system prompt length to prevent crashes
      const maxSystemPromptLength = 2000;
      const trimmedSystemPrompt = systemPrompt.length > maxSystemPromptLength 
        ? systemPrompt.substring(0, maxSystemPromptLength) + "..."
        : systemPrompt;
      
      // Try /api/chat first (preferred method)
      let requestBody = {
        model: model,
        messages: [
          {
            role: "system",
            content: trimmedSystemPrompt,
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
        }
      };

      console.log(`[Ollama] Request body size: ${JSON.stringify(requestBody).length} bytes`);
      
      let response = await fetch(`${ollamaUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      // If /api/chat fails with 500, try fallback model or /api/generate
      if (!response.ok && response.status === 500) {
        console.log(`[Ollama] /api/chat failed with model ${model}, trying fallback...`);
        
        // First try with fallback model if current model is llama3
        if (model.includes('llama3') && fallbackModel && fallbackModel !== model) {
          console.log(`[Ollama] Trying fallback model: ${fallbackModel}`);
          requestBody.model = fallbackModel;
          
          response = await fetch(`${ollamaUrl}/api/chat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          });
        }
        
        // If still failing, try /api/generate as last resort
        if (!response.ok && response.status === 500) {
          console.log(`[Ollama] Still failing, trying /api/generate as fallback`);
          
          // Combine system prompt and user message for generate endpoint
          const combinedPrompt = `${trimmedSystemPrompt}\n\nUser: ${userMessage}\nAssistant:`;
          
          requestBody = {
            model: model.includes('llama3') ? fallbackModel : model,
            prompt: combinedPrompt,
            stream: false,
            options: {
              temperature: 0.7,
              top_p: 0.9,
            }
          };
          
          response = await fetch(`${ollamaUrl}/api/generate`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          });
        }
      }

      console.log(`[Ollama] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        console.error(`[Ollama] Error response:`, errorText);
        
        // Try to parse error JSON
        let errorMessage = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorText;
        } catch (e) {
          // Not JSON, use as is
        }
        
        throw new Error(`Ollama API error (${response.status}): ${errorMessage}`);
      }

      const data = await response.json();
      console.log(`[Ollama] Response received, keys:`, Object.keys(data));
      
      // Handle different response formats from Ollama
      // /api/chat format
      if (data.message?.content) {
        return data.message.content;
      } else if (data.message?.message?.content) {
        return data.message.message.content;
      }
      // /api/generate format
      else if (data.response) {
        return data.response;
      }
      // Direct string
      else if (typeof data === 'string') {
        return data;
      }
      // Fallback
      else {
        console.warn("Unexpected Ollama response format:", JSON.stringify(data, null, 2));
        return "I apologize, but I couldn't generate a response. Please try again.";
      }
    } catch (error) {
      if (error.message === 'TIMEOUT') {
        throw new Error("Ollama request timed out. The model may be taking too long to respond.");
      }
      throw error;
    }
  })();

  try {
    // Race between fetch and timeout
    const result = await Promise.race([fetchPromise, timeoutPromise]);
    return result;
  } catch (error) {
    console.error("Ollama API Error:", error.message);
    
    if (error.message === 'TIMEOUT' || error.message.includes('timed out')) {
      throw new Error("Ollama request timed out. The model may be taking too long to respond.");
    } else if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      throw new Error(`Cannot connect to Ollama at ${ollamaUrl}. Make sure Ollama is installed and running. Start it with: ollama serve`);
    } else if (error.message.includes('exit status 2') || error.message.includes('terminated')) {
      throw new Error(`Ollama model process crashed. The model ${model} may be corrupted or have memory issues. Solutions: 1) Restart Ollama: Stop and restart the Ollama service, 2) Re-pull the model: ollama pull ${model}, 3) Use a different model by setting OLLAMA_MODEL=mistral:latest in your .env file`);
    } else {
      throw new Error(`Ollama error: ${error.message}`);
    }
  }
}

export default runOllama;
