# Ollama Troubleshooting Guide

## Current Issue: Model Process Crashes (exit status 2)

If you're seeing errors like "llama runner process has terminated: exit status 2", this indicates the Ollama model process is crashing.

## Solutions (try in order):

### 1. Restart Ollama Service
```powershell
# Stop Ollama
Stop-Process -Name "ollama" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "ollama app" -Force -ErrorAction SilentlyContinue

# Wait a few seconds
Start-Sleep -Seconds 3

# Restart Ollama (it should auto-start, or start manually)
ollama serve
```

### 2. Re-pull the Models
The models might be corrupted. Re-download them:

```powershell
# Remove corrupted models
ollama rm llama3:latest
ollama rm mistral:latest

# Re-pull them
ollama pull llama3:latest
ollama pull mistral:latest
```

### 3. Check System Resources
- Ensure you have enough RAM (models need 4-8GB)
- Close other memory-intensive applications
- Check available disk space

### 4. Update Ollama
```powershell
# Download latest version from https://ollama.ai
# Or if using package manager, update it
```

### 5. Use a Different Model
If llama3 keeps crashing, try a smaller model:

```powershell
# Try smaller models
ollama pull phi3:mini
ollama pull gemma:2b
```

Then set in your `.env`:
```
OLLAMA_MODEL=phi3:mini
```

### 6. Check Windows Compatibility
- Ensure you're using the Windows version of Ollama
- Check if antivirus is blocking Ollama
- Run Ollama as Administrator if needed

### 7. Verify Model Works
Test if the model works directly:
```powershell
ollama run llama3:latest "Hello, test"
```

If this also crashes, the issue is with Ollama installation, not the code.

## Temporary Workaround

The code now defaults to `mistral:latest` and includes fallback logic. If all models fail, users will see a helpful message instead of an error.

## Environment Variables

You can set these in `backend/.env`:

```
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral:latest
```

## Still Having Issues?

1. Check Ollama logs (usually in `%LOCALAPPDATA%\Programs\Ollama\`)
2. Try a fresh Ollama installation
3. Check Windows Event Viewer for system errors
4. Ensure Windows is up to date

