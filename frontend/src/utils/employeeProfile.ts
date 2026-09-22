// Mapeo unificado de datos de perfil: Mi perfil y EmployeeEditForm leen/escriben
// el MISMO registro de empleado (GET/PUT /portal-redthread/auth/me y /empleados/{id}).

export interface EmployeeProfile {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  birth_date: string; // YYYY-MM-DD
  country: string;
  city: string;
  address: string;
  avatar: string | null;
}

export const EMPTY_PROFILE: EmployeeProfile = {
  id: '',
  employee_id: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  birth_date: '',
  country: '',
  city: '',
  address: '',
  avatar: null,
};

/** Normaliza cualquier payload de empleado (auth/me o empleados/{id}) a EmployeeProfile. */
export function mapApiToProfile(data: Record<string, any> | null | undefined): EmployeeProfile {
  const e = data || {};
  return {
    id: e.id || '',
    employee_id: e.employee_id || e.id || '',
    first_name: e.first_name || '',
    last_name: e.last_name || '',
    email: e.email || '',
    phone: e.phone || '',
    birth_date: String(e.birth_date || '').split('T')[0],
    country: e.country || '',
    city: e.city || '',
    address: e.address || e.street || '',
    avatar: e.avatar || null,
  };
}

/** Campos editables enviados a PUT /auth/me o PUT /empleados/{id}. */
export function profileToUpdatePayload(profile: EmployeeProfile): Record<string, string | null> {
  return {
    first_name: profile.first_name.trim(),
    last_name: profile.last_name.trim(),
    email: profile.email.trim(),
    phone: profile.phone.trim(),
    birth_date: profile.birth_date || null,
    country: profile.country.trim(),
    city: profile.city.trim(),
    address: profile.address.trim(),
  };
}

/** Validación compartida. `requireAvatar` solo en Mi perfil; el form admin deja la foto opcional. */
export function validateProfile(
  profile: EmployeeProfile,
  opts: { requireAvatar?: boolean; hasAvatar?: boolean } = {},
): string | null {
  const { requireAvatar = false, hasAvatar = false } = opts;
  if (!profile.first_name.trim()) return 'El nombre es obligatorio.';
  if (!profile.last_name.trim()) return 'El apellido es obligatorio.';
  if (!profile.email.trim()) return 'El correo es obligatorio.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) return 'El correo no es válido.';
  if (requireAvatar && !hasAvatar && !profile.avatar) return 'La foto oficial es obligatoria (JPG/PNG 1:1).';
  return null;
}
