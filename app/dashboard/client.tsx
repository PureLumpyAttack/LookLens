"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import Webcam from "react-webcam";
import { RawCamera } from "@/components/raw-camera";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Edit,
  EllipsisVertical,
  ImageUp,
  Menu,
  ShoppingCart,
  Star,
  Trash,
} from "lucide-react";
import {
  ResponsiveSheet,
  ResponsiveSheetTrigger,
  ResponsiveSheetContent,
  ResponsiveSheetHeader,
  ResponsiveSheetTitle,
  ResponsiveSheetDescription,
} from "@/components/ui/responsive-sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    const updateMatch = () => {
      setIsMobile(mediaQuery.matches);
    };

    updateMatch();
    mediaQuery.addEventListener("change", updateMatch);

    return () => {
      mediaQuery.removeEventListener("change", updateMatch);
    };
  }, [breakpoint]);

  return isMobile;
}

export default function DashboardPage() {
  const cameraRef = useRef<Webcam>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [cameraAttempt, setCameraAttempt] = useState(0);

  const { user } = useUser();
  const isMobile = useIsMobile();
  const savedMakeups = [
    {
      id: "natural-glow",
      name: "Natural Glow",
      rating: "4/5 stars",
      price: "$67",
    },
  ];

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-black">
      {permissionDenied && (
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Allow Camera Usage</AlertDialogTitle>
              <AlertDialogDescription>
                Please allow your browser to use the camera
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={() => {
                  setPermissionDenied(false);
                  setCameraAttempt(cameraAttempt + 1);
                }}
              >
                Retry
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <div className="absolute right-5 top-5 z-10 flex flex-row items-center justify-center gap-3 rounded-xl border bg-secondary px-4 py-2 text-secondary-foreground">
        <div>
          <p>{user?.firstName}</p>
        </div>
        <UserButton />
      </div>

      <div className="absolute inset-0 overflow-hidden bg-black">
        <RawCamera
          ref={cameraRef}
          key={cameraAttempt}
          className="size-full object-cover"
          videoConstraints={isMobile ? { aspectRatio: 9 / 16 } : undefined}
          onUserMedia={() => {
            setPermissionDenied(false);
          }}
          onUserMediaError={(error) => {
            if (typeof error === "string") {
              console.log(error);
              return;
            }

            if (
              error.name === "NotAllowedError" ||
              error.name === "PermissionDeniedError"
            ) {
              setPermissionDenied(true);
            }
          }}
        />
      </div>

      <div className="absolute bottom-8 z-10 flex w-full items-center justify-center gap-3">
        <div className="flex flex-row gap-4">
          <Button size={"lg"} className="h-14 w-14 rounded-2xl">
            <ImageUp className="size-6" />
          </Button>
          <Button size={"lg"} className="h-14 px-8 rounded-2xl text-base">
            Take Picture
          </Button>
          <ResponsiveSheet mobileDirection="bottom">
            <ResponsiveSheetTrigger asChild>
              <Button size={"lg"} className="h-14 w-14 rounded-2xl">
                <Menu className="size-6" />
              </Button>
            </ResponsiveSheetTrigger>
            <ResponsiveSheetContent
              side="right"
              className="gap-0 sm:max-w-2xl"
              mobileClassName="h-[85dvh]"
            >
              <ResponsiveSheetHeader>
                <ResponsiveSheetTitle>Saved Makeups</ResponsiveSheetTitle>
                <ResponsiveSheetDescription>
                  A List of your saved makeups.
                </ResponsiveSheetDescription>
              </ResponsiveSheetHeader>

              <div className="flex flex-1 flex-col gap-4 px-4 pb-4">
                {savedMakeups.map((makeup) => (
                  <div key={makeup.id} className="relative">
                    <Card className="gap-0 py-0 border">
                      <CardContent className="grid min-h-28 grid-cols-[96px_1px_minmax(0,1fr)] px-0">
                        <div className="text-sm text-muted-foreground">
                          <img
                            src={""}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Separator orientation="vertical" />
                        <div className="flex items-center justify-between gap-4 p-4">
                          <div className="min-w-0 space-y-1">
                            <p className="truncate text-lg font-medium text-foreground">
                              {makeup.name}
                            </p>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    "size-4",
                                    i < parseInt(makeup.rating)
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "fill-muted text-muted",
                                  )}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <p className="text-lg font-medium text-foreground">
                              {makeup.price}
                            </p>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  className="rounded-full"
                                >
                                  <EllipsisVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                className={"border z-20 min-w-40"}
                              >
                                <DropdownMenuGroup>
                                  <DropdownMenuLabel>
                                    Products
                                  </DropdownMenuLabel>
                                  <DropdownMenuItem>
                                    <ShoppingCart /> Order Products
                                  </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                  <DropdownMenuLabel>
                                    Managing
                                  </DropdownMenuLabel>
                                  <DropdownMenuItem>
                                    <Edit />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem variant="destructive">
                                    <Trash />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </ResponsiveSheetContent>
          </ResponsiveSheet>
        </div>
      </div>
    </main>
  );
}
