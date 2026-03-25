import React, { Component } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const styles = {
  wrapper: {
    height: "100vh", background: "#f5f0eb", display: "flex",
    alignItems: "center", justifyContent: "center", fontFamily: "Segoe UI, sans-serif",
    padding: "20px", boxSizing: "border-box",
  },
  box: {
    background: "#fff", border: "1.5px solid #e31e24", borderRadius: 12,
    padding: "20px 24px", maxWidth: 400, width: "100%",
  },
  title: { color: "#e31e24", fontSize: 16, fontWeight: 700, marginBottom: 12 },
  msg: { color: "#4E342E", fontSize: 13, fontWeight: 600, marginBottom: 12 },
  stack: {
    background: "#f5f0eb", borderRadius: 8, padding: 12,
    fontSize: 11, overflow: "auto", maxHeight: 200, whiteSpace: "pre-wrap",
    fontFamily: "monospace", color: "#4E342E",
  },
};

// Error boundary — shows errors inline without breaking React tree
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null, info: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { this.setState({ error, info }); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.wrapper}>
          <div style={styles.box}>
            <div style={styles.title}>⚠ ProtoBoard Error</div>
            <div style={styles.msg}>{String(this.state.error?.message || this.state.error)}</div>
            <div style={styles.stack}>{this.state.info?.componentStack || ""}</div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = document.getElementById("root");
ReactDOM.createRoot(root).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
