import { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  TextField,
} from "@mui/material";
import useDebounce from "../../hooks/useDebounce";
import adminApiClient from "../../services/adminApi";

export interface SearchUser {
  id: string;
  email: string | null;
  display_name: string;
  nickname: string;
  photo: string | null;
}

interface UserSearchAutocompleteProps {
  label?: string;
  value: SearchUser | null;
  onChange: (user: SearchUser | null) => void;
  excludeId?: string | null;
  placeholder?: string;
  isDark?: boolean;
}

export default function UserSearchAutocomplete({
  label,
  value,
  onChange,
  excludeId = null,
  placeholder = "Buscar usuario por nombre o alias",
  isDark = false,
}: UserSearchAutocompleteProps) {
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(inputValue, 300);

  useEffect(() => {
    let active = true;
    const query = debouncedQuery.trim();

    if (query.length < 2) {
      return;
    }

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await adminApiClient.get(
          "/portal-redthread/usuarios/listado",
          { params: { search: query, limit: 10 } },
        );
        if (active) {
          setOptions(response.data?.users ?? []);
        }
      } catch {
        if (active) setOptions([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchUsers();
    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  const query = debouncedQuery.trim();
  const visibleOptions =
    query.length < 2
      ? []
      : excludeId
        ? options.filter((option) => option.id !== excludeId)
        : options;

  const selectedValue = useMemo(() => (value ? [value] : []), [value]);

  return (
    <Autocomplete<SearchUser, true, false, false>
      multiple
      openOnFocus
      options={visibleOptions}
      value={selectedValue}
      getOptionLabel={(option) => option.display_name || option.nickname}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      loading={loading}
      filterOptions={(opts) => opts}
      onInputChange={(_, newValue) => setInputValue(newValue)}
      onChange={(_, selected) => {
        const last = selected.length > 0 ? selected[selected.length - 1] : null;
        onChange(last ?? null);
      }}
      slotProps={{
        paper: {
          sx: isDark
            ? {
                bgcolor: "#1E1E1E",
                color: "#FFFFFF",
                "& .MuiAutocomplete-option": {
                  "&:hover, &.Mui-focused": {
                    bgcolor: "rgba(76,175,80,0.18)",
                  },
                },
              }
            : undefined,
        },
      }}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              width: "100%",
              minWidth: 0,
            }}
          >
            <Avatar
              src={option.photo ?? undefined}
              sx={{
                width: 28,
                height: 28,
                fontSize: "0.8rem",
                bgcolor: "primary.main",
              }}
            >
              {(option.display_name || option.nickname || "?")
                .charAt(0)
                .toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {option.display_name}
              </Box>
              <Box sx={{ fontSize: "0.75rem", opacity: 0.7 }}>
                @{option.nickname}
                {option.email ? ` · ${option.email}` : ""}
              </Box>
            </Box>
          </Box>
        </li>
      )}
      renderValue={(selected) =>
        selected.map((option) => (
          <Chip
            key={option.id}
            size="small"
            variant="outlined"
            avatar={
              <Avatar
                src={option.photo ?? undefined}
                sx={{
                  width: 22,
                  height: 22,
                  fontSize: "0.7rem",
                  bgcolor: "primary.main",
                }}
              >
                {(option.display_name || option.nickname || "?")
                  .charAt(0)
                  .toUpperCase()}
              </Avatar>
            }
            label={option.display_name || option.nickname}
            onDelete={() => onChange(null)}
          />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          size="small"
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              endAdornment: (
                <>
                  {loading ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.slotProps.input.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
}
