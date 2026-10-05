export { adminApiClient as default } from './api';
import { adminApiClient } from './api';

const TIPS_BASE = '/portal-redthread/profile-tips';

export interface AdminTipTranslation {
    title?: string;
    description?: string;
    trigger_button_text?: string;
    ok_label?: string;
    ko_label?: string;
}

export interface AdminTipSlide {
    order: number;
    translations?: Record<string, AdminTipTranslation>;
    ok_image_url?: string;
    ko_image_url?: string;
}

export interface AdminTip {
    tip_key: string;
    type: 'carousel' | 'drawer' | 'stepper' | 'dialog';
    section_key: string;
    translations?: Record<string, AdminTipTranslation>;
    slides?: AdminTipSlide[];
    is_active: boolean;
    order: number;
}

export const tipsApi = {
    list: () => adminApiClient.get(`${TIPS_BASE}/`).then((r) => r.data as AdminTip[]),
    create: (body: Partial<AdminTip>) =>
        adminApiClient.post(`${TIPS_BASE}/`, body).then((r) => r.data as AdminTip),
    update: (tipKey: string, body: Partial<AdminTip>) =>
        adminApiClient.patch(`${TIPS_BASE}/${tipKey}`, body).then((r) => r.data as AdminTip),
    remove: (tipKey: string) =>
        adminApiClient.delete(`${TIPS_BASE}/${tipKey}`).then((r) => r.data),
    reorder: (keys: string[]) =>
        adminApiClient.put(`${TIPS_BASE}/reorder`, { keys }).then((r) => r.data),
    uploadImage: (tipKey: string, file: File) => {
        const form = new FormData();
        form.append('file', file);
        return adminApiClient
            .post(`${TIPS_BASE}/${tipKey}/images`, form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            .then((r) => r.data as { url: string });
    },
};
