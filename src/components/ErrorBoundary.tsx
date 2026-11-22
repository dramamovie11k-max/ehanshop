import { Component, ReactNode } from "react";

interface Props { children: ReactNode }
interface State { error: Error | null }

/** পেজ ক্র্যাশ করলে সাদা স্ক্রিনের বদলে বার্তা দেখাবে */
class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="max-w-md w-full rounded-lg border border-border bg-card p-6 text-center space-y-4">
            <h1 className="text-xl font-bold text-foreground">কিছু একটা ভুল হয়েছে</h1>
            <p className="text-sm text-muted-foreground break-words">
              {this.state.error.message}
            </p>
            <button
              onClick={() => { this.setState({ error: null }); window.location.reload(); }}
              className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2 text-primary-foreground hover:opacity-90"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
