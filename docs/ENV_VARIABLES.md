# Environment Variables Reference

Complete list of all environment variables needed for HakiChain.

## Required Variables

### Supabase (Required for Database & Authentication)

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Where to get:**
- Go to your Supabase project dashboard
- Settings → API
- Copy the "Project URL" and "anon public" key

---

### LLM Provider (Required for AI Features)

**At minimum, you need:**
```env
VITE_LLM_PROVIDER=openrouter  # or: openai, anthropic, gemini, local
VITE_LLM_API_KEY=your_api_key_here
```

---

## Optional LLM Variables

### Model Selection
```env
# Optional - Uses provider default if not set
VITE_LLM_MODEL=openai/gpt-4o-mini
```

**Model examples by provider:**
- **OpenAI**: `gpt-4o-mini`, `gpt-4o`, `gpt-4-turbo`
- **Anthropic**: `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229`
- **OpenRouter**: `openai/gpt-4o-mini`, `anthropic/claude-3.5-sonnet`, `google/gemini-pro`
- **Gemini**: `gemini-pro`, `gemini-pro-vision`
- **Local**: `llama2`, `mistral`, `codellama`

### Custom Base URL
```env
# Optional - Only needed for custom endpoints or local models
VITE_LLM_BASE_URL=http://localhost:11434/v1
```

**When to use:**
- Local models (Ollama): `http://localhost:11434/v1`
- Custom proxy endpoints
- Self-hosted model servers

### Temperature (Response Randomness)
```env
# Optional - Default: 0.7
# Range: 0.0 (deterministic) to 2.0 (very creative)
VITE_LLM_TEMPERATURE=0.7
```

**Recommended values:**
- `0.5` - For legal documents (more consistent)
- `0.7` - Default (balanced)
- `0.8-1.0` - More creative responses

### Max Tokens (Response Length)
```env
# Optional - Default: 2000
# Increase for longer documents/responses
VITE_LLM_MAX_TOKENS=4000
```

**Recommended values:**
- `2000` - Chat responses (default)
- `4000` - Document generation
- `8000` - Very long documents

---

## Complete Example Configurations

### Example 1: OpenRouter (Recommended)
```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenRouter LLM
VITE_LLM_PROVIDER=openrouter
VITE_LLM_API_KEY=sk-or-v1-your-key-here
VITE_LLM_MODEL=openai/gpt-4o-mini
VITE_LLM_TEMPERATURE=0.7
VITE_LLM_MAX_TOKENS=2000
```

### Example 2: Google Gemini
```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGnha5JIwe3456sInR5cCI6IkpXVCJ9...

# Gemini LLM
VITE_LLM_PROVIDER=gemini
VITE_LLM_API_KEY=AIzaSyYour-Gemini-Key-Here
VITE_LLM_MODEL=gemini-pro
VITE_LLM_TEMPERATURE=0.7
VITE_LLM_MAX_TOKENS=2000
```

### Example 3: OpenAI Direct
```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI LLM
VITE_LLM_PROVIDER=openai
VITE_LLM_API_KEY=sk-your-openai-key-here
VITE_LLM_MODEL=gpt-4o-mini
VITE_LLM_TEMPERATURE=0.7
VITE_LLM_MAX_TOKENS=2000
```

### Example 4: Local Model (Ollama)
```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Local LLM
VITE_LLM_PROVIDER=local
VITE_LLM_BASE_URL=http://localhost:11434/v1
VITE_LLM_MODEL=llama2
# VITE_LLM_API_KEY=  # Not needed for Ollama
VITE_LLM_TEMPERATURE=0.7
VITE_LLM_MAX_TOKENS=2000
```

---

## Variable Summary Table

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_SUPABASE_URL` | ✅ Yes | - | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | - | Supabase anonymous key |
| `VITE_LLM_PROVIDER` | ✅ Yes* | `openai` | LLM provider: `openai`, `anthropic`, `openrouter`, `gemini`, `local` |
| `VITE_LLM_API_KEY` | ✅ Yes* | - | API key for LLM provider (*not needed for local) |
| `VITE_LLM_MODEL` | ❌ No | Provider default | Model name to use |
| `VITE_LLM_BASE_URL` | ❌ No | Provider default | Custom API endpoint |
| `VITE_LLM_TEMPERATURE` | ❌ No | `0.7` | Response randomness (0.0-2.0) |
| `VITE_LLM_MAX_TOKENS` | ❌ No | `2000` | Maximum response length |

*Required only if using AI features (HakiBot, HakiDraft, HakiLens, HakiReview)

---

## Quick Setup Checklist

1. ✅ Create `.env.local` file in project root
2. ✅ Add Supabase credentials (required)
3. ✅ Add LLM provider and API key (required for AI features)
4. ✅ (Optional) Customize model, temperature, max tokens
5. ✅ Restart dev server: `npm run dev`

---

## Important Notes

- **File Location**: `.env.local` must be in the **root directory** (same level as `package.json`)
- **Vite Prefix**: All variables must start with `VITE_` to be accessible in the browser
- **Never Commit**: `.env.local` is in `.gitignore` - never commit API keys!
- **Restart Required**: You must restart the dev server after changing `.env.local`
- **Production**: Set these same variables in your hosting platform (Vercel, Netlify, etc.)

---

## Provider-Specific Notes

### OpenRouter
- Model format: `provider/model-name` (e.g., `openai/gpt-4o-mini`)
- Supports 100+ models from different providers
- Often cheaper than direct APIs

### Gemini
- Free tier available with quota limits
- Models: `gemini-pro` (text), `gemini-pro-vision` (multimodal)
- API key from: https://makersuite.google.com/app/apikey

### OpenAI
- Direct API access
- Models: `gpt-4o-mini`, `gpt-4o`, `gpt-4-turbo`
- API key from: https://platform.openai.com/api-keys

### Anthropic
- Claude models
- Models: `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229`
- API key from: https://console.anthropic.com/

### Local
- Requires local server (e.g., Ollama)
- No API key needed
- Set `VITE_LLM_BASE_URL` to your local endpoint

---

## Troubleshooting

**Variables not working?**
- Make sure file is named `.env.local` (not `.env`)
- Check variable names start with `VITE_`
- Restart dev server after changes
- Check browser console for errors

**API errors?**
- Verify API key is correct
- Check provider name matches exactly
- Ensure you have credits/quota
- Review error messages in browser console

