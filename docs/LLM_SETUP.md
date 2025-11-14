# LLM Integration Setup Guide

This guide will help you configure the LLM (Large Language Model) integration for HakiChain's AI features.

## Overview

HakiChain uses LLM APIs to power:
- **HakiBot**: AI legal assistant chatbot
- **HakiDraft**: AI document generation
- **HakiLens**: Legal research and analysis
- **HakiReview**: Document review and analysis

## Supported Providers

The platform supports five LLM providers:

1. **OpenAI** (Recommended for production)
   - Models: GPT-4o-mini, GPT-4o, GPT-4-turbo
   - API: https://platform.openai.com/api-keys

2. **Anthropic** (Claude models)
   - Models: Claude 3.5 Sonnet, Claude 3 Opus
   - API: https://console.anthropic.com/

3. **OpenRouter** (Unified gateway - Access multiple models)
   - Models: All OpenAI, Anthropic, and 100+ other models
   - API: https://openrouter.ai/
   - Great for cost comparison and model switching

4. **Google Gemini** (Google's AI models)
   - Models: gemini-pro, gemini-pro-vision
   - API: https://makersuite.google.com/app/apikey

5. **Local Models** (For development/testing)
   - Supports Ollama, local servers
   - Example: http://localhost:11434/v1

## Quick Setup

### Step 1: Create `.env.local` file

Create a `.env.local` file in the root directory of the project with the following variables:

```env
# Supabase Configuration (existing)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# LLM Configuration
VITE_LLM_PROVIDER=openai
VITE_LLM_API_KEY=your_api_key_here
```

### Step 2: Choose Your Provider

#### Option A: OpenAI (Recommended)

1. Sign up at https://platform.openai.com/
2. Get your API key from https://platform.openai.com/api-keys
3. Add to `.env.local`:

```env
VITE_LLM_PROVIDER=openai
VITE_LLM_API_KEY=sk-your-openai-api-key-here
VITE_LLM_MODEL=gpt-4o-mini  # Optional, defaults to gpt-4o-mini
```

#### Option B: Anthropic (Claude)

1. Sign up at https://console.anthropic.com/
2. Get your API key from the dashboard
3. Add to `.env.local`:

```env
VITE_LLM_PROVIDER=anthropic
VITE_LLM_API_KEY=sk-ant-your-anthropic-api-key-here
VITE_LLM_MODEL=claude-3-5-sonnet-20241022  # Optional
```

#### Option C: OpenRouter (Unified Gateway)

1. Sign up at https://openrouter.ai/
2. Get your API key from https://openrouter.ai/keys
3. Add to `.env.local`:

```env
VITE_LLM_PROVIDER=openrouter
VITE_LLM_API_KEY=sk-or-v1-your-openrouter-api-key-here
VITE_LLM_MODEL=openai/gpt-4o-mini  # Format: provider/model-name
```

**Popular OpenRouter Models:**
- `openai/gpt-4o-mini` - Cost-effective
- `openai/gpt-4o` - More capable
- `anthropic/claude-3.5-sonnet` - Claude via OpenRouter
- `google/gemini-pro` - Gemini via OpenRouter
- `meta-llama/llama-3-70b-instruct` - Open source option

#### Option D: Google Gemini

1. Get API key from https://makersuite.google.com/app/apikey
2. Add to `.env.local`:

```env
VITE_LLM_PROVIDER=gemini
VITE_LLM_API_KEY=your-gemini-api-key-here
VITE_LLM_MODEL=gemini-pro  # Optional, defaults to gemini-pro
```

**Available Gemini Models:**
- `gemini-pro` - Text generation (default)
- `gemini-pro-vision` - Multimodal (text + images)

#### Option E: Local Model (Ollama)

1. Install Ollama: https://ollama.ai/
2. Pull a model: `ollama pull llama2`
3. Start Ollama server
4. Add to `.env.local`:

```env
VITE_LLM_PROVIDER=local
VITE_LLM_BASE_URL=http://localhost:11434/v1
VITE_LLM_MODEL=llama2  # Or your preferred model
# VITE_LLM_API_KEY=  # Leave empty if no auth required
```

### Step 3: Advanced Configuration (Optional)

You can customize additional settings:

```env
# Temperature (0.0-2.0, default: 0.7)
# Lower = more deterministic, Higher = more creative
VITE_LLM_TEMPERATURE=0.7

# Max tokens in response (default: 2000)
# Increase for longer documents/responses
VITE_LLM_MAX_TOKENS=4000

# Custom base URL (for custom endpoints or proxies)
VITE_LLM_BASE_URL=https://your-custom-endpoint.com/v1
```

### Step 4: Restart Development Server

After updating `.env.local`, restart your development server:

```bash
npm run dev
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_LLM_PROVIDER` | Yes | `openai` | Provider: `openai`, `anthropic`, or `local` |
| `VITE_LLM_API_KEY` | Yes* | - | API key for OpenAI/Anthropic (*not required for local) |
| `VITE_LLM_BASE_URL` | No | Provider default | Custom API endpoint URL |
| `VITE_LLM_MODEL` | No | Provider default | Model name to use |
| `VITE_LLM_TEMPERATURE` | No | `0.7` | Response randomness (0.0-2.0) |
| `VITE_LLM_MAX_TOKENS` | No | `2000` | Maximum response length |

## Testing Your Setup

1. **Test HakiBot**: 
   - Open the app and click the HakiBot icon (bottom right)
   - Ask a legal question
   - If you see an error, check your API key and provider settings

2. **Test HakiDraft**:
   - Navigate to HakiDraft
   - Fill in document details
   - Click "Generate Document"
   - Check for error messages if generation fails

3. **Test HakiLens**:
   - Navigate to HakiLens
   - Try the AI Assistant tab
   - Ask a legal research question

## Troubleshooting

### Error: "API key is required"
- **Solution**: Make sure `VITE_LLM_API_KEY` is set in `.env.local`
- Restart the dev server after adding the key

### Error: "Failed to connect to local model"
- **Solution**: 
  - Make sure your local LLM server is running
  - Check `VITE_LLM_BASE_URL` points to the correct endpoint
  - For Ollama, ensure it's running: `ollama serve`

### Error: "OpenAI API error: 401"
- **Solution**: Your API key is invalid or expired
- Get a new key from https://platform.openai.com/api-keys

### Error: "Anthropic API error: 401"
- **Solution**: Your API key is invalid
- Get a new key from https://console.anthropic.com/

### Error: "OpenRouter API error: 401"
- **Solution**: Your API key is invalid
- Get a new key from https://openrouter.ai/keys
- Make sure you have credits in your OpenRouter account

### Error: "Gemini API error: 401"
- **Solution**: Your API key is invalid or quota exceeded
- Get a new key from https://makersuite.google.com/app/apikey
- Check your API quota in Google Cloud Console

### Responses are slow
- **Solution**: 
  - Use a faster model (e.g., `gpt-4o-mini` instead of `gpt-4o`)
  - Reduce `VITE_LLM_MAX_TOKENS` for shorter responses
  - For local models, ensure adequate system resources

### Responses are too generic
- **Solution**: 
  - Increase `VITE_LLM_TEMPERATURE` (try 0.8-1.0)
  - Use a more capable model (e.g., `gpt-4o` or `claude-3-opus`)

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Use environment variables** in production (Vercel, Netlify, etc.)
3. **Rotate API keys** regularly
4. **Monitor API usage** to prevent unexpected costs
5. **Use rate limiting** in production to prevent abuse

## Production Deployment

### Vercel
1. Go to Project Settings → Environment Variables
2. Add all `VITE_*` variables
3. Redeploy

### Netlify
1. Go to Site Settings → Environment Variables
2. Add all `VITE_*` variables
3. Redeploy

### Other Platforms
- Add environment variables through your platform's dashboard
- Ensure variables are prefixed with `VITE_` for Vite to expose them

## Cost Considerations

- **OpenAI GPT-4o-mini**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **Anthropic Claude 3.5 Sonnet**: ~$3 per 1M input tokens, ~$15 per 1M output tokens
- **OpenRouter**: Varies by model (often cheaper than direct APIs, see pricing at https://openrouter.ai/models)
- **Google Gemini**: Free tier available, then ~$0.50 per 1M input tokens, ~$1.50 per 1M output tokens
- **Local Models**: Free (but requires local infrastructure)

**Cost-Effective Options:**
- For development: `gpt-4o-mini` or local models
- For production: Compare prices on OpenRouter for best deals
- For free tier: Google Gemini (limited free quota)

## Support

If you encounter issues:
1. Check the browser console for detailed error messages
2. Verify your `.env.local` file is in the project root
3. Ensure you've restarted the dev server after changes
4. Review the troubleshooting section above

---

**Note**: The LLM integration requires an active internet connection (except for local models) and valid API credentials.

