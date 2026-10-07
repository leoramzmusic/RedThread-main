import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import AuthLayout from "../components/auth/AuthLayout";
import apiClient from "../services/api";

type VerifyStatus = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const token = typeof router.query.token === "string" ? router.query.token : "";
  const missingToken = router.isReady && !token;

  const [status, setStatus] = useState<VerifyStatus>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!router.isReady || missingToken) return;

    let cancelled = false;
    apiClient
      .post("/auth/verify-email-token", { token })
      .then(() => {
        if (!cancelled) setStatus("success");
      })
      .catch((err: { response?: { status: number } }) => {
        if (cancelled) return;
        setStatus("error");
        setErrorMsg(
          err?.response?.status === 400
            ? t("auth.emailVerifyInvalid")
            : t("auth.emailVerifyError"),
        );
      });
    return () => {
      cancelled = true;
    };
  }, [router.isReady, missingToken, token, t]);

  return (
    <AuthLayout
      title={t("auth.emailVerifyTitle")}
      subtitle={t("auth.emailVerifySubtitle")}
    >
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: 240, width: "100%" }}
      >
        {status === "loading" && !missingToken && <CircularProgress />}

        {status === "success" && (
          <Alert severity="success" sx={{ width: "100%", borderRadius: 2 }}>
            {t("auth.emailVerifySuccess")}
          </Alert>
        )}

        {(missingToken || status === "error") && (
          <Alert severity="error" sx={{ width: "100%", borderRadius: 2 }}>
            {missingToken ? t("auth.emailVerifyMissingToken") : errorMsg}
          </Alert>
        )}

        {status === "success" && (
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            onClick={() => router.push("/profile")}
            sx={{ mt: 3 }}
          >
            {t("auth.emailVerifyGoToProfile")}
          </Button>
        )}

        {(missingToken || status === "error") && (
          <Typography variant="body2" sx={{ mt: 2, color: "rgba(255,255,255,0.85)" }}>
            {t("auth.emailVerifyResendHint")}
          </Typography>
        )}
      </Box>
    </AuthLayout>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}