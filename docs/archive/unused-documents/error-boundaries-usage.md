# Error Boundaries Usage Guide

## 🎯 **Quick Start - Test Error Boundaries**

### **1. Test Route-Level Error Boundary**
```bash
# Visit this page - it will immediately trigger the route error boundary
http://localhost:3000/test-error-simple
```

### **2. Test Interactive Error Boundary**
```bash
# Visit this page for comprehensive error testing
http://localhost:3000/test-error

# Test different error types:
1. Select "Synchronous Error" → Click "Trigger Error"
2. Select "Asynchronous Error" → Click "Trigger Error"
3. Select "Component Error" → Click "Trigger Error"
4. Select "API Error" → Click "Trigger Error"
```

### **3. Test Global Error Boundary**
```bash
# Trigger a global error by modifying any component
# The global error boundary will catch unhandled errors
```

## 🛠️ **How Error Boundaries Work**

### **Route-Level Error Boundary (`src/app/error.tsx`)**
- **Catches:** Errors in individual pages/routes
- **Displays:** User-friendly error UI with recovery options
- **Scope:** Page-level error handling

### **Global Error Boundary (`src/app/global-error.tsx`)**
- **Catches:** Errors not caught by route boundaries
- **Displays:** Root-level error fallback
- **Scope:** Application-level error handling

## 📊 **What Gets Logged**

### **Console Logs**
```javascript
// Structured JSON logs
{
  "timestamp": "2025-09-03T19:22:07.958Z",
  "level": "error",
  "message": "Route error boundary triggered",
  "metadata": {
    "component": "ErrorBoundary",
    "operation": "route_error",
    "url": "http://localhost:3000/test-error",
    "errorMessage": "This is a test synchronous error",
    "errorName": "Error",
    "error": {},
    "environment": "development"
  }
}
```

### **Console Error Display**
```javascript
🚨 Error Boundary Caught Error: – {
  name: "Error",
  message: "This is a test synchronous error from the component",
  stack: "TestErrorPage.useEffect@...",
  digest: undefined,
  url: "http://localhost:3000/test-error"
}
```

## 🔧 **Error Boundary Features**

### **✅ Automatic Error Catching**
- Synchronous errors during render
- Asynchronous errors during render
- Component rendering errors
- API errors during render

### **✅ User-Friendly Display**
- Professional error UI
- Development mode: Full error details
- Production mode: Generic error message
- Recovery options

### **✅ Comprehensive Logging**
- Structured JSON logs
- Request ID correlation
- Error categorization
- Stack trace preservation

### **✅ Recovery Options**
- "Try Again" button to reset
- "Go to Dashboard" navigation
- Page refresh capability

## 🚀 **Production Usage**

### **Error Boundary in Production**
```javascript
// In production, errors show:
"Something went wrong!"
"Please try again or contact support"

// In development, errors show:
- Full error details
- Stack traces
- Component information
- URL and environment data
```

### **Error Recovery Patterns**
```javascript
// Users can:
1. Click "Try Again" to reset the page
2. Navigate to dashboard
3. Refresh the page
4. Contact support with error details
```

## 📈 **Monitoring & Analytics**

### **Error Tracking**
- All errors are logged with structured data
- Request correlation IDs for tracing
- Component and operation metadata
- Environment and URL information

### **Error Categories**
```javascript
// Error types tracked:
- Synchronous rendering errors
- Asynchronous operation errors
- Component lifecycle errors
- API communication errors
- Network connectivity errors
```

## 🛠️ **Developer Experience**

### **Development Mode Features**
```javascript
// Enhanced debugging:
- Full error stack traces
- Component hierarchy
- Error timing and context
- Request correlation IDs
```

### **Testing Error Boundaries**
```javascript
// Use the test pages:
- /test-error-simple (immediate error)
- /test-error (interactive testing)
```

## 🎯 **Best Practices**

### **✅ Do's**
- ✅ Let errors bubble up to boundaries
- ✅ Use structured logging
- ✅ Provide user-friendly messages
- ✅ Include recovery options
- ✅ Test error scenarios

### **❌ Don'ts**
- ❌ Catch errors locally (let boundaries handle them)
- ❌ Use console.error (use structured logger)
- ❌ Hide error details from users
- ❌ Remove recovery options
- ❌ Skip error testing

## 📚 **Integration Examples**

### **Error Boundary in Layout**
```typescript
// Automatically wraps all pages in the layout
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children} {/* Error boundary catches errors here */}
      </body>
    </html>
  );
}
```

### **Manual Error Boundary Usage**
```typescript
import { ErrorBoundary } from 'react-error-boundary';

function MyComponent() {
  return (
    <ErrorBoundary fallback={<div>Something went wrong!</div>}>
      <RiskyComponent />
    </ErrorBoundary>
  );
}
```

## 🚀 **Next Steps**

1. **Test extensively** with different error types
2. **Monitor logs** for real-world error patterns
3. **Customize error messages** for specific use cases
4. **Add error reporting** (Sentry, LogRocket, etc.)
5. **Document error patterns** for your team

---

**🎉 Your error boundaries are production-ready and fully functional!**

**Test them now:**
- **Simple test:** `http://localhost:3000/test-error-simple`
- **Interactive test:** `http://localhost:3000/test-error`
