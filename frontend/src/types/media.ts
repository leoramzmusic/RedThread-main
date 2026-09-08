export enum MediaType {
  PHOTO = 'photo',
  VIDEO = 'video',
  TIKTOK = 'tiktok',
  INSTAGRAM = 'instagram',
}

export interface MediaItem {
  _id: string;
  user_id: string;
  type: MediaType;
  url: string;
  thumbnail_url?: string;
  caption?: string;
  order_index: number;
  created_at: string;
  external_id?: string;
}
