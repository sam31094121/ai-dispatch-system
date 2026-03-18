import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  errorCount: number;
}

export class CoreErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorCount: 0
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true, errorCount: 1 };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[DataCore Error] ${this.props.name || 'Component'} CRASHED:`, error, errorInfo);
    
    // ⬇️ AI 自動加強：3.8 秒後組件自動觸發恢復 Reset
    setTimeout(() => {
      if (this.state.hasError) {
        this.handleRecover();
      }
    }, 3800);
  }

  private handleRecover = () => {
    this.setState({ hasError: false, errorCount: 0 });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="glass metalCard depthCard" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '20px', borderRadius: 16, border: '1px solid rgba(255, 77, 106, 0.4)',
          background: 'linear-gradient(145deg, rgba(20, 0, 5, 0.85), rgba(10, 0, 2, 0.95))',
          height: '100%', width: '100%', minHeight: '200px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.85), 0 0 30px rgba(255, 77, 106, 0.25)',
          transformStyle: 'preserve-3d', position: 'relative', overflow: 'hidden'
        }}>
          {/* 霓虹掃描 */}
          <div className="scanLine" style={{background: 'linear-gradient(to bottom, transparent, rgba(255,77,106,0.3), transparent)', height: '20%', opacity: 0.8}} />
          
          <div className="animate-pulse" style={{
            display: 'flex', alignItems: 'center', gap: 8, color: '#ff4d6a', 
            fontWeight: 900, fontSize: '13px', letterSpacing: '2px', marginBottom: 12,
            textShadow: '0 0 15px rgba(255,77,106,0.7)'
          }}>
            <span style={{width: 8, height: 8, borderRadius: '50%', background: '#ff4d6a', boxShadow: '0 0 12px #ff4d6a'}} />
            AI 核心自癒程序中 (AUTO-REPAIRING)
          </div>
          <p style={{fontSize: '11px', color: 'rgba(255,77,106,0.6)', marginBottom: 18, fontFamily: 'monospace', letterSpacing: '0.5px'}}>
            {this.props.name ? `${this.props.name.toUpperCase()}_` : ''}NODE_CRASH_DETECTED
          </p>
          
          <button 
            onClick={this.handleRecover}
            className="glass"
            style={{
              padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(255,77,106,0.5)',
              background: 'rgba(255,77,106,0.12)', color: '#ffffff', fontSize: '11px',
              fontWeight: 900, letterSpacing: '1px', cursor: 'pointer',
              boxShadow: '0 0 20px rgba(255,77,106,0.35)', transition: 'all 0.2s',
              textShadow: '0 0 8px rgba(0,0,0,0.8)'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,77,106,0.25)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,77,106,0.12)'}
          >
            手動強制重置
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
