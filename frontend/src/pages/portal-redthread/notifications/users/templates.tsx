import TemplatesManager from "../../../../components/notifications/TemplatesManager";

export default function UsersTemplatesPage() {
  return (
    <TemplatesManager
      apiBase="/notifications/users/templates"
      subtitle="Gestiona plantillas reutilizables para usuarios."
    />
  );
}
