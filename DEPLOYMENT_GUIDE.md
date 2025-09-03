# BilbyAI - Deployment Guide

Complete guide for deploying the AgedCare Phone System Copilot to Vercel with Australian compliance considerations.

## 🚀 Vercel Deployment

### Prerequisites
- GitHub repository with latest code
- Vercel account with Australian region access
- Environment variables configured

### Quick Deployment
1. **Connect to Vercel**
   ```bash
   npx vercel --prod
   ```
   
2. **Or via Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Import from GitHub: `WaffleHouseIndex/BilbyAI`
   - Configure project settings

### Regional Configuration
The project is pre-configured for Australian deployment:
- **Region**: `syd1` (Sydney, Australia)
- **Data Residency**: Australian data centers
- **Compliance**: Healthcare-grade security headers

## 🔧 Environment Variables

### Required for Production

#### Twilio Configuration
```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_API_KEY=your_api_key
TWILIO_API_SECRET=your_api_secret
TWILIO_TWIML_APP_SID=your_app_sid
TWILIO_PHONE_NUMBER=+61xxxxxxxxx
```

#### Azure Speech Services (Australian English)
```bash
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=australiaeast
```

#### Database (Supabase)
```bash
DATABASE_URL=your_supabase_db_url
DIRECT_URL=your_supabase_direct_url
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### Authentication (Auth0)
```bash
AUTH0_SECRET=your_32_char_secret
AUTH0_BASE_URL=https://your-domain.vercel.app
AUTH0_ISSUER_BASE_URL=https://your-domain.au.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
```

#### AI Services
```bash
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

#### Security
```bash
ENCRYPTION_KEY=your_32_char_encryption_key
NODE_ENV=production
```

### Setting Environment Variables in Vercel

#### Via Dashboard
1. Go to Project Settings → Environment Variables
2. Add each variable with appropriate environment (Production/Preview/Development)
3. Ensure sensitive keys are only in Production

#### Via CLI
```bash
vercel env add TWILIO_ACCOUNT_SID production
vercel env add AZURE_SPEECH_KEY production
# ... repeat for all variables
```

## 🏗️ Build Configuration

### Vercel Configuration (`vercel.json`)
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "regions": ["syd1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ]
}
```

### Build Process
- **Framework**: Next.js 15.5.2 with Turbopack
- **Build Time**: ~2-3 minutes
- **Bundle Size**: Optimized with tree-shaking
- **Static Generation**: App Router with Server Components

## 🌏 Australian Compliance

### Data Residency
- **Primary Region**: Sydney (`syd1`)
- **Backup Region**: Australia Southeast (if needed)
- **Data Processing**: Remains within Australian borders

### Privacy & Security
- **Headers**: Security headers for healthcare compliance
- **Encryption**: TLS 1.3 in transit, AES-256 at rest
- **Access Logs**: Australian timezone logging
- **Consent Management**: Built-in "Do Not Record" features

### Healthcare Compliance
- **Data Classification**: Health information handling
- **Audit Trails**: Immutable access logs
- **User Authentication**: Role-based access control
- **Session Management**: Secure, time-limited sessions

## 📊 Performance Optimization

### Core Web Vitals Targets
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Optimization Features
- **Turbopack**: Fast development and build times
- **Server Components**: Reduced client bundle size
- **Image Optimization**: Automatic WebP conversion
- **Font Optimization**: Geist font with display swap

## 🔍 Monitoring & Observability

### Vercel Analytics
```javascript
// Automatically enabled for production
// View metrics at vercel.com/analytics
```

### Error Tracking
- **Built-in**: Vercel error monitoring
- **Custom**: Add Sentry for detailed error tracking

### Performance Monitoring
- **Core Web Vitals**: Automatic tracking
- **Real User Monitoring**: Built-in Vercel analytics
- **Custom Metrics**: Add application-specific metrics

## 🔐 Security Considerations

### Domain & SSL
- **Custom Domain**: Configure for production use
- **SSL Certificate**: Automatic Let's Encrypt
- **Security Headers**: Pre-configured in vercel.json

### API Security
- **Rate Limiting**: Implement for production
- **CORS**: Configure for specific origins
- **API Keys**: Secure storage in environment variables

### Australian Privacy Laws
- **Privacy Act 1988**: Data handling compliance
- **Aged Care Act 2017**: Sector-specific requirements
- **Notifiable Data Breaches**: Incident response planning

## 🚨 Pre-Deployment Checklist

### Technical Requirements
- [ ] All environment variables configured
- [ ] Build passes without errors
- [ ] TypeScript compilation successful
- [ ] No console errors in production build
- [ ] Responsive design tested

### Compliance Requirements
- [ ] Australian region deployment confirmed
- [ ] Security headers validated
- [ ] Privacy controls tested
- [ ] Audit logging functional
- [ ] Data residency verified

### User Experience
- [ ] Dashboard loads correctly
- [ ] All 3 panels functional
- [ ] Mock data displays properly
- [ ] Mobile responsiveness confirmed
- [ ] Accessibility standards met

## 📞 Production Support

### Health Checks
```bash
# Application health
curl https://your-domain.vercel.app/api/health

# Database connectivity  
curl https://your-domain.vercel.app/api/db/health
```

### Troubleshooting
1. **Build Failures**: Check environment variables
2. **Runtime Errors**: Review Vercel function logs
3. **Performance Issues**: Analyze Core Web Vitals
4. **API Errors**: Verify external service connectivity

## 🔄 CI/CD Pipeline

### Automatic Deployment
- **Main Branch**: Deploys to production
- **Feature Branches**: Preview deployments
- **Pull Requests**: Automatic preview builds

### Quality Gates
- **TypeScript**: Must compile without errors
- **ESLint**: Must pass linting checks
- **Build**: Must complete successfully
- **Preview**: Must be manually tested

## 📈 Scaling Considerations

### Current Capacity
- **Concurrent Users**: 100+ coordinators
- **Database**: Supabase Pro tier recommended
- **API Calls**: Monitor Twilio/Azure usage
- **Storage**: Scalable with usage

### Future Scaling
- **Edge Functions**: For low-latency responses
- **CDN**: Global content delivery
- **Database Sharding**: If high volume
- **Microservices**: Service decomposition

This deployment guide ensures the BilbyAI AgedCare Phone System Copilot is production-ready with Australian compliance from day one.