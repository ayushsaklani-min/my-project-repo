# Security Guidelines

## Environment Variables
- Never commit `.env` files to version control
- Use `.env.example` as a template for required environment variables
- Store sensitive data like API keys in environment variables only

## API Key Security
- Your Google AI API key is now stored in `.env` file
- Add your actual API key to `.env` file: `REACT_APP_GOOGLE_AI_API_KEY=your_actual_key`
- The `.env` file is already added to `.gitignore` to prevent accidental commits

## Known Vulnerabilities
The remaining npm audit issues are related to `react-scripts` dependencies. These are:
- `nth-check`: RegEx complexity issue (low risk in client-side apps)
- `postcss`: Line parsing issue (low risk)
- `webpack-dev-server`: Development-only vulnerabilities (not in production builds)

## Recommendations
1. Consider migrating to Vite or Next.js for better security and performance
2. Regularly update dependencies with `npm audit fix`
3. Use environment-specific builds for production
4. Implement Content Security Policy (CSP) headers
5. Validate all user inputs before processing

## Production Deployment
- Use `npm run build` for production builds
- Serve built files through a secure web server
- Enable HTTPS in production
- Set appropriate security headers