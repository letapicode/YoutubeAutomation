import { CaptionOptions } from '../features/processing';

export interface GenerateParams {
  file: string;
  output?: string;
  captions?: string;
  captionOptions?: CaptionOptions;
  background?: string;
  intro?: string;
  outro?: string;
  watermark?: string;
  watermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  width?: number;
  height?: number;
  title?: string;
  description?: string;
  tags?: string[];
  publishAt?: string;
}
