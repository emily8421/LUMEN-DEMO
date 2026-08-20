import { Component, type ErrorInfo, type ReactNode } from 'react';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled React render error', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="error-boundary" role="alert" aria-live="assertive" aria-atomic="true">
          <section className="error-boundary__panel">
            <h1>页面暂时无法显示</h1>
            <p>请重新加载页面后再试。</p>
            <button type="button" onClick={this.handleReload}>重新加载</button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
