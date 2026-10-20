import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Box, Button, Dialog, DialogContent, Typography } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatIcon from "@mui/icons-material/Chat";
import { useSnackbar } from "notistack";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import apiClient from "../../services/api";
import { MediaItem } from "../../types/media";

// Sub-components
import ProfileHeader from "./view/ProfileHeader";
import ProfileTabs from "./view/ProfileTabs";
import ProfileMainView from "./view/ProfileMainView";
import ProfileMediaView from "./view/ProfileMediaView";
import ProfileIdentityView from "./view/ProfileIdentityView";
import ProfileRewardsView from "./view/ProfileRewardsView";
import { useSmartPhotosTracking } from "../../services/smartPhotos";

interface ProfileViewProps {
  profile: any;
  onEdit?: () => void;
  onProfileUpdate?: () => void;
  readOnly?: boolean;
}

export default function ProfileView({
  profile,
  onEdit,
  onProfileUpdate,
  readOnly = false,
}: ProfileViewProps) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useSelector((state: RootState) => state.auth);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [likeState, setLikeState] = useState<"idle" | "sending" | "sent">(
    "idle",
  );
  const [matchOpen, setMatchOpen] = useState(false);

  // Tab handling
  const [activeTab, setActiveTab] = useState("profile");

  // Sync tab with URL query param
  useEffect(() => {
    if (router.query.tab) {
      setActiveTab(router.query.tab as string);
    }
  }, [router.query.tab]);

  const handleTabChange = (newValue: string) => {
    setActiveTab(newValue);

    // Update URL shallowly
    const query = { ...router.query, tab: newValue };
    router.replace(
      {
        pathname: router.pathname,
        query: query,
      },
      undefined,
      { shallow: true },
    );
  };

  useEffect(() => {
    const fetchMedia = async () => {
      if (profile?.user_id) {
        try {
          const response = await apiClient.get(`/media/${profile.user_id}`);
          setMediaItems(response.data);
        } catch (error) {
          console.error("Error fetching media:", error);
        }
      }
    };
    setActiveMediaIndex(0);
    fetchMedia();
  }, [profile?.user_id]);

  useEffect(() => {
    if (
      profile?.my_interaction === "like" ||
      profile?.my_interaction === "superlike"
    ) {
      setLikeState("sent");
    } else {
      setLikeState("idle");
    }
  }, [profile?.my_interaction, profile?.user_id]);

  // Smart Photos tracking for profile page
  const { handlePhotoClick } = useSmartPhotosTracking(
    profile?.user_id || "",
    mediaItems,
  );

  const getImageUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith("http") || url.startsWith("blob:")) return url;
    return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${url}`;
  };

  // Get main profile photo logic
  const isOwnProfile = user?.user_id === profile.user_id;
  let mainProfilePhoto: string | undefined;

  if (isOwnProfile && user?.avatar) {
    mainProfilePhoto = user.avatar;
  } else if (mediaItems.length > 0) {
    const firstPhoto = mediaItems.find(
      (item) => item.type?.toLowerCase() === "photo",
    );
    mainProfilePhoto = firstPhoto?.url;
  } else if (profile.photos && profile.photos.length > 0) {
    mainProfilePhoto = getImageUrl(profile.photos[0]);
  }

  if (mainProfilePhoto && !isOwnProfile) {
    const separator = mainProfilePhoto.includes("?") ? "&" : "?";
    mainProfilePhoto = `${mainProfilePhoto}${separator}_t=${Date.now()}`;
  }

  const fallbackPhoto = profile.photos?.[activeMediaIndex];
  const activeMedia: MediaItem | null =
    mediaItems[activeMediaIndex] ||
    (fallbackPhoto
      ? {
          _id: "",
          user_id: profile.user_id,
          type: "photo" as MediaItem["type"],
          url: fallbackPhoto,
          order_index: activeMediaIndex,
          created_at: "",
        }
      : null);

  const handleLike = async () => {
    if (likeState !== "idle") return;

    if (!user) {
      router.push(`/auth?next=${encodeURIComponent(router.asPath)}`);
      return;
    }

    setLikeState("sending");
    try {
      const response = await apiClient.post("/discovery/swipe", {
        target_user_id: profile.user_id,
        interaction: "like",
        shown_media_id: activeMedia?._id || activeMedia?.url || null,
      });

      setLikeState("sent");
      if (response.data?.is_match) {
        setMatchOpen(true);
      }

      const mediaPreview = activeMedia?.thumbnail_url || activeMedia?.url;
      enqueueSnackbar(
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {mediaPreview && (
            <Box
              component="img"
              src={getImageUrl(mediaPreview)}
              alt=""
              sx={{
                width: 36,
                height: 48,
                borderRadius: 1,
                objectFit: "cover",
              }}
            />
          )}
          <span>Like enviado</span>
        </Box>,
        { variant: "success" },
      );
    } catch (error) {
      console.error("Error sending profile like:", error);
      setLikeState("idle");
      enqueueSnackbar("No se pudo enviar el like", { variant: "error" });
    }
  };

  return (
    <Box sx={{ maxWidth: "1200px", mx: "auto", px: { xs: 1, md: 2 } }}>
      <ProfileHeader
        profile={profile}
        mainProfilePhoto={mainProfilePhoto}
        onEdit={onEdit}
        readOnly={readOnly}
        onPhotoClick={handlePhotoClick}
        smartPhotosEnabled={profile?.smart_photos_enabled}
        mediaItems={mediaItems}
        activeMediaIndex={activeMediaIndex}
        onActiveMediaChange={setActiveMediaIndex}
        onLike={handleLike}
        likeState={likeState}
        showLikeButton={!isOwnProfile}
      />

      <ProfileTabs activeTab={activeTab} onChange={handleTabChange} />

      <Box sx={{ minHeight: "50vh", bgcolor: "background.default" }}>
        {activeTab === "profile" && <ProfileMainView profile={profile} />}

        {activeTab === "media" && (
          <ProfileMediaView
            profile={profile}
            mediaItems={mediaItems}
            mainProfilePhoto={mainProfilePhoto}
            onPhotoClick={handlePhotoClick}
            smartPhotosEnabled={profile?.smart_photos_enabled}
          />
        )}

        {activeTab === "identity" && <ProfileIdentityView profile={profile} />}

        {activeTab === "rewards" && <ProfileRewardsView profile={profile} />}
      </Box>

      <Dialog
        open={matchOpen}
        onClose={() => setMatchOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogContent sx={{ textAlign: "center", py: 4 }}>
          <FavoriteIcon color="primary" sx={{ fontSize: 64 }} />
          <Typography variant="h5" sx={{ fontWeight: 800, mt: 2 }}>
            ¡Es un match!
          </Typography>
          <Typography sx={{ color: "text.secondary", mt: 1 }}>
            Tú y {profile.display_name} se gustaron.
          </Typography>
          <Button
            fullWidth
            variant="contained"
            startIcon={<ChatIcon />}
            sx={{ mt: 3, borderRadius: 28 }}
            onClick={() => router.push("/chat")}
          >
            Ir al chat
          </Button>
          <Button fullWidth sx={{ mt: 1 }} onClick={() => setMatchOpen(false)}>
            Seguir explorando
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
