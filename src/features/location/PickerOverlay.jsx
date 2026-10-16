import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useMediaQuery } from "./useMediaQuery"

export default function PickerOverlay({
  open,
  onOpenChange,
  forced,
  title,
  description,
  children,
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  // While forced, clicking outside or pressing Esc must not close it.
  const lock = forced
    ? {
        onInteractOutside: (e) => e.preventDefault(),
        onEscapeKeyDown: (e) => e.preventDefault(),
      }
    : {}

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          {...lock}
          showCloseButton={!forced}
          className="max-h-[80vh] overflow-y-auto sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        {...lock}
        side="bottom"
        showCloseButton={!forced}
        className="max-h-[85vh] overflow-y-auto rounded-t-xl p-4"
      >
        <SheetHeader className="p-0">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="mt-3">{children}</div>
      </SheetContent>
    </Sheet>
  )
}
