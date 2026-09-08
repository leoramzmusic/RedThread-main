import { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';

// Base props for all section components
export interface BaseSectionProps {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  isDiscovery?: boolean;
}

// Props for sections that need options from backend
export interface SectionWithOptionsProps extends BaseSectionProps {
  options: any;
}

// Props for sections with translation
export interface SectionWithTranslationProps extends BaseSectionProps {
  t: (key: string, fallback?: string) => string;
}

// Prompt item structure
export interface PromptItem {
  question: string;
  answer: string;
}

// Drawer props
export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  isDragging: boolean;
  dragOffsetY: number;
  handleDragStart: (e: React.MouseEvent | React.TouchEvent) => void;
}

// Profile data structure (partial)
export interface ProfileData {
  nickname?: string;
  email?: string;
  phone?: string;
  country_code?: string;
  phone_verified?: boolean;
  verified?: boolean;
  identity_verification_status?: 'none' | 'pending' | 'approved' | 'rejected';
  identity_document_url?: string;
  identity_document_type?: string;
  identity_rejection_reason?: string;
  photos?: string[];
  loops?: string[];
  lifestyle_interests?: string[];
  prompts?: PromptItem[];
  relationship_status?: string;
  [key: string]: any;
}
