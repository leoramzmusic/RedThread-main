import TemplatesManager from "../../../../components/notifications/TemplatesManager";

export default function EmployeesTemplatesPage() {
  return (
    <TemplatesManager
      apiBase="/notifications/employees/templates"
      subtitle="Gestiona plantillas reutilizables para empleados."
    />
  );
}
