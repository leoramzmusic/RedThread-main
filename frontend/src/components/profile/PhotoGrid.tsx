import { useState } from 'react';
import {
  Box,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  KeyboardArrowDown,
  KeyboardArrowUp,
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import apiClient from '../../services/api';

interface PhotoGridProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  editable?: boolean;
}

const MAX_PHOTOS = 9;

// Helper for image URLs
const getImageUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) {
    return path.replace('localhost:3000', 'localhost:8000');
  }
  return `http://localhost:8000${path.startsWith('/') ? '' : '/'}${path}`;
};

// Sortable Photo Component
function SortablePhoto({ 
  id, 
  photo, 
  index, 
  editable, 
  onDelete 
}: { 
  id: string; 
  photo: string; 
  index: number; 
  editable: boolean; 
  onDelete: (photo: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Grid 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      item 
      xs={4} 
      sx={{
        minWidth: '33.33%',
        flexShrink: 0,
        cursor: editable ? 'grab' : 'default',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          paddingTop: '100%', // 1:1 aspect ratio
          border: '2px solid',
          borderColor: 'transparent',
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: 'background.paper',
          boxShadow: isDragging ? 3 : 1,
          '&:hover': editable
            ? {
                transform: 'scale(0.98)',
                opacity: 0.9,
              }
            : {},
        }}
      >
        <Box
          component="img"
          src={getImageUrl(photo)}
          alt={`Photo ${index + 1}`}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        {editable && (
          <IconButton
            size="small"
            // Prevent drag when clicking delete
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(photo);
            }}
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              bgcolor: 'rgba(0,0,0,0.6)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.8)',
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    </Grid>
  );
}

export default function PhotoGrid({ photos, onPhotosChange, editable = false }: PhotoGridProps) {
  const [uploading, setUploading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; photoUrl: string | null }>({
    open: false,
    photoUrl: null,
  });
  const [expanded, setExpanded] = useState(true); // Default to expanded for easier reordering
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require movement of 8px before drag starts to prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (photos.length >= MAX_PHOTOS) {
      alert(`Máximo ${MAX_PHOTOS} fotos permitidas`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/uploads/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onPhotosChange([...photos, response.data.photo_url]);
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      alert(error.response?.data?.detail || 'Error al subir la foto');
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleDeleteClick = (photoUrl: string) => {
    setDeleteDialog({ open: true, photoUrl });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.photoUrl) return;

    try {
      await apiClient.delete('/uploads/photo', {
        params: { photo_url: deleteDialog.photoUrl },
      });

      onPhotosChange(photos.filter((p) => p !== deleteDialog.photoUrl));
      setDeleteDialog({ open: false, photoUrl: null });
    } catch (error: any) {
      console.error('Error deleting photo:', error);
      alert(error.response?.data?.detail || 'Error al eliminar la foto');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (!editable) return;
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!editable) return;
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = photos.indexOf(active.id as string);
      const newIndex = photos.indexOf(over.id as string);
      
      const newPhotos = arrayMove(photos, oldIndex, newIndex);
      onPhotosChange(newPhotos);
      
      // Optional: Save order to backend immediately if needed
      // But usually we wait for the main "Save" button in ProfileEdit
    }

    setActiveId(null);
  };

  // Create array of 9 slots, but only map the existing photos for sortable
  // Empty slots are rendered separately at the end
  const emptySlotsCount = MAX_PHOTOS - photos.length;
  const emptySlots = Array.from({ length: emptySlotsCount }, (_, i) => i);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" color="text.secondary">
          Fotos ({photos.length}/{MAX_PHOTOS}) - Arrastra para reordenar
        </Typography>
        <IconButton size="small" onClick={() => setExpanded(!expanded)}>
          {expanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
        </IconButton>
      </Box>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Grid 
          container 
          spacing={2}
          sx={!expanded ? {
            flexWrap: 'nowrap',
            overflowX: 'auto',
            pb: 1,
            '&::-webkit-scrollbar': { height: 6 },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3 },
          } : {}}
        >
          <SortableContext 
            items={photos} 
            strategy={rectSortingStrategy}
          >
            {photos.map((photo, index) => (
              <SortablePhoto
                key={photo}
                id={photo}
                photo={photo}
                index={index}
                editable={editable}
                onDelete={handleDeleteClick}
              />
            ))}
          </SortableContext>

          {/* Render empty slots */}
          {emptySlots.map((_, index) => (
            <Grid 
              item 
              xs={4} 
              key={`empty-${index}`}
              sx={!expanded ? {
                minWidth: '33.33%',
                flexShrink: 0
              } : {}}
            >
              <Box
                sx={{
                  position: 'relative',
                  paddingTop: '100%',
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {editable && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id={`photo-upload-${index}`}
                      type="file"
                      onChange={handleFileSelect}
                      disabled={uploading}
                    />
                    <label htmlFor={`photo-upload-${index}`}>
                      <IconButton
                        component="span"
                        disabled={uploading}
                        sx={{
                          width: 56,
                          height: 56,
                          bgcolor: '#FF6B6B',
                          color: 'white',
                          '&:hover': {
                            bgcolor: '#FF5252',
                          },
                        }}
                      >
                        {uploading ? <CircularProgress size={24} color="inherit" /> : <AddIcon />}
                      </IconButton>
                    </label>
                  </Box>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Drag Overlay for smooth dragging visual */}
        <DragOverlay>
          {activeId ? (
            <Box
              component="img"
              src={getImageUrl(activeId)}
              sx={{
                width: 100,
                height: 100,
                objectFit: 'cover',
                borderRadius: 2,
                boxShadow: 3,
                opacity: 0.8,
              }}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, photoUrl: null })}>
        <DialogTitle>Eliminar foto</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que quieres eliminar esta foto? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, photoUrl: null })}>No</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Sí, eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
