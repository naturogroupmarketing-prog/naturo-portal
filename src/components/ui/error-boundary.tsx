"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, showDetails: false });
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[50vh] px-4">
          <Card className="max-w-md w-full hover:translate-y-0 hover:shadow-[0_1px_2px_rgba(0,0,0,0.03),0_2px_8px_rgba(0,0,0,0.04)]">
            <CardContent className="flex flex-col items-center text-center gap-4 py-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10">
                <Icon
                  name="alert-triangle"
                  className="text-red-500"
                  size={24}
                />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-shark-900 dark:text-shark-100">
                  Something went wrong
                </h2>
                <p className="mt-1 text-sm text-shark-500 dark:text-shark-400">
                  An unexpected error occurred. Please try again.
                </p>
              </div>

              <div className="flex gap-3">
                <Button onClick={this.handleRetry} size="sm">
                  Try again
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={this.toggleDetails}
                >
                  <Icon
                    name={this.state.showDetails ? "chevron-up" : "chevron-down"}
                    size={14}
                    className="mr-1.5"
                  />
                  Show details
                </Button>
              </div>

              {this.state.showDetails && this.state.error && (
                <div className="w-full mt-2 rounded-xl bg-shark-50 dark:bg-shark-800 border border-shark-200 dark:border-shark-700 p-3 text-left">
                  <p className="text-xs font-mono text-red-600 dark:text-red-400 break-words whitespace-pre-wrap">
                    {this.state.error.message}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
