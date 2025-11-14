# Troubleshooting Guide

Common issues and solutions for HakiChain LLM integration.

## "The model is overloaded" Error

### What it means
The API provider (OpenRouter, OpenAI, etc.) is experiencing high traffic and cannot process your request right now.

### Solutions

#### 1. **Wait and Retry** (Automatic)
The system now automatically retries overloaded requests up to 2 times with exponential backoff. Just wait a few seconds and try again.

#### 2. **Switch to a Different Model**
Some models are less popular and have shorter queues. Update your `.env.local`:

**For OpenRouter:**
```env
# Try a less popular model
VITE_LLM_MODEL=anthropic/claude-3-haiku-20240307
# or
VITE_LLM_MODEL=meta-llama/llama-3-8b-instruct
# or
VITE_LLM_MODEL=google/gemini-pro
```

**For Direct Providers:**
```env
# Switch from GPT-4o to GPT-4o-mini (usually less overloaded)
VITE_LLM_MODEL=gpt-4o-mini
```

#### 3. **Check OpenRouter Status**
- Visit https://openrouter.ai/models to see model availability
- Check https://status.openrouter.ai/ for service status

#### 4. **Use a Different Provider**
If OpenRouter is consistently overloaded, switch to a direct provider:

```env
# Switch to Gemini (often less overloaded)
VITE_LLM_PROVIDER=gemini
VITE_LLM_API_KEY=your-gemini-key
VITE_LLM_MODEL=gemini-pro
```

Or use OpenAI directly:
```env
VITE_LLM_PROVIDER=openai
VITE_LLM_API_KEY=your-openai-key
VITE_LLM_MODEL=gpt-4o-mini
```

---

## Rate Limit Errors

### Symptoms
- "Rate limit exceeded"
- "429 Too Many Requests"
- "Quota exceeded"

### Solutions

1. **Wait Before Retrying**
   - Wait 1-2 minutes before trying again
   - The system will automatically retry, but manual retries should wait longer

2. **Check Your Account Limits**
   - **OpenRouter**: Check credits at https://openrouter.ai/credits
   - **OpenAI**: Check usage at https://platform.openai.com/usage
   - **Gemini**: Check quota at https://console.cloud.google.com/

3. **Reduce Request Frequency**
   - Don't send multiple requests rapidly
   - Wait between document generations

4. **Upgrade Your Plan**
   - Add more credits to OpenRouter
   - Upgrade your OpenAI/Gemini tier

---

## API Key Errors

### "API key is required"
**Solution**: Make sure `VITE_LLM_API_KEY` is set in `.env.local`

### "Invalid API key" or "401 Unauthorized"
**Solutions**:
1. Verify your API key is correct (no extra spaces)
2. Check if the key has expired
3. Generate a new API key from your provider dashboard
4. Make sure you're using the right key for the right provider

---

## Model Not Found Errors

### "Model not found" or "Invalid model"

**For OpenRouter:**
- Check model name format: `provider/model-name` (e.g., `openai/gpt-4o-mini`)
- Browse available models at https://openrouter.ai/models
- Some models may be temporarily unavailable

**For Direct Providers:**
- Verify model name is correct (case-sensitive)
- Check provider documentation for available models
- Some models may require special access

---

## Connection Errors

### "Failed to connect" or Network Errors

**Solutions**:
1. Check your internet connection
2. Verify the API endpoint is correct
3. Check if your firewall is blocking requests
4. For local models, ensure the server is running:
   ```bash
   # For Ollama
   ollama serve
   ```

---

## Slow Responses

### Requests taking too long

**Solutions**:
1. **Use a faster model**:
   ```env
   VITE_LLM_MODEL=gpt-4o-mini  # Faster than gpt-4o
   ```

2. **Reduce max tokens**:
   ```env
   VITE_LLM_MAX_TOKENS=1000  # Shorter responses = faster
   ```

3. **Check provider status** - High load = slower responses

4. **Switch providers** - Some providers are faster than others

---

## Environment Variable Issues

### Variables not working

**Checklist**:
- ✅ File is named `.env.local` (not `.env`)
- ✅ File is in project root (same level as `package.json`)
- ✅ Variables start with `VITE_` prefix
- ✅ No spaces around `=` sign
- ✅ Restarted dev server after changes
- ✅ No quotes around values (unless needed)

**Example of correct format:**
```env
VITE_LLM_PROVIDER=openrouter
VITE_LLM_API_KEY=sk-or-v1-abc123
VITE_LLM_MODEL=openai/gpt-4o-mini
```

**Example of incorrect format:**
```env
VITE_LLM_PROVIDER = openrouter  # ❌ Spaces around =
VITE_LLM_API_KEY="sk-or-v1-abc123"  # ❌ Unnecessary quotes
LLM_PROVIDER=openrouter  # ❌ Missing VITE_ prefix
```

---

## Provider-Specific Issues

### OpenRouter
- **No credits**: Add credits at https://openrouter.ai/credits
- **Model unavailable**: Try a different model or wait
- **Slow responses**: Popular models have longer queues

### Gemini
- **Quota exceeded**: Check Google Cloud Console
- **API key invalid**: Regenerate at https://makersuite.google.com/app/apikey
- **Free tier limits**: Upgrade to paid tier for higher limits

### OpenAI
- **Rate limits**: Check your tier limits
- **Invalid key**: Regenerate at https://platform.openai.com/api-keys
- **Billing issues**: Ensure payment method is valid

---

## Still Having Issues?

1. **Check Browser Console**
   - Open DevTools (F12)
   - Look for detailed error messages
   - Check Network tab for API responses

2. **Verify Configuration**
   - Double-check `.env.local` file
   - Ensure provider name matches exactly: `openrouter`, `gemini`, `openai`, etc.

3. **Test with Simple Request**
   - Try HakiBot with a simple question first
   - If that works, the issue might be with longer requests

4. **Check Provider Status**
   - OpenRouter: https://status.openrouter.ai/
   - OpenAI: https://status.openai.com/
   - Google Cloud: https://status.cloud.google.com/

5. **Review Logs**
   - Check browser console for detailed errors
   - Look for specific error codes or messages

---

## Quick Fixes Summary

| Error | Quick Fix |
|-------|-----------|
| Model overloaded | Wait 30 seconds, try again, or switch model |
| Rate limit | Wait 1-2 minutes, check account credits |
| Invalid API key | Verify key, regenerate if needed |
| Model not found | Check model name, try different model |
| Connection failed | Check internet, verify endpoint |
| Slow responses | Use faster model, reduce max tokens |

---

**Remember**: Most temporary errors (overload, rate limits) will resolve automatically with retries. For persistent issues, check your account status and provider documentation.

