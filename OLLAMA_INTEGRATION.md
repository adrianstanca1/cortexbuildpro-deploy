# Ollama Integration Guide for CortexBuildPro

This document explains how to configure and use Ollama local AI models with your CortexBuildPro application.

## Overview

CortexBuildPro now supports dual AI providers:
- **Google Gemini** (cloud-based, default)
- **Ollama** (local, self-hosted)

## Prerequisites

1. **Ollama installed** on your host machine:
   ```bash
   # Install Ollama
   curl -fsSL https://ollama.com/install.sh | sh
   
   # Start Ollama service
   ollama serve
   ```

2. **Pull the desired models**:
   ```bash
   # Pull the recommended model
   ollama pull nemotron-3-super:latest
   
   # Or alternative models
   ollama pull qwen3.5:latest
   ollama pull qwen3-coder:30b
   ```

## Configuration

### Environment Variables

Add these to your `.env` file (copy from `.env.example`):

```bash
# Ollama Configuration
OLLAMA_HOST=http://host.docker.internal:11434  # For Docker Desktop
# OLLAMA_HOST=http://172.17.0.1:11434        # For Linux Docker bridge
# OLLAMA_HOST=http://localhost:11434         # For local development (non-Docker)
OLLAMA_MODEL=nemotron-3-super:latest

# Optional: Set Ollama as default provider
# DEFAULT_AI_PROVIDER=ollama
```

### Docker Network Configuration

When running CortexBuildPro in Docker, you need to configure networking to access the host's Ollama service:

#### For Docker Desktop (Mac/Windows):
```bash
# The host.docker.internal hostname is automatically resolved
OLLAMA_HOST=http://host.docker.internal:11434
```

#### For Linux Docker:
```bash
# Find your host IP within the Docker network
# Usually the gateway is accessible at 172.17.0.1
OLLAMA_HOST=http://172.17.0.1:11434
```

#### For local development (not using Docker):
```bash
OLLAMA_HOST=http://localhost:11434
```

## Usage

### Switching Providers at Runtime

You can switch between AI providers by setting the `DEFAULT_AI_PROVIDER` environment variable:

```bash
# Use Gemini (default)
DEFAULT_AI_PROVIDER=gemini

# Use Ollama
DEFAULT_AI_PROVIDER=ollama
```

### Model Selection

Override the default model for either provider:

```bash
# For Gemini
DEFAULT_GEMINI_MODEL=gemini-3-flash-preview

# For Ollama
OLLAMA_MODEL=qwen3.5:latest
```

## Verification

### Check if Ollama is accessible from your container:
```bash
# Inside the running container or during build
curl http://host.docker.internal:11434/api/tags
```

### Test the integration:
```bash
# Start your application
docker-compose up  # or however you run your container

# The application will now be able to use Ollama models
# for AI features when DEFAULT_AI_PROVIDER=ollama is set
```

## Troubleshooting

### "Ollama service is not available" errors:
1. Ensure Ollama is running on your host: `ollama serve`
2. Check that the OLLAMA_HOST points to the correct address
3. Verify network connectivity from container to host
4. For Docker Desktop, ensure `host.docker.internal` resolves correctly

### Performance considerations:
- Local Ollama models require sufficient RAM/VRAM
- The nemotron-3-super model is 86GB and requires significant resources
- Consider using smaller models like qwen3.5:latest (6.6GB) for development
- Monitor resource usage with `ollama ps`

## Security Notes

- When using Ollama locally, your data never leaves your machine
- This provides enhanced privacy compared to cloud APIs
- Ensure your host machine is secured if exposing Ollama to networks

## Example .env Configuration

```bash
# AI Provider Selection
DEFAULT_AI_PROVIDER=ollama

# Ollama Configuration
OLLAMA_HOST=http://host.docker.internal:11434
OLLAMA_MODEL=nemotron-3-super:latest

# Fallback to Gemini if Ollama unavailable
# (Keep your Gemini API keys as backup)
GEMINI_API_KEY=your_gemini_key_here
```

## Benefits of Local Ollama

1. **Privacy**: All processing happens locally
2. **Cost**: No API usage fees after initial model download
3. **Availability**: Works offline
4. **Customization**: Can fine-tune models on your own data
5. **Low Latency**: No network round-trips to cloud services

## Recommended Models for CortexBuildPro

| Model | Size | Use Case | Quality |
|-------|------|----------|---------|
| nemotron-3-super:latest | 86GB | Highest quality reasoning | ⭐⭐⭐⭐⭐ |
| qwen3.5:latest | 6.6GB | Excellent balance | ⭐⭐⭐⭐ |
| qwen3-coder:30b | 18GB | Coding-focused tasks | ⭐⭐⭐⭐ |
| qwen3-vl:30b | 19GB | Vision + language tasks | ⭐⭐⭐⭐ |

Start with smaller models for testing, then upgrade to nemotron-3-super for production use if your hardware supports it.