import TemplatesManager from "../../../../components/notifications/TemplatesManager";

export default function BrandsTemplatesPage() {
  return (
    <TemplatesManager
      apiBase="/notifications/brands/templates"
      subtitle="Gestiona plantillas reutilizables para marcas."
    />
  );
}
