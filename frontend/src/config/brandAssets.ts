export const BRAND_ASSETS = {
    imagotipoHorizontal: '/assets/imagotipo-horizontal.png',
    imagotipoVertical: '/assets/imagotipo-vertical.png',
    isotipo: '/assets/isotipo.png',
    appIcon: '/assets/app-icon.png',
    appIconMono: '/assets/app-icon-mono.png',
} as const;

export type BrandLogoVariant = 'main' | 'dark' | 'mobile';

export interface BrandLogoAsset {
    id: string;
    src: string;
    title: string;
    description: string;
    variant: BrandLogoVariant;
}

export const BRAND_LOGO_KIT: BrandLogoAsset[] = [
    {
        id: 'imagotipo-horizontal',
        src: BRAND_ASSETS.imagotipoHorizontal,
        title: 'Imagotipo horizontal',
        description: 'Logo principal para fondos claros',
        variant: 'main',
    },
    {
        id: 'imagotipo-vertical',
        src: BRAND_ASSETS.imagotipoVertical,
        title: 'Imagotipo vertical',
        description: 'Hero y portada',
        variant: 'main',
    },
    {
        id: 'isotipo',
        src: BRAND_ASSETS.isotipo,
        title: 'Isotipo',
        description: 'Marca compacta (hilo + corazón)',
        variant: 'dark',
    },
    {
        id: 'app-icon',
        src: BRAND_ASSETS.appIcon,
        title: 'App Icon',
        description: 'Icono de aplicación a color',
        variant: 'mobile',
    },
    {
        id: 'app-icon-mono',
        src: BRAND_ASSETS.appIconMono,
        title: 'App Icon monocromático',
        description: 'Favicon y usos en un solo color',
        variant: 'dark',
    },
];

export const DEFAULT_LOGO_BY_VARIANT: Record<BrandLogoVariant, string> = {
    main: BRAND_ASSETS.imagotipoHorizontal,
    dark: BRAND_ASSETS.isotipo,
    mobile: BRAND_ASSETS.appIcon,
};
