import { createFileRoute } from "@tanstack/react-router";
import { PoliciesPage } from "./policies";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "السياسات والشروط — NEOMART" },
      {
        name: "description",
        content: "السياسات الرسمية الموحدة للخصوصية والطلبات والشحن والضمان والدفع وشروط استخدام NEOMART.",
      },
    ],
  }),
  component: PoliciesPage,
});
