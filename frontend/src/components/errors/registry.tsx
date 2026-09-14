import { RED } from '../../styles/glass';

export type ThreadOrnament =
  | 'broken' // 404 — el hilo se cortó
  | 'forbidden' // 403 — hilo atado/candado
  | 'unauthorized' // 401 — aguja sin hilo
  | 'server' // 500 — nudo enredado
  | 'badgateway' // 502 — el hilo rebota en el puente
  | 'unavailable' // 503 — telar en mantenimiento
  | 'timeout' // 408 — el hilo se arrastra
  | 'unprocessable'; // 422 — puntada inválida

export type ErrorCtaAction = 'push' | 'back' | 'reload';

export interface ErrorCta {
  i18n: string;
  default: string;
  href: string;
  action?: ErrorCtaAction;
}

export interface ErrorMeta {
  code: number;
  ornament: ThreadOrnament;
  /** Color del glow e ilustración (narrativa del telar). */
  accent: string;
  titleKey: string;
  defaultTitle: string;
  narrativeKey: string;
  defaultNarrative: string;
  primary: ErrorCta;
  /** Si se define, muestra el secundario (router.back()). */
  secondary?: ErrorCta;
}

export const ERROR_REGISTRY: Record<number, ErrorMeta> = {
  404: {
    code: 404,
    ornament: 'broken',
    accent: RED,
    titleKey: 'errors.404.title',
    defaultTitle: 'Este hilo se perdió',
    narrativeKey: 'errors.404.narrative',
    defaultNarrative:
      'La página que buscas no está en este telar. Quizá se movió, se cortó o se tejió en otro lugar.',
    primary: { i18n: 'errors.goHome', default: 'Volver al inicio', href: '/home' },
    secondary: { i18n: 'errors.back', default: 'Volver atrás', href: '', action: 'back' },
  },
  403: {
    code: 403,
    ornament: 'forbidden',
    accent: '#FF8A3D',
    titleKey: 'errors.403.title',
    defaultTitle: 'Este hilo está sellado',
    narrativeKey: 'errors.403.narrative',
    defaultNarrative:
      'No tienes acceso a este tramo de la red. Si crees que es un error, vuelve a intentar o pide permiso.',
    primary: { i18n: 'errors.goHome', default: 'Volver al inicio', href: '/home' },
  },
  401: {
    code: 401,
    ornament: 'unauthorized',
    accent: '#3B82F6',
    titleKey: 'errors.401.title',
    defaultTitle: 'Tu hilo se quedó dormido',
    narrativeKey: 'errors.401.narrative',
    defaultNarrative:
      'Necesitas iniciar sesión para seguir tejiendo. Tu historia aún te espera donde la dejaste.',
    primary: { i18n: 'errors.login', default: 'Iniciar sesión', href: '/auth' },
  },
  500: {
    code: 500,
    ornament: 'server',
    accent: '#EF4444',
    titleKey: 'errors.500.title',
    defaultTitle: 'El telar se enredó',
    narrativeKey: 'errors.500.narrative',
    defaultNarrative:
      'Algo no salió bien de nuestro lado. Ya tejimos un aviso; vuelve a intentarlo en unos momentos.',
    primary: { i18n: 'errors.goHome', default: 'Volver al inicio', href: '/home' },
    secondary: { i18n: 'errors.retry', default: 'Reintentar', href: '', action: 'reload' },
  },
  502: {
    code: 502,
    ornament: 'badgateway',
    accent: '#8B5CF6',
    titleKey: 'errors.502.title',
    defaultTitle: 'El puente está tenso',
    narrativeKey: 'errors.502.narrative',
    defaultNarrative:
      'Uno de nuestros servidores no respondió bien al pasar el hilo. Inténtalo de nuevo en unos segundos.',
    primary: { i18n: 'errors.goHome', default: 'Volver al inicio', href: '/home' },
    secondary: { i18n: 'errors.retry', default: 'Reintentar', href: '', action: 'reload' },
  },
  503: {
    code: 503,
    ornament: 'unavailable',
    accent: '#10B981',
    titleKey: 'errors.503.title',
    defaultTitle: 'Estamos retocando el telar',
    narrativeKey: 'errors.503.narrative',
    defaultNarrative:
      'Red Thread está en mantenimiento por un momento. Tu hilo queda guardado; pronto seguimos tejiendo.',
    primary: { i18n: 'errors.goHome', default: 'Volver al inicio', href: '/home' },
  },
  408: {
    code: 408,
    ornament: 'timeout',
    accent: '#F59E0B',
    titleKey: 'errors.408.title',
    defaultTitle: 'El hilo se está arrastrando',
    narrativeKey: 'errors.408.narrative',
    defaultNarrative:
      'La conexión tardó demasiado en responder. Revisa tu red y vuelve a intentarlo; la hebra no se escapa.',
    primary: { i18n: 'errors.retry', default: 'Reintentar', href: '', action: 'reload' },
  },
  422: {
    code: 422,
    ornament: 'unprocessable',
    accent: '#F59E0B',
    titleKey: 'errors.422.title',
    defaultTitle: 'Esta puntada no encaja',
    narrativeKey: 'errors.422.narrative',
    defaultNarrative:
      'Algunos datos que enviaste no son válidos. Revisa los campos señalados y vuelve a intentarlo.',
    primary: { i18n: 'errors.back', default: 'Volver atrás', href: '', action: 'back' },
  },
};

export function isErrorCode(value: number): value is keyof typeof ERROR_REGISTRY {
  return value in ERROR_REGISTRY;
}

export function getErrorMeta(code: number): ErrorMeta {
  return ERROR_REGISTRY[code] ?? ERROR_REGISTRY[404];
}