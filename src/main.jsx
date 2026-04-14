import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ fontFamily: "monospace", padding: 32, background: "#0f0e0c", color: "#f0ece4", minHeight: "100vh" }}>
          <h2 style={{ color: "#e74c3c", marginBottom: 16 }}>Something went wrong</h2>
          <pre style={{ background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: 8, padding: 16, whiteSpace: "pre-wrap", fontSize: 13, color: "#ffb3a8" }}>
            {this.state.error.toString()}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ marginTop: 24, padding: "10px 20px", background: "#e74c3c", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, cursor: "pointer" }}
          >
            Clear storage &amp; reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
