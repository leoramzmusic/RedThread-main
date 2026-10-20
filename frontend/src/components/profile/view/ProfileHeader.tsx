import { useState } from "react";
import { useTranslation } from "next-i18next/pages";
import {
  Box,
  Button,
  Avatar,
  Typography,
  Stack,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Container,
  useTheme,
} from "@mui/material";
import {
  Edit as EditIcon,
  CameraAlt as CameraIcon,
  AddCircle as AddIcon,
  Image as ImageIcon,
  Close as CloseIcon,
  Favorite as FavoriteIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";

import PlanBadge from "../../subscription/PlanBadge";
import VerificationBadge, {
  VerificationStatus,
} from "../../shared/VerificationBadge";
import ProfileMediaCarousel from "./ProfileMediaCarousel";

interface ProfileHeaderProps {
  profile: any;
  mainProfilePhoto?: string;
  onEdit?: () => void;
  readOnly?: boolean;
  onPhotoClick?: (mediaId: string) => void;
  smartPhotosEnabled?: boolean;
  mediaItems?: any[];
  activeMediaIndex?: number;
  onActiveMediaChange?: (index: number) => void;
  onLike?: () => void;
  likeState?: "idle" | "sending" | "sent";
  showLikeButton?: boolean;
}

const identityStatus = (profile: any): VerificationStatus => {
  const s = profile.identity_verification_status;
  if (s === "verified" || s === "approved") return "verified";
  if (s === "pending") return "pending";
  if (profile.verified) return "verified";
  return "none";
};

export default function ProfileHeader({
  profile,
  mainProfilePhoto,
  onEdit,
  readOnly,
  onPhotoClick,
  smartPhotosEnabled,
  mediaItems,
  activeMediaIndex = 0,
  onActiveMediaChange,
  onLike,
  likeState = "idle",
  showLikeButton = false,
}: ProfileHeaderProps) {
  const { t } = useTranslation("common");
  const theme = useTheme();
  const [cameraMenuAnchor, setCameraMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const isMenuOpen = Boolean(cameraMenuAnchor);

  // Mock story state
  const hasNewStory = profile.has_new_story || false;
  const storyViewed = profile.story_viewed || false;

  const handleCameraClick = (event: React.MouseEvent<HTMLElement>) => {
    setCameraMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setCameraMenuAnchor(null);
  };

  const handleAvatarClick = () => {
    if (hasNewStory) {
      console.log("Viewing story");
    } else {
      setIsPhotoModalOpen(true);
    }
  };

  const handleUploadStory = () => {
    console.log("Upload Story");
    handleMenuClose();
  };

  const handleUpdatePhoto = () => {
    if (onEdit) onEdit();
    handleMenuClose();
  };

  // Determine avatar border color
  let avatarBorderColor = theme.palette.background.paper; // Matches card background
  if (hasNewStory && !storyViewed) {
    avatarBorderColor = "#ff4f91";
  } else if (hasNewStory && storyViewed) {
    avatarBorderColor = "#888";
  }

  const likeSlot = showLikeButton ? (
    <Button
      variant="contained"
      color="primary"
      startIcon={likeState === "sent" ? <CheckCircleIcon /> : <FavoriteIcon />}
      onClick={onLike}
      disabled={likeState !== "idle"}
      sx={{
        borderRadius: 28,
        px: { xs: 2, sm: 2.5 },
        py: 1,
        textTransform: "none",
        fontWeight: 700,
        boxShadow: "0 8px 24px rgba(230,57,70,0.35)",
        "&.Mui-disabled": {
          color: "white",
          bgcolor: "rgba(230,57,70,0.7)",
        },
      }}
    >
      {likeState === "sending"
        ? t("profile.likeSending", "Enviando...")
        : likeState === "sent"
          ? t("profile.likeSent", "Like enviado")
          : t("profile.like", "Me gusta")}
    </Button>
  ) : undefined;

  return (
    <Box
      sx={{
        mb: 4,
      }}
    >
      {/* 1. Carousel Section */}
      <ProfileMediaCarousel
        mediaItems={mediaItems}
        fallbackPhotos={
          profile.photos?.length
            ? profile.photos
            : profile.banner_url
              ? [profile.banner_url]
              : []
        }
        activeIndex={activeMediaIndex}
        onIndexChange={onActiveMediaChange || (() => undefined)}
        onMediaClick={onPhotoClick}
        smartPhotosEnabled={smartPhotosEnabled}
        likeSlot={likeSlot}
      />

      {/* 2. Overlapping Info Section */}
      <Container maxWidth="md" sx={{ px: { xs: 2, md: 4 } }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "center", sm: "flex-end" },
            mt: -6, // Overlap amount
            position: "relative",
            zIndex: 2,
            gap: 3,
          }}
        >
          {/* Avatar Group */}
          <Box
            sx={{
              position: "relative",
            }}
          >
            <Box
              sx={{
                position: "relative",
                borderRadius: "50%",
                p: 0.5,
                background:
                  hasNewStory && !storyViewed
                    ? "linear-gradient(135deg, #E63946, #FF6B6B, #E63946)"
                    : "transparent",
                animation:
                  hasNewStory && !storyViewed
                    ? "rtAvatarPulse 2s ease-in-out infinite"
                    : "none",
                "@keyframes rtAvatarPulse": {
                  "0%, 100%": { boxShadow: "0 0 0 2px rgba(230,57,70,0.4)" },
                  "50%": { boxShadow: "0 0 0 6px rgba(230,57,70,0.15)" },
                },
              }}
            >
              <Avatar
                src={mainProfilePhoto}
                alt={profile.display_name}
                onClick={handleAvatarClick}
                sx={{
                  width: 140,
                  height: 140,
                  border: `4px solid ${theme.palette.background.default}`,
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "scale(1.02)",
                    boxShadow: "0 0 20px rgba(230,57,70,0.3)",
                  },
                }}
              />
            </Box>

            {/* Camera/Edit Icon for Owner */}
            {!readOnly && (
              <IconButton
                onClick={handleCameraClick}
                sx={{
                  position: "absolute",
                  bottom: 10,
                  right: 10,
                  bgcolor: "rgba(230,57,70,0.85)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  color: "white",
                  boxShadow: "0 2px 12px rgba(230,57,70,0.4)",
                  "&:hover": {
                    bgcolor: "rgba(230,57,70,1)",
                    transform: "scale(1.1)",
                  },
                }}
                size="small"
              >
                <CameraIcon fontSize="small" />
              </IconButton>
            )}
          </Box>

          {/* User Info Group */}
          <Box
            sx={{
              flexGrow: 1,
              pb: 1,
              textAlign: { xs: "center", sm: "left" },
              width: "100%",
            }}
          >
            {/* Name & Age Row */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                justifyContent: { xs: "center", sm: "flex-start" },
                flexWrap: "wrap",
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: "text.primary",
                }}
              >
                {profile.display_name}
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: "text.secondary",
                  fontWeight: 500,
                }}
              >
                {profile.age}
              </Typography>
              <VerificationBadge
                status={identityStatus(profile)}
                size="medium"
              />
            </Box>

            {/* Handle */}
            <Typography
              variant="subtitle1"
              sx={{
                color: "text.disabled",
                fontWeight: 500,
              }}
            >
              @{profile.nickname}
            </Typography>

            {/* Badges */}
            <Stack
              direction="row"
              spacing={1}
              sx={{
                mt: 1,
                justifyContent: { xs: "center", sm: "flex-start" },
              }}
            >
              {profile.subscription_tier &&
                profile.subscription_tier !== "free" && (
                  <PlanBadge tier={profile.subscription_tier} size="small" />
                )}
            </Stack>
          </Box>

          {/* Owner action */}
          {!readOnly && onEdit && (
            <Box sx={{ pb: 3 }}>
              <Button
                variant="contained"
                startIcon={<EditIcon sx={{ fontSize: 18 }} />}
                onClick={onEdit}
                sx={{
                  fontSize: "0.85rem",
                  py: 0.75,
                  px: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  bgcolor: "rgba(230,57,70,0.9)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  boxShadow: "0 4px 16px rgba(230,57,70,0.3)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: "rgba(230,57,70,1)",
                    boxShadow: "0 6px 20px rgba(230,57,70,0.4)",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                {t("profile.edit", "Editar perfil")}
              </Button>
            </Box>
          )}
        </Box>

        {/* Bio & Socials (Below Avatar Row) */}
        <Box
          sx={{
            mt: 3,
            textAlign: { xs: "center", sm: "left" },
          }}
        >
          {/* Links Placeholder */}
          <Stack
            direction="row"
            spacing={2}
            sx={{
              mb: 2,
              justifyContent: { xs: "center", sm: "flex-start" },
            }}
          >
            {/* Example Social Icons - in real app would verify existence */}
            {/* <IconButton size="small"><InstagramIcon /></IconButton> */}
          </Stack>

          {/* Short Bio (if exists) */}
          {profile.bio && (
            <Typography
              variant="body1"
              sx={{
                color: "text.secondary",
                maxWidth: 600,
              }}
            >
              {profile.bio}
            </Typography>
          )}
        </Box>
      </Container>

      {/* Menu for Camera */}
      <Menu
        anchorEl={cameraMenuAnchor}
        open={isMenuOpen}
        onClose={handleMenuClose}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 180,
              borderRadius: 2,
            },
          },
        }}
      >
        <MenuItem onClick={handleUploadStory}>
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t("profile.uploadStory", "Subir historia")} />
        </MenuItem>
        <MenuItem onClick={handleUpdatePhoto}>
          <ListItemIcon>
            <ImageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={t("profile.viewEditPhoto", "Ver/Editar foto")}
          />
        </MenuItem>
      </Menu>

      {/* Full Screen Photo View Modal */}
      {isPhotoModalOpen && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: "rgba(0,0,0,0.9)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
          onClick={() => setIsPhotoModalOpen(false)}
        >
          <IconButton
            sx={{ position: "absolute", top: 20, right: 20, color: "white" }}
            onClick={() => setIsPhotoModalOpen(false)}
          >
            <CloseIcon fontSize="large" />
          </IconButton>
          <Box
            component="img"
            src={mainProfilePhoto}
            sx={{
              maxWidth: "90%",
              maxHeight: "90vh",
              borderRadius: 2,
              boxShadow: "0 0 50px rgba(0,0,0,0.5)",
            }}
          />
        </Box>
      )}
    </Box>
  );
}
