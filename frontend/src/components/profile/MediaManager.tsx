import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, IconButton, Paper, CircularProgress, Chip, Accordion, AccordionSummary, AccordionDetails, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import InstagramIcon from '@mui/icons-material/Instagram';
import StarIcon from '@mui/icons-material/Star';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { MediaItem, MediaType } from '../../types/media';
import apiClient from '../../services/api';
import { useTranslation } from 'next-i18next';
import { useDispatch } from 'react-redux';
import VisualTipsSheet from './VisualTipsSheet';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { updateUserAvatar } from '../../store/slices/authSlice';
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

const DEFAULT_THEME_COLOR = '#FF6B6B';
const DEFAULT_THEME_HOVER = '#FF5252';

interface MediaManagerProps {
  userId: string;
}

// Sortable Media Item Component
function SortableMediaItem({
  item,
  index,
  onDelete,
  isMainPhoto,
  onView,
  width
}: {
  item: MediaItem;
  index: number;
  onDelete: (id: string) => void;
  isMainPhoto?: boolean;
  onView?: (item: MediaItem) => void;
  width?: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        cursor: 'grab',
        position: 'relative',
        touchAction: 'none', // Important for dnd-kit on mobile
        width: width ?? undefined,
      }}
    >
      <Paper
        sx={{
          position: 'relative',
          paddingTop: '100%', // 1:1 Aspect Ratio
          overflow: 'hidden',
          bgcolor: 'background.default',
          borderRadius: '12px',
          boxShadow: (theme) => theme.palette.mode === 'dark'
            ? '0 0 8px rgba(255,255,255,0.05)'
            : '0 2px 8px rgba(0,0,0,0.05)',
          cursor: onView ? 'zoom-in' : 'pointer',
          '&:hover': onView ? { opacity: 0.95 } : {},
        }}
        onClick={(e) => {
          if (isDragging) return;
          e.stopPropagation();
          onView?.(item);
        }}
      >
        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          {item.type === MediaType.PHOTO && (
            <img src={item.url} alt="User media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          {item.type === MediaType.VIDEO && (
            <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
          )}
          {(item.type === MediaType.TIKTOK || item.type === MediaType.INSTAGRAM) && (
            <Box display="flex" alignItems="center" justifyContent="center" height="100%" bgcolor="black" color="white">
              {item.type === MediaType.TIKTOK ? <MusicNoteIcon /> : <InstagramIcon />}
            </Box>
          )}
        </Box>

        {/* Main Photo Indicator */}
        {isMainPhoto && (
          <Chip
            icon={<StarIcon sx={{ fontSize: '1rem !important' }} />}
            label="Perfil"
            size="small"
            color="primary"
            sx={{
              position: 'absolute',
              top: 4,
              left: 4,
              height: 20,
              fontSize: '0.7rem',
              '& .MuiChip-icon': { color: 'white' }
            }}
          />
        )}

        <IconButton
          size="small"
          onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item._id);
          }}
          sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.7)', '&:hover': { bgcolor: 'white' } }}
        >
          <DeleteIcon fontSize="small" color="error" />
        </IconButton>
      </Paper>
    </Box>
  );
}

