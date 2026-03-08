import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback as any;
      }

      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'white', padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>Something went wrong</h1>
          <p style={{ color: '#4b5563', maxWidth: '28rem', marginBottom: '1.5rem' }}>
            {this.state.error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
          </p>
          <button
            onClick={this.handleReset}
            style={{ padding: '0.5rem 1.5rem', backgroundColor: '#0f5c82', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 500 }}
          >
            Try Again
          </button>
        </div>
      ) as any;
    }

    return this.props.children as any;
  }
}

export default ErrorBoundary;
