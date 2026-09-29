// key del backend (profile_modules.key) -> componente de sección.
// Para añadir una sección: 1) crear el componente, 2) registrarlo aquí,
// 3) crear el módulo en el admin con el mismo key.
import PhotosSection from '../edit/sections/PhotosSection';
import BasicInfoSection from '../edit/sections/BasicInfoSection';
import LocationSection from '../edit/sections/LocationSection';
import AboutMeSection from '../edit/sections/AboutMeSection';
import RelationshipGoalsSection from '../edit/sections/RelationshipGoalsSection';
import InterestsSection from '../edit/sections/InterestsSection';
import PronounsSection from '../edit/sections/PronounsSection';
import AdditionalDataSection from '../edit/sections/AdditionalDataSection';
import ProfessionalAcademicSection from '../edit/sections/ProfessionalAcademicSection';
import MusicSection from '../edit/sections/MusicSection';
import IdentitySection from '../edit/sections/IdentitySection';
import PersonalitySection from '../edit/sections/PersonalitySection';
import CognitiveSection from '../edit/sections/CognitiveSection';
import WellnessSection from '../edit/sections/WellnessSection';
import CivilStatusSection from '../edit/sections/CivilStatusSection';
import LanguagesSection from '../edit/sections/LanguagesSection';
export const PROFILE_SECTION_REGISTRY = {
  'section-photos': PhotosSection,
  'section-basic': BasicInfoSection,
  'section-location': LocationSection,
  'section-aboutme': AboutMeSection,
  'section-goals': RelationshipGoalsSection,
  'section-interests': InterestsSection,
  'section-pronouns': PronounsSection,
  'section-additional': AdditionalDataSection,
  'section-professional': ProfessionalAcademicSection,
  'section-music': MusicSection,
  'section-identity': IdentitySection,
  'section-personality': PersonalitySection,
  'section-cognitive': CognitiveSection,
  'section-wellness': WellnessSection,
  'section-status': CivilStatusSection,
  'section-languages': LanguagesSection,
} as const;
export type ProfileSectionKey = keyof typeof PROFILE_SECTION_REGISTRY;
