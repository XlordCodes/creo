import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  name: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SimpleErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 m-10 bg-red-900/20 border border-red-500 rounded-xl text-red-500 overflow-auto">
          <h1 className="text-xl font-bold mb-4">Error in {this.props.name}</h1>
          <pre className="text-sm whitespace-pre-wrap">{this.state.error?.message}</pre>
          <pre className="text-xs whitespace-pre-wrap mt-4">{this.state.error?.stack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
