import React from "react";
import type { ProfileTipData } from "../../hooks/useProfileTip";
import CarouselTip from "./tips/CarouselTip";
import DrawerTip from "./tips/DrawerTip";
import StepperTip from "./tips/StepperTip";
import DialogTip from "./tips/DialogTip";

interface TipRendererProps {
  tip?: ProfileTipData | null;
  onClose: () => void;
  fallback?: React.ReactNode;
  /** Admin-only: forwarded to CarouselTip for click-to-edit image slots. */
  editable?: boolean;
  onSlotClick?: (slideIndex: number, field: "ok" | "ko") => void;
  onSlotClear?: (slideIndex: number, field: "ok" | "ko") => void;
}

export default function TipRenderer({ tip, onClose, fallback, editable, onSlotClick, onSlotClear }: any) {
  if (!tip) return fallback ?? null;
  switch (tip.type) {
    case "carousel": return <CarouselTip tip={tip} onClose={onClose} editable={editable} onSlotClick={onSlotClick} onSlotClear={onSlotClear} />;
    case "drawer": return <DrawerTip tip={tip} onClose={onClose} />;
    case "stepper": return <StepperTip tip={tip} onClose={onClose} />;
    default: return <DialogTip tip={tip} onClose={onClose} />;
  }
}

export type { TipRendererProps };
