"use client";

import { DeleteButton } from "@/components/ui/delete-button";

type DeletePackageTemplateButtonProps = {
  templateId: string;
  templateName: string;
};

export function DeletePackageTemplateButton({ templateId, templateName }: DeletePackageTemplateButtonProps) {
  return (
    <DeleteButton
      endpoint={`/api/packages/${templateId}`}
      confirmMessage={`Delete package template "${templateName}"? This action cannot be undone.`}
      title="Delete template"
    />
  );
}

