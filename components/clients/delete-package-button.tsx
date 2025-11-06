"use client";

import { DeleteButton } from "@/components/ui/delete-button";

type DeletePackageButtonProps = {
  packageId: string;
  packageType: string;
};

export function DeletePackageButton({ packageId, packageType }: DeletePackageButtonProps) {
  return (
    <DeleteButton
      endpoint={`/api/packages/${packageId}`}
      confirmMessage={`Delete package "${packageType}"? This action cannot be undone.`}
      title="Delete package"
    />
  );
}

