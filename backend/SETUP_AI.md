# AI Agents Setup Guide

## Quick Setup for Accurate AI Responses

The AI agents now support **Google Gemini** (recommended) and **Ollama** (fallback).

### Option 1: Google Gemini (Recommended - Most Reliable)

1. Get a free Gemini API key:
   - Go to https://makersuite.google.com/app/apikey
   - Create a new API key
   - Copy the key

2. Add to `backend/.env`:
   ```
   GEMINI_API_KEY=your_api_key_here
   GEMINI_MODEL=gemini-1.5-flash
   ```

3. Restart your backend server

**Benefits:**
- ✅ More reliable and accurate
- ✅ No local setup required
- ✅ Works immediately
- ✅ Better medical knowledge

### Option 2: Ollama (Local - Requires Setup)

1. Install Ollama: https://ollama.ai

2. Pull a model:
   ```powershell
   ollama pull mistral:latest
   ```

3. Add to `backend/.env` (optional):
   ```
   OLLAMA_URL=http://localhost:11434
   OLLAMA_MODEL=mistral:latest
   ```

4. Make sure Ollama is running:
   ```powershell
   ollama serve
   ```

**Note:** Ollama is used as a fallback if Gemini is not configured.

### Priority Order

The system tries AI services in this order:
1. **Google Gemini** (if GEMINI_API_KEY is set)
2. **Ollama** (if Gemini fails or is not configured)
3. **Basic Fallback** (rule-based responses if both fail)

### Testing

After setup, test the agents:
- Diagnostic Agent: `/agent/diagnostic`
- MASC Agent: `/agent/masc`

### Troubleshooting

**If agents show "Thinking..." forever:**
- Check backend logs for errors
- Verify API keys are correct
- Ensure backend server is running

**If responses are basic/fallback:**
- Check if GEMINI_API_KEY is set correctly
- Verify Ollama is running (if using Ollama)
- Check backend console for error messages

**Gemini API Errors:**
- Verify API key is valid
- Check API quota/limits
- Ensure internet connection

**Ollama Errors:**
- Restart Ollama: `ollama serve`
- Re-pull model: `ollama pull mistral:latest`
- Check system memory/resources

