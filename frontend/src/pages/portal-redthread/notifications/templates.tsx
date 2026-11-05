import TemplatesManager from "../../../components/notifications/TemplatesManager";

export default function TemplatesPage() {
  return (
    <TemplatesManager
      apiBase="/notifications/users/templates"
      backTo="/portal-redthread"
    />
  );
}
