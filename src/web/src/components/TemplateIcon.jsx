import { Activity, Wind } from "lucide-react";

export default function TemplateIcon({ kind }) {
  if (kind === "cardio") return <Activity />;
  if (kind === "mobility") return <Wind />;
  if (kind === "core") return <span className="template-symbol">◎</span>;
  return <span className="template-symbol">↗</span>;
}
