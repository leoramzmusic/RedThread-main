import React, { useState } from 'react';
import { Box, IconButton, Typography, useTheme } from '@mui/material';
import { MediaItem, MediaType } from '../../types/media';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import InstagramIcon from '@mui/icons-material/Instagram';
import MusicNoteIcon from '@mui/icons-material/MusicNote'; // For TikTok

interface MediaGalleryProps {
  items: MediaItem[];
  height?: number | string;
}

const MediaGallery: React.FC<MediaGalleryProps> = ({ items, height = 400 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const theme = useTheme();

  if (!items || items.length === 0) {
    return (
      <Box
        sx={{
          height,
          width: '100%',
          bgcolor: 'grey.200',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No media available
        </Typography>
      </Box>
    );
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const currentItem = items[currentIndex];

  const renderContent = (item: MediaItem) => {
    switch (item.type) {
      case MediaType.PHOTO:
        return (
          <img
            src={item.url}
            alt="Profile"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        );
      case MediaType.VIDEO:
        return (
          <video
            src={item.url}
            controls
            style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: 'black' }}
          />
        );
      case MediaType.TIKTOK:
        return (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              bgcolor: 'black',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <MusicNoteIcon sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="body1">TikTok Video</Typography>
            <Typography variant="caption" sx={{ mt: 1 }}>
              <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: 'white' }}>
                Open in TikTok
              </a>
            </Typography>
          </Box>
        );
      case MediaType.INSTAGRAM:
        return (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              bgcolor: 'black',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <InstagramIcon sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="body1">Instagram Post</Typography>
            <Typography variant="caption" sx={{ mt: 1 }}>
              <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: 'white' }}>
                Open in Instagram
              </a>
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ position: 'relative', height, width: '100%', overflow: 'hidden', borderRadius: 2 }}>
      {renderContent(currentItem)}

      {/* Navigation Arrows */}
      {items.length > 1 && (
        <>
          <IconButton
            onClick={handlePrev}
            sx={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(0,0,0,0.3)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' },
            }}
          >
            <NavigateBeforeIcon />
          </IconButton>
          <IconButton
            onClick={handleNext}
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(0,0,0,0.3)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' },
            }}
          >
            <NavigateNextIcon />
          </IconButton>
        </>
      )}

      {/* Indicators */}
      {items.length > 1 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 1,
          }}
        >
          {items.map((_, index) => (
            <Box
              key={index}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: index === currentIndex ? 'white' : 'rgba(255,255,255,0.5)',
                transition: 'background-color 0.3s',
              }}
            />
          ))}
        </Box>
      )}
      
      {/* Type Indicator Badge */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          bgcolor: 'rgba(0,0,0,0.5)',
          color: 'white',
          px: 1,
          py: 0.5,
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        {currentItem.type === MediaType.VIDEO && <PlayCircleOutlineIcon fontSize="small" />}
        {currentItem.type === MediaType.TIKTOK && <MusicNoteIcon fontSize="small" />}
        {currentItem.type === MediaType.INSTAGRAM && <InstagramIcon fontSize="small" />}
        <Typography variant="caption">
          {currentIndex + 1}/{items.length}
        </Typography>
      </Box>
    </Box>
  );
};

export default MediaGallery;
