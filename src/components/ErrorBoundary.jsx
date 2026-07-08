import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
      expanded: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // Automatically report client-side crash telemetry to /api/debug-log
    fetch('/api/debug-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'REACT_ERROR',
        error: error.toString(),
        stack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      })
    }).catch(err => {
      console.error('[ErrorBoundary] Telemetry reporting failed:', err);
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  toggleExpand = () => {
    this.setState(prev => ({ expanded: !prev }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#09090b',
          color: '#fafafa',
          fontFamily: "'Outfit', sans-serif",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          boxSizing: 'border-box'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            background: 'rgba(20, 20, 22, 0.65)',
            backdropFilter: 'blur(20px)',
            webkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '2.5rem',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            animation: 'fadeIn 0.5s ease-out'
          }}>
            {/* Warning Icon with Terracotta/Electric Gradient */}
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(224, 90, 71, 0.15) 0%, rgba(74, 131, 237, 0.15) 100%)',
              border: '1px solid rgba(224, 90, 71, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto'
            }}>
              <span className="material-symbols-outlined" style={{
                fontSize: '2.2rem',
                background: 'linear-gradient(135deg, #E05A47 0%, #4A83ED 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                running_with_errors
              </span>
            </div>

            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.8rem',
              fontWeight: 700,
              marginBottom: '0.75rem',
              background: 'linear-gradient(135deg, #fafafa 0%, #a1a1aa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Portal Interrupted
            </h1>

            <p style={{
              color: '#a1a1aa',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              marginBottom: '1.75rem'
            }}>
              The application encountered an unexpected runtime error. A diagnostics report has been automatically sent to the engineering telemetry stream.
            </p>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              marginBottom: '2rem'
            }}>
              <button 
                onClick={this.handleReload}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #E05A47 0%, #d04b38 100%)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  fontFamily: "'Space Grotesk', sans-serif",
                  boxShadow: '0 4px 12px rgba(224, 90, 71, 0.25)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(224, 90, 71, 0.35)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(224, 90, 71, 0.25)';
                }}
              >
                Reload Portal
              </button>
            </div>

            {/* Collapsible Error Log */}
            {this.state.error && (
              <div style={{
                textAlign: 'left',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                paddingTop: '1.25rem'
              }}>
                <button
                  onClick={this.toggleExpand}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4A83ED',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0',
                    fontFamily: "'Space Grotesk', sans-serif"
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
                    {this.state.expanded ? 'expand_less' : 'expand_more'}
                  </span>
                  {this.state.expanded ? 'Hide Diagnostics' : 'Show Diagnostics'}
                </button>

                {this.state.expanded && (
                  <div style={{
                    marginTop: '0.75rem',
                    background: '#09090b',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '1rem',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    <div style={{
                      color: '#E05A47',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      marginBottom: '0.5rem',
                      wordBreak: 'break-word'
                    }}>
                      {this.state.error.toString()}
                    </div>
                    {this.state.errorInfo && (
                      <pre style={{
                        color: '#a1a1aa',
                        fontFamily: 'monospace',
                        fontSize: '0.72rem',
                        lineHeight: '1.5',
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all'
                      }}>
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
