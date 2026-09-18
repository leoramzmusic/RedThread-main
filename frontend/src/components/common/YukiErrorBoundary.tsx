import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import KawaiiCat from './KawaiiCat';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class YukiErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('YukiErrorBoundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#0a0a0f',
            p: 3,
          }}
        >
          <Paper
            elevation={8}
            sx={{
              maxWidth: 440,
              width: '100%',
              borderRadius: 4,
              overflow: 'hidden',
              bgcolor: 'rgba(29,29,31,0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Box sx={{ p: 5, textAlign: 'center' }}>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                <KawaiiCat state="error" moduleColor="#EF4444" size={110} interactive />
              </Box>

              <Typography
                variant="h5"
                sx={{ fontWeight: 800, color: '#fff', mb: 1 }}
              >
                ¡Ups! Algo salió mal
              </Typography>

              <Typography
                variant="body2"
                sx={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, mb: 1 }}
              >
                Yuki se tropieza con un hilo roto. No te preocupes, no es tu culpa.
              </Typography>

              {this.state.error && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255,255,255,0.3)',
                    fontFamily: 'monospace',
                    display: 'block',
                    mb: 3,
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'rgba(0,0,0,0.3)',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {this.state.error.message}
                </Typography>
              )}

              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={this.handleReset}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    borderColor: 'rgba(255,255,255,0.2)',
                    color: 'rgba(255,255,255,0.7)',
                    '&:hover': {
                      borderColor: 'rgba(255,255,255,0.4)',
                      bgcolor: 'rgba(255,255,255,0.05)',
                    },
                  }}
                >
                  Reintentar
                </Button>
                <Button
                  variant="contained"
                  onClick={this.handleGoHome}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    bgcolor: '#E63946',
                    '&:hover': { bgcolor: '#FF6B6B' },
                  }}
                >
                  Ir al inicio
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}