const MediaManager: React.FC<MediaManagerProps> = ({ userId }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<string | null>(null);
  const [showTips, setShowTips] = useState(false);

  // Preview Modal State
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);

  // Error Modal State
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateReduxAvatar = (items: MediaItem[]) => {
    const firstPhoto = items.find(item => item.type?.toLowerCase() === 'photo');
    dispatch(updateUserAvatar(firstPhoto?.url));
  };

  const fetchMedia = async () => {
    try {
      const response = await apiClient.get(`/media/${userId}`);
      setMediaItems(response.data);
      updateReduxAvatar(response.data);
    } catch (error) {
      console.error('Error fetching media:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchMedia();
    }
  }, [userId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: MediaType) => {
    if (!event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    setLoading(true);
    try {
      await apiClient.post('/media/upload', formData);
      fetchMedia();
    } catch (error: any) {
      console.error('Error uploading media:', error);
      let msg = t('common.uploadError.generic', 'Error al subir el archivo. Verifica los límites y el tipo.');

      const detail = error.response?.data?.detail;
      if (detail) {
        if (detail.includes('Maximum') && detail.includes('video')) {
          msg = t('common.uploadError.maxVideos', { count: 3 });
        } else {
          // Fallback to backend message if it's specific but not one we assume translation for, 
          // OR keep generic. For now, let's use the backend message if it's not the video limit, 
          // but mapped to a safe default if needed. 
          // Actually, the user asked specifically for the video limit translation.
          msg = detail;
        }
      }

      setErrorMessage(msg);
      setErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleErrorClose = () => {
    setErrorOpen(false);
  };

  const handleDeleteClick = (mediaId: string) => {
    setMediaToDelete(mediaId);
    setDeleteConfirmationOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!mediaToDelete) return;

    try {
      await apiClient.delete(`/media/${mediaToDelete}`);
      const newItems = mediaItems.filter((item) => item._id !== mediaToDelete);
      setMediaItems(newItems);
      updateReduxAvatar(newItems);
    } catch (error) {
      console.error('Error deleting media:', error);
    } finally {
      setDeleteConfirmationOpen(false);
      setMediaToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmationOpen(false);
    setMediaToDelete(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setMediaItems((items) => {
        const oldIndex = items.findIndex((item) => item._id === active.id);
        const newIndex = items.findIndex((item) => item._id === over.id);

        // Ensure we are reordering within the same type (Photo or Video)
        // Since we have separate DndContexts or filtered lists, we need to be careful.
        // Actually, if we use one DndContext for the whole page, we might drag a photo to video section.
        // Better to handle reordering on the filtered list and then merge back.

        // However, for simplicity, let's assume we are reordering the global list but only moving items relative to each other?
        // No, that's complex.

        // Better approach: Reorder the global list.
        const newItems = arrayMove(items, oldIndex, newIndex);

        // Sync with backend
        const ids = newItems.map(item => item._id);
        apiClient.patch('/media/order', ids).catch(err => console.error("Error updating order", err));

        return newItems;
      });
    }

    setActiveId(null);
  };

  const activeItem = mediaItems.find(item => item._id === activeId);

  const photos = mediaItems.filter(item => item.type === MediaType.PHOTO);
  const videos = mediaItems.filter(item => item.type === MediaType.VIDEO);

  // Only one add box: shown from 0 to 8 photos, hidden once the 9th is loaded
  const photoAddSlots = photos.length >= 9 ? 0 : 1;

  // Same adaptive behavior for videos (max 3): compact row of 2 when empty, grows to the full 3-slot grid
  const videoAddSlots = videos.length === 3 ? 0 : Math.max(1, 2 - videos.length);
  const videoTotalSlots = videos.length + videoAddSlots;

  // Separate reorder handlers for each section to prevent cross-type dragging issues
  const handleReorder = (oldIndex: number, newIndex: number, type: MediaType) => {
    // Find the items in the global list
    const filteredItems = type === MediaType.PHOTO ? photos : videos;
    const itemToMove = filteredItems[oldIndex];
    const targetItem = filteredItems[newIndex];

    const globalOldIndex = mediaItems.findIndex(i => i._id === itemToMove._id);
    const globalNewIndex = mediaItems.findIndex(i => i._id === targetItem._id);

    const newItems = arrayMove(mediaItems, globalOldIndex, globalNewIndex);
    setMediaItems(newItems);
    updateReduxAvatar(newItems);

    const ids = newItems.map(item => item._id);
    apiClient.patch('/media/order', ids).catch(err => console.error("Error updating order", err));
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={2} className="section-header">
        <Typography variant="subtitle1" fontWeight="bold">
          {t('profile.mediaGallery', 'Galería Multimedia')}
        </Typography>
        <Tooltip title="Puedes subir hasta 9 fotos y 3 videos.">
          <InfoOutlinedIcon sx={{ fontSize: 20, color: 'text.secondary', cursor: 'pointer' }} />
        </Tooltip>
      </Box>

      {/* Photos Section */}
      <Box mb={3}>
        <Box display="flex" justifyContent="flex-end" alignItems="center" mb={1}>
          <Button
            startIcon={<LightbulbIcon />}
            onClick={() => setShowTips(true)}
            size="small"
            sx={{
              textTransform: 'none',
              color: 'text.secondary',
              fontSize: '0.85rem',
              '&:hover': {
                bgcolor: 'action.hover',
                color: '#FF6B6B' // Fixed standard red
              }
            }}
          >
            Tips visuales
          </Button>
        </Box>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Mis fotos ({photos.length}/9)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={(event) => {
                const { active, over } = event;
                if (over && active.id !== over.id) {
                  const oldIndex = photos.findIndex(p => p._id === active.id);
                  const newIndex = photos.findIndex(p => p._id === over.id);
                  handleReorder(oldIndex, newIndex, MediaType.PHOTO);
                }
                setActiveId(null);
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'nowrap',
                  gap: '12px',
                  justifyContent: 'flex-start',
                }}
              >
                <SortableContext
                  items={photos.map(item => item._id)}
                  strategy={rectSortingStrategy}
                >
                  {photos.map((item, index) => (
                    <SortableMediaItem
                      key={item._id}
                      item={item}
                      index={index}
                      width={84}
                      onDelete={handleDeleteClick}
                      onView={setPreviewItem}
                      isMainPhoto={index === 0}
                    />
                  ))}
                </SortableContext>

                {/* Add Photo Dashed Boxes */}
                {Array.from({ length: photoAddSlots }, (_, slotIndex) => (
                  <Box
                    key={`add-photo-${slotIndex}`}
                    component="label"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 84,
                      // Aspect ratio trick for grid item
                      aspectRatio: '1/1',
                      position: 'relative',
                      border: 'none',
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? '#2A2A2A' : '#FAFAFA',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        transform: 'scale(1.05)'
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <AddPhotoAlternateIcon sx={{ fontSize: 24, color: 'text.secondary', mb: 0.5 }} />
                      <Typography variant="caption" color="text.secondary">Agregar</Typography>
                      <input type="file" hidden accept="image/*" id={`media-photo-add-${slotIndex}`} onChange={(e) => handleFileUpload(e, MediaType.PHOTO)} disabled={loading} />
                    </Box>
                  </Box>
                ))}
              </Box>
            </DndContext>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Videos Section */}
      <Box mb={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        </Box>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Mis videos ({videos.length}/3)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={(event) => {
                const { active, over } = event;
                if (over && active.id !== over.id) {
                  const oldIndex = videos.findIndex(v => v._id === active.id);
                  const newIndex = videos.findIndex(v => v._id === over.id);
                  handleReorder(oldIndex, newIndex, MediaType.VIDEO);
                }
                setActiveId(null);
              }}
            >
              <Box
                display="grid"
                gridTemplateColumns="repeat(auto-fit, minmax(80px, 1fr))"
                gap="12px"
                maxWidth={videoTotalSlots <= 2 ? 360 : '100%'}
              >
                <SortableContext
                  items={videos.map(item => item._id)}
                  strategy={rectSortingStrategy}
                >
                  {videos.map((item, index) => (
                    <SortableMediaItem
                      key={item._id}
                      item={item}
                      index={index}
                      onDelete={handleDeleteClick}
                      onView={setPreviewItem}
                    />
                  ))}
                </SortableContext>

                {/* Add Video Dashed Boxes */}
                {Array.from({ length: videoAddSlots }, (_, slotIndex) => (
                  <Box
                    key={`add-video-${slotIndex}`}
                    component="label"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      aspectRatio: '1/1',
                      position: 'relative',
                      border: 'none',
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? '#2A2A2A' : '#FAFAFA',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        transform: 'scale(1.05)'
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <VideoCallIcon sx={{ fontSize: 24, color: 'text.secondary', mb: 0.5 }} />
                      <Typography variant="caption" color="text.secondary">Agregar</Typography>
                      <input type="file" hidden accept="video/*" id={`media-video-add-${slotIndex}`} onChange={(e) => handleFileUpload(e, MediaType.VIDEO)} disabled={loading} />
                    </Box>
                  </Box>
                ))}
              </Box>
            </DndContext>
          </AccordionDetails>
        </Accordion>
      </Box>

      {loading && <CircularProgress size={24} sx={{ mb: 2 }} />}

      <DragOverlay>
        {activeItem ? (
          <Paper
            sx={{
              width: 100,
              height: 100,
              overflow: 'hidden',
              opacity: 0.8
            }}
          >
            {activeItem.type === MediaType.PHOTO && (
              <img src={activeItem.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            {activeItem.type === MediaType.VIDEO && (
              <video src={activeItem.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </Paper>
        ) : null}
      </DragOverlay>

      <VisualTipsSheet open={showTips} onClose={() => setShowTips(false)} />

      {/* Media Preview Modal */}
      <Dialog
        open={!!previewItem}
        onClose={() => setPreviewItem(null)}
        maxWidth="lg"
        PaperProps={{
          sx: {
            borderRadius: '12px',
            bgcolor: 'black',
            backgroundImage: 'none',
            overflow: 'hidden',
            width: 'min(90vw, 900px)',
            m: 0,
          },
        }}
      >
        <IconButton
          size="small"
          onClick={() => setPreviewItem(null)}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
            bgcolor: 'rgba(0,0,0,0.6)',
            color: 'white',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
        {previewItem?.type === MediaType.PHOTO && (
          <img
            src={previewItem.url}
            alt="Vista previa"
            style={{ width: '100%', height: 'auto', maxHeight: '85vh', objectFit: 'contain', display: 'block' }}
          />
        )}
        {previewItem?.type === MediaType.VIDEO && (
          <video
            src={previewItem.url}
            controls
            autoPlay
            style={{ width: '100%', maxHeight: '85vh', display: 'block' }}
          />
        )}
      </Dialog>

      <Dialog
        open={deleteConfirmationOpen}
        onClose={handleCancelDelete}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            maxWidth: '360px',
            width: '100%',
            m: 2, // Margin for mobile
            p: 3, // 24px padding matching user request
            bgcolor: 'background.paper',
            backgroundImage: 'none' // Remove default Paper overlay in dark mode if desired, or keep for elevation
          }
        }}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title" sx={{ p: 0, mb: 1, fontSize: '18px', fontWeight: 600 }}>
          {t('common.confirmDeleteTitle', '¿Eliminar este elemento?')}
        </DialogTitle>
        <DialogContent sx={{ p: '0 !important', mb: 3 }}>
          <DialogContentText id="alert-dialog-description" sx={{ fontSize: '14px', opacity: 0.8, color: 'text.primary' }}>
            {t('common.confirmDeleteMessage', 'Esta acción no se puede deshacer.')}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 0, gap: 1.5, justifyContent: 'flex-end' }}>
          <Button
            onClick={handleCancelDelete}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              color: 'text.primary',
              borderColor: 'rgba(145, 158, 171, 0.32)',
              border: '1px solid',
              px: 2,
              '&:hover': {
                borderColor: 'text.primary',
                bgcolor: 'action.hover'
              }
            }}
          >
            {t('common.cancel', 'Cancelar')}
          </Button>
          <Button
            onClick={handleConfirmDelete}
            sx={{
              bgcolor: '#ff4d4f',
              color: 'white',
              borderRadius: '8px',
              textTransform: 'none',
              px: 2,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#d9363e',
                boxShadow: 'none'
              }
            }}
            autoFocus
          >
            {t('common.delete', 'Eliminar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Modal */}
      <Dialog
        open={errorOpen}
        onClose={handleErrorClose}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            maxWidth: '320px',
            width: '100%',
            m: 2,
            p: 3, // 20px padding requested, but 3 (24px) works well with MUI spacing
            bgcolor: 'background.paper',
            textAlign: 'center'
          }
        }}
      >
        <DialogTitle sx={{ p: 0, mb: 1, fontSize: '16px', fontWeight: 600 }}>
          {t('common.errorUploadTitle', 'Error al subir el archivo')}
        </DialogTitle>
        <DialogContent sx={{ p: '0 !important', mb: 2 }}>
          <DialogContentText sx={{ fontSize: '14px', opacity: 0.8, color: 'text.primary' }}>
            {errorMessage}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 0, justifyContent: 'center' }}>
          <Button
            onClick={handleErrorClose}
            sx={{
              bgcolor: '#ff4d4f',
              color: 'white',
              borderRadius: '8px',
              textTransform: 'none',
              px: 3,
              py: 1,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#d9363e',
                boxShadow: 'none'
              }
            }}
            autoFocus
          >
            {t('common.accept', 'Aceptar')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MediaManager;
