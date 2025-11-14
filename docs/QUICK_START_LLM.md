# Quick Start: OpenRouter & Gemini Setup

Since you have API keys for OpenRouter and Gemini, here's how to configure them:

## Option 1: OpenRouter (Recommended - Access to 100+ Models)

1. Create or update `.env.local` in the project root:

```env
# Supabase Configuration (if you have it)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenRouter Configuration
VITE_LLM_PROVIDER=openrouter
VITE_LLM_API_KEY=your-openrouter-api-key-here
VITE_LLM_MODEL=openai/gpt-4o-mini  # You can change this to any model on OpenRouter
```

2. **Popular OpenRouter Models** (you can switch anytime):
   - `openai/gpt-4o-mini` - Most cost-effective
   - `openai/gpt-4o` - More capable
   - `anthropic/claude-3.5-sonnet` - Claude via OpenRouter
   - `google/gemini-pro` - Gemini via OpenRouter
   - `meta-llama/llama-3-70b-instruct` - Open source

3. Restart your dev server:
```bash
npm run dev
```

## Option 2: Google Gemini (Direct)

1. Create or update `.env.local`:

```env
# Supabase Configuration (if you have it)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Gemini Configuration
VITE_LLM_PROVIDER=gemini
VITE_LLM_API_KEY=your-gemini-api-key-here
VITE_LLM_MODEL=gemini-pro  # Optional, defaults to gemini-pro
```

2. Restart your dev server:
```bash
npm run dev
```

## Testing Your Setup

1. **Test HakiBot**: 
   - Open the app at http://localhost:5173
   - Click the HakiBot icon (bottom-right corner)
   - Ask a legal question like "What are tenant rights in Kenya?"

2. **Test HakiDraft**:
   - Navigate to HakiDraft in the sidebar
   - Fill in document details
   - Click "Generate Document"

3. **Test HakiLens**:
   - Navigate to HakiLens
   - Try the "AI Assistant" tab
   - Ask a legal research question

## Troubleshooting

**If you see API errors:**
- Make sure your API key is correct
- Check that you have credits/quota available
- Verify the provider name matches exactly: `openrouter` or `gemini`
- Restart the dev server after changing `.env.local`

**For OpenRouter:**
- Make sure you have credits in your account
- Check model availability at https://openrouter.ai/models

**For Gemini:**
- Verify your API key is active at https://makersuite.google.com/app/apikey
- Check quota limits in Google Cloud Console

## Switching Between Providers

You can easily switch providers by changing `VITE_LLM_PROVIDER` in `.env.local`:
- `openrouter` - Use OpenRouter
- `gemini` - Use Google Gemini directly
- `openai` - Use OpenAI directly
- `anthropic` - Use Anthropic directly
- `local` - Use local models (Ollama)

Just change the value and restart the server!

---

**Note**: Your `.env.local` file should never be committed to git (it's already in `.gitignore`).

