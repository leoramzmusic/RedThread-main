import {
  FormControl,
  IconButton,
  InputLabel,
  ListSubheader,
  MenuItem,
  Select,
  Stack,
  Tooltip,
} from "@mui/material";
import BookmarkAddIcon from "@mui/icons-material/BookmarkAdd";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import type { ProfileView } from "../../utils/careProfileModel";

export interface CareProfilesPanelProps {
  profiles: ProfileView[];
  selectedId: string | null;
  /** True when the draft no longer equals the selected profile. */
  modified: boolean;
  loading?: boolean;
  onSelect: (id: string) => void;
  onSaveAs: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}

/**
 * Presentational selector for formula profiles (recommended + saved).
 * Emits intent only — the container page owns state and network calls.
 */
export default function CareProfilesPanel({
  profiles,
  selectedId,
  modified,
  loading = false,
  onSelect,
  onSaveAs,
  onUpdate,
  onDelete,
}: CareProfilesPanelProps) {
  const builtins = profiles.filter((profile) => profile.builtin);
  const saved = profiles.filter((profile) => !profile.builtin);
  const selected =
    profiles.find((profile) => profile.id === selectedId) ?? null;
  const canManage = selected !== null && !selected.builtin;

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.5 }}>
      <FormControl size="small" sx={{ flexGrow: 1 }}>
        <InputLabel id="profile-select-label">Perfil</InputLabel>
        <Select
          labelId="profile-select-label"
          label="Perfil"
          data-testid="profile-select"
          value={selectedId ?? "__custom__"}
          disabled={loading}
          onChange={(event) => onSelect(event.target.value as string)}
          renderValue={() => {
            if (!selected) return <em>Personalizado</em>;
            return modified ? `${selected.name} (modificado)` : selected.name;
          }}
        >
          <MenuItem value="__custom__" sx={{ display: "none" }}>
            Personalizado
          </MenuItem>
          <ListSubheader>Recomendados</ListSubheader>
          {builtins.map((profile) => (
            <MenuItem
              key={profile.id}
              value={profile.id}
              data-testid={`profile-option-${profile.id}`}
            >
              {profile.name}
            </MenuItem>
          ))}
          <ListSubheader>Guardados</ListSubheader>
          {saved.length === 0 ? (
            <MenuItem disabled value="__empty__">
              Sin perfiles guardados
            </MenuItem>
          ) : (
            saved.map((profile) => (
              <MenuItem
                key={profile.id}
                value={profile.id}
                data-testid={`profile-option-${profile.id}`}
              >
                {profile.name}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      <Tooltip title="Guardar como perfil…">
        <IconButton
          data-testid="profile-save-as"
          size="small"
          onClick={onSaveAs}
          disabled={loading}
        >
          <BookmarkAddIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Actualizar perfil">
        <span>
          <IconButton
            data-testid="profile-update"
            size="small"
            onClick={onUpdate}
            disabled={!canManage}
          >
            <SaveIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Eliminar perfil">
        <span>
          <IconButton
            data-testid="profile-delete"
            size="small"
            color="error"
            onClick={onDelete}
            disabled={!canManage}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}
