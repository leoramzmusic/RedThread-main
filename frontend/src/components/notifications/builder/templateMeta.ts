import { AppNotification } from "../../../hooks/useNotifications";

export interface NotificationVariableSample {
  name: string;
  sample: string;
}

export const SAMPLE_VARIABLES: Record<string, string> = {
  first_name: "Ana",
  nombre_match: "Carlos",
  nombre_usuario: "Lucía",
  ciudad: "Madrid",
  cuestionarios_pendientes: "7",
  titulo_anuncio: "Anuncio del sistema",
  mensaje: "Este es un mensaje de prueba",
  fecha_mantenimiento: "15 de enero",
  hora_inicio: "02:00",
  hora_fin: "06:00",
  matches_count: "3",
  care_remaining: "2",
  subscription_name: "RETH Premium",
};

export function substituteVariables(
  text: string | null | undefined,
  samples: Record<string, string> = SAMPLE_VARIABLES,
): string {
  if (!text) return "";
  return text.replace(/\{\{([^{}]+)\}\}/g, (_match, name) => {
    const trimmed = name.trim();
    if (trimmed in samples) return samples[trimmed];
    return `{{${trimmed}}}`;
  });
}

export function categoryToNotificationType(category: string): string {
  const map: Record<string, string> = {
    system: "system",
    match: "match",
    like: "like",
    message: "message",
    survey: "survey",
    reminder: "reminder",
    promo: "promo",
    security: "security",
  };
  return map[category] ?? "system";
}

export function buildPreviewNotification(form: {
  title: string;
  body: string;
  icon: string;
  category: string;
  priority: string;
  action_url?: string | null;
}): AppNotification {
  const body = substituteVariables(form.body);
  const type = categoryToNotificationType(form.category);
  const now = new Date().toISOString();
  return {
    id: "preview-notification",
    type,
    content: body,
    is_read: false,
    created_at: now,
    updated_at: now,
    category: form.category,
    priority: form.priority,
    required_action: false,
    critical: false,
    variables: [],
    user: { name: "Usuario RETH", photo: undefined },
    actors: [{ name: "Usuario RETH" }],
    pinned_at: undefined,
    metadata: { template: "custom", preview: body },
  } as unknown as AppNotification;
}
