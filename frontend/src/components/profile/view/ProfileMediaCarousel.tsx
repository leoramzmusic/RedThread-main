import { useRef } from "react";
import { Box, Chip, IconButton, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { MediaItem } from "../../../types/media";

interface ProfileMediaCarouselProps {
  mediaItems?: MediaItem[];
  fallbackPhotos?: string[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  likeSlot?: React.ReactNode;
  onMediaClick?: (mediaId: string) => void;
  smartPhotosEnabled?: boolean;
}

interface Slide {
  id: string;
  type: string;
  url: string;
  thumbnail?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const resolveUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith("http") || url.startsWith("blob:")) return url;
  return `${API_URL}${url}`;
};

export default function ProfileMediaCarousel({
  mediaItems = [],
  fallbackPhotos = [],
  activeIndex,
  onIndexChange,
  likeSlot,
  onMediaClick,
  smartPhotosEnabled,
}: ProfileMediaCarouselProps) {
  const touchStartX = useRef<number | null>(null);

  const slides: Slide[] =
    mediaItems.length > 0
      ? mediaItems.map((item) => ({
          id: item._id,
          type: String(item.type).toLowerCase(),
          url: item.url,
          thumbnail: item.thumbnail_url,
        }))
      : fallbackPhotos.map((url, index) => ({
          id: `fallback-${index}`,
          type: "photo",
          url,
        }));

  if (slides.length === 0) {
    return (
      <Box
        aria-label="Media del perfil"
        sx={{
          height: { xs: 240, sm: 320, md: 380 },
          borderRadius: 3,
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, rgba(230,57,70,0.85) 0%, rgba(29,29,31,0.95) 70%)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        }}
      >
        {likeSlot && (
          <Box sx={{ position: "absolute", right: 16, bottom: 16, zIndex: 5 }}>
            {likeSlot}
          </Box>
        )}
      </Box>
    );
  }

  const safeIndex = Math.max(0, Math.min(activeIndex, slides.length - 1));
  const current = slides[safeIndex];
  const goTo = (index: number) => {
    const next = Math.max(0, Math.min(index, slides.length - 1));
    if (next !== safeIndex) onIndexChange(next);
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    goTo(delta < 0 ? safeIndex + 1 : safeIndex - 1);
  };

  const isFallback = current.id.startsWith("fallback-");

  return (
    <Box
      aria-label="Media del perfil"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      sx={{
        height: { xs: 260, sm: 340, md: 420 },
        width: "100%",
        borderRadius: 3,
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        bgcolor: "black",
      }}
    >
      {current.type === "video" ? (
        <Box
          component="video"
          data-media-id={current.id}
          src={resolveUrl(current.url)}
          poster={resolveUrl(current.thumbnail)}
          autoPlay
          muted
          loop
          playsInline
          onClick={() => !isFallback && onMediaClick?.(current.id)}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            cursor: "pointer",
          }}
        />
      ) : (
        <Box
          component="img"
          data-media-id={current.id}
          src={resolveUrl(current.url)}
          alt=""
          onClick={() => !isFallback && onMediaClick?.(current.id)}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            cursor: "pointer",
          }}
        />
      )}

      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.18) 55%, rgba(0,0,0,0.62) 100%)",
        }}
      />

      {slides.length > 1 && (
        <>
          <IconButton
            aria-label="Media anterior"
            onClick={() => goTo(safeIndex - 1)}
            disabled={safeIndex === 0}
            sx={{
              position: "absolute",
              left: 8,
              top: "50%",
              transform: "translateY(-50%)",
              color: "white",
              bgcolor: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(8px)",
              "&:hover": { bgcolor: "rgba(0,0,0,0.65)" },
              "&.Mui-disabled": { color: "rgba(255,255,255,0.3)" },
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
          <IconButton
            aria-label="Media siguiente"
            onClick={() => goTo(safeIndex + 1)}
            disabled={safeIndex === slides.length - 1}
            sx={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              color: "white",
              bgcolor: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(8px)",
              "&:hover": { bgcolor: "rgba(0,0,0,0.65)" },
              "&.Mui-disabled": { color: "rgba(255,255,255,0.3)" },
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        </>
      )}

      <Box
        sx={{
          position: "absolute",
          left: 16,
          bottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 1,
          zIndex: 4,
        }}
      >
        {smartPhotosEnabled && safeIndex === 0 && (
          <Chip
            icon={<AutoAwesomeIcon sx={{ fontSize: 12 }} />}
            label="Smart"
            size="small"
            color="warning"
            sx={{
              height: 22,
              fontWeight: 700,
              "& .MuiChip-icon": { color: "white" },
            }}
          />
        )}
        <Typography
          variant="caption"
          sx={{
            color: "white",
            bgcolor: "rgba(0,0,0,0.45)",
            px: 1,
            py: 0.25,
            borderRadius: 1,
            backdropFilter: "blur(6px)",
          }}
        >
          {safeIndex + 1} / {slides.length}
        </Typography>
      </Box>

      {slides.length > 1 && (
        <Box
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 8,
            display: "flex",
            justifyContent: "center",
            gap: 0.5,
            zIndex: 4,
          }}
        >
          {slides.map((slide, index) => (
            <Box
              key={slide.id}
              component="button"
              type="button"
              aria-label={`Ir a media ${index + 1}`}
              onClick={() => goTo(index)}
              sx={{
                width: index === safeIndex ? 18 : 6,
                height: 6,
                borderRadius: 3,
                border: 0,
                p: 0,
                cursor: "pointer",
                bgcolor:
                  index === safeIndex ? "white" : "rgba(255,255,255,0.45)",
                transition: "all 0.2s ease",
              }}
            />
          ))}
        </Box>
      )}

      {likeSlot && (
        <Box sx={{ position: "absolute", right: 16, bottom: 16, zIndex: 5 }}>
          {likeSlot}
        </Box>
      )}
    </Box>
  );
}
