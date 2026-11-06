import TemplatesManager from "../../../components/notifications/TemplatesManager";

export default function NotificationsTemplatesPage() {
  return (
    <TemplatesManager
      apiBase="/notifications/users/templates"
      subtitle="Centro de Plantillas Global para usuarios, empleados y marcas."
    />
  );
}
