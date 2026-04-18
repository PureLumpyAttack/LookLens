"use client"

import * as React from "react"

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type ResponsiveSheetContextValue = {
  isDesktop: boolean
}

const ResponsiveSheetContext =
  React.createContext<ResponsiveSheetContextValue | null>(null)

function useResponsiveSheetContext() {
  const context = React.useContext(ResponsiveSheetContext)

  if (!context) {
    throw new Error(
      "ResponsiveSheet components must be used within <ResponsiveSheet />"
    )
  }

  return context
}

function useMediaQuery(query: string) {
  const subscribe = React.useCallback((onStoreChange: () => void) => {
    const mediaQuery = window.matchMedia(query)

    mediaQuery.addEventListener("change", onStoreChange)
    return () => mediaQuery.removeEventListener("change", onStoreChange)
  }, [query])

  const getSnapshot = React.useCallback(
    () => window.matchMedia(query).matches,
    [query]
  )

  return React.useSyncExternalStore(subscribe, getSnapshot, () => false)
}

type ResponsiveSheetProps = {
  children: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
  dismissible?: boolean
  desktopBreakpoint?: string
  mobileDirection?: "top" | "right" | "bottom" | "left"
}

function ResponsiveSheet({
  children,
  desktopBreakpoint = "(min-width: 768px)",
  mobileDirection = "bottom",
  dismissible,
  ...props
}: ResponsiveSheetProps) {
  const isDesktop = useMediaQuery(desktopBreakpoint)

  return (
    <ResponsiveSheetContext.Provider value={{ isDesktop }}>
      {isDesktop ? (
        <Sheet {...props}>{children}</Sheet>
      ) : (
        <Drawer dismissible={dismissible} direction={mobileDirection} {...props}>
          {children}
        </Drawer>
      )}
    </ResponsiveSheetContext.Provider>
  )
}

type ResponsiveSheetTriggerProps = React.ComponentProps<typeof SheetTrigger> & {
  asChild?: boolean
}

function ResponsiveSheetTrigger({
  asChild,
  ...props
}: ResponsiveSheetTriggerProps) {
  const { isDesktop } = useResponsiveSheetContext()

  return isDesktop ? (
    <SheetTrigger asChild={asChild} {...props} />
  ) : (
    <DrawerTrigger asChild={asChild} {...props} />
  )
}

function ResponsiveSheetClose(props: React.ComponentProps<typeof SheetClose>) {
  const { isDesktop } = useResponsiveSheetContext()

  return isDesktop ? <SheetClose {...props} /> : <DrawerClose {...props} />
}

type ResponsiveSheetContentProps = {
  children?: React.ReactNode
  className?: string
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
  mobileClassName?: string
  desktopClassName?: string
}

function ResponsiveSheetContent({
  children,
  className,
  mobileClassName,
  desktopClassName,
  side = "right",
  showCloseButton = true,
  ...props
}: ResponsiveSheetContentProps) {
  const { isDesktop } = useResponsiveSheetContext()

  return isDesktop ? (
    <SheetContent
      side={side}
      showCloseButton={showCloseButton}
      className={cn(className, desktopClassName)}
      {...props}
    >
      {children}
    </SheetContent>
  ) : (
    <DrawerContent className={cn(className, mobileClassName)}>
      {children}
    </DrawerContent>
  )
}

function ResponsiveSheetHeader(props: React.ComponentProps<"div">) {
  const { isDesktop } = useResponsiveSheetContext()

  return isDesktop ? <SheetHeader {...props} /> : <DrawerHeader {...props} />
}

function ResponsiveSheetFooter(props: React.ComponentProps<"div">) {
  const { isDesktop } = useResponsiveSheetContext()

  return isDesktop ? <SheetFooter {...props} /> : <DrawerFooter {...props} />
}

function ResponsiveSheetTitle(
  props: React.ComponentProps<typeof SheetTitle>
) {
  const { isDesktop } = useResponsiveSheetContext()

  return isDesktop ? <SheetTitle {...props} /> : <DrawerTitle {...props} />
}

function ResponsiveSheetDescription(
  props: React.ComponentProps<typeof SheetDescription>
) {
  const { isDesktop } = useResponsiveSheetContext()

  return isDesktop ? (
    <SheetDescription {...props} />
  ) : (
    <DrawerDescription {...props} />
  )
}

export {
  ResponsiveSheet,
  ResponsiveSheetTrigger,
  ResponsiveSheetClose,
  ResponsiveSheetContent,
  ResponsiveSheetHeader,
  ResponsiveSheetFooter,
  ResponsiveSheetTitle,
  ResponsiveSheetDescription,
}
