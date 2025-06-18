export interface CaptionOptions {
  font?: string;
  fontPath?: string;
  style?: string;
  size?: number;
  position?: string;
  color?: string;
  background?: string;
}

export interface Profile {
  captions?: string;
  captionOptions?: CaptionOptions;
  background?: string;
  intro?: string;
  outro?: string;
  watermark?: string;
  watermarkPosition?: string;
  watermarkOpacity?: number;
  watermarkScale?: number;
  width?: number;
  height?: number;
  title?: string;
  description?: string;
  tags?: string[];
  publishAt?: string;
  thumbnail?: string;
  privacy?: string;
  playlistId?: string;
}

export interface GenerateParams {
  file: string;
  output?: string;
  captions?: string;
  captionOptions?: CaptionOptions;
  background?: string;
  intro?: string;
  outro?: string;
  watermark?: string;
  watermarkPosition?: string;
  watermarkOpacity?: number;
  watermarkScale?: number;
  width?: number;
  height?: number;
  title?: string;
  description?: string;
  tags?: string[];
  publishAt?: string;
  thumbnail?: string;
  privacy?: string;
  playlistId?: string;
}
