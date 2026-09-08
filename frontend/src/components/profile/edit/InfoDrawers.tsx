import { Box, Paper, Typography, Button, Container } from '@mui/material';

interface InfoDrawersProps {
  infoDrawerOpen: boolean;
  setInfoDrawerOpen: (open: boolean) => void;
  goalsInfoOpen: boolean;
  setGoalsInfoOpen: (open: boolean) => void;
  pronounsInfoOpen: boolean;
  setPronounsInfoOpen: (open: boolean) => void;
  isDragging: boolean;
  dragOffsetY: number;
  handleDragStart: (e: React.MouseEvent | React.TouchEvent) => void;
}

export default function InfoDrawers({
  infoDrawerOpen,
  setInfoDrawerOpen,
  goalsInfoOpen,
  setGoalsInfoOpen,
  pronounsInfoOpen,
  setPronounsInfoOpen,
  isDragging,
  dragOffsetY,
  handleDragStart
}: InfoDrawersProps) {
  return (
    <>
      {/* Safety Info Drawer (Custom Bottom Sheet with Drag) */}
      {infoDrawerOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1200,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            pointerEvents: 'none',
          }}
        >
          <Box
            sx={{
              width: '100%',
              maxWidth: 'md',
              display: 'flex',
              justifyContent: 'center',
              pl: { md: '260px', xs: 0 },
              boxSizing: 'border-box'
            }}
          >
            <Container maxWidth="md" sx={{ p: '0 !important', pointerEvents: 'auto' }}>
              <Paper
                elevation={24}
                sx={{
                  position: 'relative',
                  width: '100%',
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  borderRadius: '16px 16px 0 0',
                  p: 0,
                  pb: 4,
                  backgroundImage: 'none',
                  borderTop: 1,
                  borderColor: 'divider',
                  transform: 'translateY(' + dragOffsetY + 'px)',
                  transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  overflow: 'hidden',
                  cursor: isDragging ? 'grabbing' : 'auto',
                  animation: 'slideUp 0.3s ease-out',
                  '@keyframes slideUp': {
                    from: { transform: 'translateY(100%)' },
                    to: { transform: 'translateY(0)' }
                  }
                }}
              >
                <Box
                  onMouseDown={handleDragStart}
                  onTouchStart={handleDragStart}
                  sx={{
                    width: '100%',
                    height: 40,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'grab',
                    touchAction: 'none'
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 4,
                      bgcolor: 'action.disabled',
                      borderRadius: 2
                    }}
                  />
                </Box>

                <Box px={3} pb={2} textAlign="center">
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'text.primary', mb: 2 }}>
                    Consejos de Seguridad
                  </Typography>

                  <Box display="flex" gap={1} justifyContent="center" mb={2}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
                      ⚠️ Por tu seguridad, no incluyas nombres de usuario de redes sociales ni información de contacto directa en tu biografía.
                    </Typography>
                  </Box>

                  <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                    <span style={{ color: 'inherit' }}>Aprende más sobre nuestras </span>
                    <a
                      href="/community-rules"
                      target="_blank"
                      style={{ color: '#448AFF', textDecoration: 'underline', fontWeight: 'bold' }}
                    >
                      Reglas de la comunidad
                    </a>
                  </Typography>

                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => setInfoDrawerOpen(false)}
                    sx={{
                      maxWidth: 300,
                      fontWeight: 'bold',
                      textTransform: 'none',
                      borderRadius: 2,
                      py: 1.2
                    }}
                  >
                    Entendido
                  </Button>
                </Box>
              </Paper>
            </Container>
          </Box>
        </Box>
      )}

      {/* Goals Info Drawer */}
      {goalsInfoOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1200,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            pointerEvents: 'none',
          }}
        >
          <Box
            sx={{
              width: '100%',
              maxWidth: 'md',
              display: 'flex',
              justifyContent: 'center',
              pl: { md: '260px', xs: 0 },
              boxSizing: 'border-box'
            }}
          >
            <Container maxWidth="md" sx={{ p: '0 !important', pointerEvents: 'auto' }}>
              <Paper
                elevation={24}
                sx={{
                  position: 'relative',
                  width: '100%',
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  borderRadius: '16px 16px 0 0',
                  p: 0,
                  pb: 4,
                  backgroundImage: 'none',
                  borderTop: 1,
                  borderColor: 'divider',
                  transform: 'translateY(' + dragOffsetY + 'px)',
                  transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  overflow: 'hidden',
                  cursor: isDragging ? 'grabbing' : 'auto',
                  animation: 'slideUp 0.3s ease-out',
                  '@keyframes slideUp': {
                    from: { transform: 'translateY(100%)' },
                    to: { transform: 'translateY(0)' }
                  }
                }}
              >
                <Box
                  onMouseDown={handleDragStart}
                  onTouchStart={handleDragStart}
                  sx={{
                    width: '100%',
                    height: 40,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'grab',
                    touchAction: 'none'
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 4,
                      bgcolor: 'action.disabled',
                      borderRadius: 2
                    }}
                  />
                </Box>

                <Box px={3} pb={2} textAlign="center">
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'text.primary', mb: 2 }}>
                    Las emociones cambian
                  </Typography>

                  <Box display="flex" gap={1} justifyContent="center" mb={2}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
                      Te preguntaremos de vez en cuando en caso de que tu opinion haya cambiado. O si prefieres, actualiza tus objetivos en tu perfil.
                    </Typography>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => setGoalsInfoOpen(false)}
                    sx={{
                      borderRadius: 20,
                      py: 1.5,
                      maxWidth: 200,
                      mx: 'auto',
                      display: 'block'
                    }}
                  >
                    Entendido
                  </Button>
                </Box>
              </Paper>
            </Container>
          </Box>
        </Box>
      )}

      {/* Pronouns Info Drawer */}
      {pronounsInfoOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1300,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            pointerEvents: 'none',
          }}
        >
          <Box
            sx={{
              width: '100%',
              maxWidth: 'md',
              display: 'flex',
              justifyContent: 'center',
              pl: { md: '260px', xs: 0 },
              boxSizing: 'border-box'
            }}
          >
            <Container maxWidth="md" sx={{ p: '0 !important', pointerEvents: 'auto' }}>
              <Paper
                elevation={24}
                sx={{
                  position: 'relative',
                  width: '100%',
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  borderRadius: '16px 16px 0 0',
                  p: 0,
                  pb: 4,
                  backgroundImage: 'none',
                  borderTop: 1,
                  borderColor: 'divider',
                  transform: 'translateY(' + (isDragging ? dragOffsetY : 0) + 'px)',
                  transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  overflow: 'hidden',
                  cursor: isDragging ? 'grabbing' : 'auto',
                  animation: 'slideUp 0.3s ease-out',
                  '@keyframes slideUp': {
                    from: { transform: 'translateY(100%)' },
                    to: { transform: 'translateY(0)' }
                  }
                }}
              >
                <Box
                  onMouseDown={handleDragStart}
                  onTouchStart={handleDragStart}
                  sx={{
                    width: '100%',
                    height: 40,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'grab',
                    touchAction: 'none'
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 4,
                      bgcolor: 'action.disabled',
                      borderRadius: 2
                    }}
                  />
                </Box>

                <Box px={3} pb={2} textAlign="center">
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'text.primary', mb: 2 }}>
                    ¿Por qué son importantes los pronombres?
                  </Typography>

                  <Box display="flex" gap={1} justifyContent="center" mb={2} flexDirection="column">
                    <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
                      Los pronombres permiten a nuestrxs usuarixs darle mas profundidad y detalle a su perfil.
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto', mt: 1 }}>
                      Los pronombres son parte importante de una persona y nos indican cómo referirnos correctamente a ella.
                    </Typography>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => setPronounsInfoOpen(false)}
                    sx={{
                      maxWidth: 300,
                      fontWeight: 'bold',
                      textTransform: 'none',
                      borderRadius: 2,
                      py: 1.2
                    }}
                  >
                    De acuerdo
                  </Button>
                </Box>
              </Paper>
            </Container>
          </Box>
        </Box>
      )}
    </>
  );
}
