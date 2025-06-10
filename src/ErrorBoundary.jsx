import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
    console.log('ErrorBoundary constructed');
  }

  static getDerivedStateFromError(error) {
    console.error('ErrorBoundary caught error in getDerivedStateFromError:', error);
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error in componentDidCatch:", error);
    console.error("Component stack:", errorInfo.componentStack);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-500 text-white p-4 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold">React Error Caught</h2>
          <p className="mt-2 font-bold">Error Message:</p>
          <p className="mt-1">{this.state.error && this.state.error.toString()}</p>
          
          <p className="mt-4 font-bold">Component Stack:</p>
          <div className="mt-1 text-xs overflow-auto max-h-48 bg-red-700 p-2 rounded">
            <pre>
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </div>
          
          <p className="mt-4">
            The error above is preventing your app from rendering. Check the console for more details.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
