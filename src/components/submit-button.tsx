"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

type SubmitButtonProps = {
    label: string;
    disabled?: boolean;
};

export function SubmitButton({ label, disabled }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending}>
      {pending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
      {label}
    </Button>
  );
}
