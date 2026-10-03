import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Container,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import Layout from "../../../components/layout/Layout";
import ProfileEdit from "../../../components/profile/ProfileEdit";
import apiClient from "../../../services/api";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../../store/store";
import { updateUserAvatar } from "../../../store/slices/authSlice";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function ModifyProfilePage() {
  const router = useRouter();
  const { nickname } = router.query;
  const { t, i18n } = useTranslation("common");
  const { isAuthenticated, user, isInitialized } = useSelector(
    (state: RootState) => state.auth,
  );
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [options, setOptions] = useState<any>({});
  const [sectionTextsLoaded, setSectionTextsLoaded] = useState(false);

  // Load section-specific translations from DB for all 21 languages
  useEffect(() => {
    if (!i18n || sectionTextsLoaded) return;
    let cancelled = false;

    const loadSectionTexts = async () => {
      try {
        console.log(
          "[i18n] Loading section texts for language:",
          i18n.language,
        );
        // Load all section translations
        const [
          langRes,
          relRes,
          controlRes,
          healthRes,
          personalityRes,
          musicRes,
          professionalRes,
          additionalRes,
          partnerRes,
          cognitiveRes,
          pronounsRes,
          interestsRes,
          goalsRes,
          aboutRes,
          locationRes,
          identityRes,
        ] = await Promise.all([
          apiClient.get("/options/section/languages_section", {
            params: { lang: i18n.language },
          }),
          apiClient.get("/options/section/relationship_status_section", {
            params: { lang: i18n.language },
          }),
          apiClient.get("/options/section/profile_control_section", {
            params: { lang: i18n.language },
          }),
          apiClient.get("/options/section/profile_health_section", {
            params: { lang: i18n.language },
          }),
          apiClient.get("/options/section/profile_personality_section", {
            params: { lang: i18n.language },
          }),
          apiClient.get("/options/section/profile_music_section", {
            params: { lang: i18n.language },
          }),
          apiClient.get("/options/section/profile_professional_section", {
            params: { lang: i18n.language },
          }),
          apiClient.get("/options/section/profile_additional_section", {
            params: { lang: i18n.language },
          }),
          apiClient.get("/options/section/profile_partner_section", {
            params: { lang: i18n.language },
          }),
          apiClient.get("/options/section/profile_cognitive_section", {
            params: { lang: i18n.language },
          }),
          apiClient.get("/options/section/profile_pronouns_section", {
            params: { lang: i18n.language },
          }),
          apiClient.get("/options/section/profile_interests_section", {
            params: { lang: i18n.language },
          }),
          apiClient.get("/options/section/profile_goals_section", {
            params: { lang: i18n.language },
          }),
          apiClient.get("/options/section/profile_about_section", {
            params: { lang: i18n.language },
          }),
          apiClient.get("/options/section/profile_location_section", {
            params: { lang: i18n.language },
          }),
          apiClient.get("/options/section/profile_identity_section", {
            params: { lang: i18n.language },
          }),
        ]);
        if (cancelled) return;

        console.log("[i18n] Languages section response:", langRes.data);
        console.log(
          "[i18n] Relationship status section response:",
          relRes.data,
        );
        console.log(
          "[i18n] Profile control section response:",
          controlRes.data,
        );
        console.log("[i18n] Profile health section response:", healthRes.data);
        console.log(
          "[i18n] Profile personality section response:",
          personalityRes.data,
        );
        console.log("[i18n] Profile music section response:", musicRes.data);
        console.log(
          "[i18n] Profile professional section response:",
          professionalRes.data,
        );
        console.log(
          "[i18n] Profile additional section response:",
          additionalRes.data,
        );
        console.log(
          "[i18n] API additionalRes height.title:",
          additionalRes.data?.["height.title"],
        );

        // Normalize flat dotted keys (e.g. "height.title") to nested objects ({ height: { title } })
        const nestDotted = (obj: Record<string, unknown>) => {
          const out: Record<string, unknown> = {};
          for (const [flat, val] of Object.entries(obj || {})) {
            const parts = String(flat).split(".");
            let cur: Record<string, unknown> = out as Record<string, unknown>;
            for (let i = 0; i < parts.length; i++) {
              const p = parts[i];
              if (i === parts.length - 1) {
                cur[p] = val;
              } else {
                cur[p] = cur[p] && typeof cur[p] === "object" ? cur[p] : {};
                cur = cur[p] as Record<string, unknown>;
              }
            }
          }
          return out;
        };

        // Merge into i18n resource store with proper nested structure
        // Note: goals + about keys (fields.goals, aboutMe, safety.title, etc.)
        // merge flat under profile.* alongside the section subtrees.
        const apiProfileResources = {
          location: nestDotted(locationRes.data),
          languages: nestDotted(langRes.data),
          relationship: nestDotted(relRes.data),
          control: nestDotted(controlRes.data),
          health: nestDotted(healthRes.data),
          personality: nestDotted(personalityRes.data),
          music: nestDotted(musicRes.data),
          professional: nestDotted(professionalRes.data),
          additional: nestDotted(additionalRes.data),
          cognitive: nestDotted(cognitiveRes.data),
          pronouns: nestDotted(pronounsRes.data),
            ...nestDotted(goalsRes.data),
            ...nestDotted(aboutRes.data),
            ...nestDotted(identityRes.data),
          };
        console.log(
          "[i18n] nestDotted additional height.title:",
          (apiProfileResources.additional as any)?.height?.title,
        );

        // Get existing bundle and deep-merge profile section so static keys (auth, dashboard, menu_*, etc.) are preserved
        const existingBundle =
          i18n.getResourceBundle(i18n.language, "common") || {};
        const mergedBundle = JSON.parse(JSON.stringify(existingBundle)); // deep clone
        mergedBundle.profile = {
          ...(mergedBundle.profile || {}),
          ...apiProfileResources,
        };
        // Partner keys live under profileSections.partner.* (used by PartnerManager)
        const nestedPartner = nestDotted(partnerRes.data);
        // Interests keys live under profileSections.interests.* (used by LifestyleInterests)
        const nestedInterests = nestDotted(interestsRes.data);
        mergedBundle.profileSections = {
          ...(mergedBundle.profileSections || {}),
          partner: {
            ...((mergedBundle.profileSections || {}).partner || {}),
            ...nestedPartner,
          },
          interests: {
            ...((mergedBundle.profileSections || {}).interests || {}),
            ...nestedInterests,
          },
        };

        const hasAnyProfileData =
          Object.values(apiProfileResources).some(
            (v) => v && Object.keys(v).length > 0,
          ) ||
          (partnerRes.data && Object.keys(partnerRes.data).length > 0);
        if (hasAnyProfileData) {
          i18n.addResourceBundle(
            i18n.language,
            "common",
            mergedBundle,
            true,
            true,
          );
          console.log(
            "[i18n] Merged profile resources into common for:",
            i18n.language,
          );
          console.log(
            "[i18n] after addResourceBundle height.title:",
            (i18n.store as any)?.data?.[i18n.language]?.common?.profile
              ?.additional?.height?.title,
          );
          const bundle = i18n.getResourceBundle(i18n.language, "common");
          const profileKeys = bundle?.profile
            ? Object.keys(bundle.profile).sort()
            : [];
          console.log("[i18n] profile.* keys after merge:", profileKeys);
          // Force full reload so all useTranslation hooks pick up the new bundle
          await i18n.reloadResources(i18n.language, "common");
          console.log(
            "[i18n] after reload hasResourceBundle:",
            i18n.hasResourceBundle(i18n.language, "common"),
          );
          console.log(
            "[i18n] after reload store keys:",
            Object.keys(i18n.store?.data?.[i18n.language]?.common || {}),
          );
          console.log(
            "[i18n] after reload profile.additional.height.title:",
            i18n.getResourceBundle(i18n.language, "common")?.profile?.additional
              ?.height?.title,
          );
          console.log(
            "[i18n] language vs resolved:",
            i18n.language,
            "vs",
            (i18n as any).resolvedLanguage,
          );
          console.log(
            "[i18n] t() resolves to:",
            i18n.t("profile.additional.height.title", { lng: i18n.language }),
          );
        } else {
          console.warn(
            "[i18n] No profile resources returned for language:",
            i18n.language,
          );
        }
        setSectionTextsLoaded(true);
      } catch (err) {
        console.warn("Failed to load section texts:", err);
        setSectionTextsLoaded(true);
      }
    };

    loadSectionTexts();
    return () => {
      cancelled = true;
    };
  }, [i18n, i18n.language, sectionTextsLoaded]);

  // Reset sectionTextsLoaded when language changes so effect re-runs
  useEffect(() => {
    const handler = () => {
      console.log(
        "[i18n] Language changed via event, resetting sectionTextsLoaded",
      );
      setSectionTextsLoaded(false);
    };
    i18n.on("languageChanged", handler);
    return () => i18n.off("languageChanged", handler);
  }, [i18n]);

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  useEffect(() => {
    if (!router.isReady) return;

    // Wait for auth initialization to complete
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    const initData = async () => {
      try {
        // Fetch options with current language
        const lang = i18n.language || "es";
        const optionsRes = await apiClient.get(`/options?lang=${lang}`);
        setOptions(optionsRes.data);

        // Fetch profile
        const profileRes = await apiClient.get("/profiles/me");
        setProfile(profileRes.data);

        // Verify ownership (optional but good for UX)
        // If the URL nickname doesn't match current user's nickname, we could redirect
        // But since we fetch /profiles/me, we are editing the logged-in user regardless of URL
        // Ideally we should redirect if URL is wrong to avoid confusion
        const currentNickname =
          profileRes.data.nickname || profileRes.data.user_id;
        const urlNickname = (nickname as string)?.replace("@", "");

        if (urlNickname && currentNickname !== urlNickname) {
          // Redirect to correct URL
          router.replace(`/profile/@${currentNickname}/edit`);
        }
      } catch (err: any) {
        console.error("Failed to load data", err);
        if (err.response?.status === 404) {
          // Create mode
          setProfile({});
          showNotification(
            t("profile.create", "Por favor completa tu perfil"),
            "success",
          );
        } else {
          showNotification("Failed to load profile data", "error");
          setProfile({});
        }
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [isAuthenticated, isInitialized, router.isReady, i18n.language]);

  const handleSave = async (data: any) => {
    try {
      console.log("Saving profile with data:", data);
      const res = await apiClient.put("/profiles/me", data);
      setProfile(res.data);

      // Update avatar in Redux - fetch from media endpoint
      try {
        const mediaResponse = await apiClient.get(`/media/${res.data.user_id}`);
        const photoItems = mediaResponse.data.filter(
          (item: any) => item.type?.toLowerCase() === "photo",
        );
        if (photoItems.length > 0) {
          dispatch(updateUserAvatar(photoItems[0].url));
        } else if (res.data.photos && res.data.photos.length > 0) {
          // Fallback to photos array if no media items
          dispatch(updateUserAvatar(res.data.photos[0]));
        }
      } catch (mediaError) {
        console.error("Failed to update avatar in Redux:", mediaError);
        // Fallback to photos array
        if (res.data.photos && res.data.photos.length > 0) {
          dispatch(updateUserAvatar(res.data.photos[0]));
        }
      }

      // Show success message
      showNotification(
        t("profile.saved", "Perfil actualizado correctamente"),
        "success",
      );
    } catch (err: any) {
      console.error("Failed to update profile", err);
      showNotification(
        t("common.error", "Error al actualizar perfil"),
        "error",
      );
      throw err;
    }
  };

  const handleBack = () => {
    if (profile) {
      const currentNickname = profile.nickname || profile.user_id;
      router.push(`/profile/@${currentNickname}`);
    } else {
      router.back();
    }
  };

  const showNotification = (message: string, severity: "success" | "error") => {
    setNotification({ open: true, message, severity });
  };

  if (loading) {
    return (
      <Layout>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (!sectionTextsLoaded) {
    return (
      <Layout>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="md">
        <ProfileEdit
          profile={profile}
          options={options}
          onSave={handleSave}
          onBack={handleBack}
        />

        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification({ ...notification, open: false })}
        >
          <Alert
            severity={notification.severity}
            onClose={() => setNotification({ ...notification, open: false })}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </Layout>
  );
}

export async function getServerSideProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale || "es", ["common"])),
    },
  };
}
