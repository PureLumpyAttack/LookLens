"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Webcam from "react-webcam";
import { RawCamera } from "@/components/raw-camera";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
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
import { uploadFiles } from "@/lib/uploadthing";
import { toast } from "sonner";
import {
  createProcessingTemplate,
  deleteSavedTemplate,
  renameSavedTemplate,
} from "./server";
import type { SavedMakeupView } from "./data";

function dataUrlToFile(dataUrl: string, fileName: string) {
  const [meta, content] = dataUrl.split(",");

  if (!meta || !content) {
    throw new Error("Invalid screenshot payload");
  }

  const mimeMatch = meta.match(/data:(.*?);base64/);
  const mime = mimeMatch?.[1] ?? "image/jpeg";
  const bytes = Uint8Array.from(atob(content), (char) => char.charCodeAt(0));

  return new File([bytes], fileName, { type: mime });
}

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

export default function DashboardPage({
  savedMakeups,
}: {
  savedMakeups: SavedMakeupView[];
}) {
  const cameraRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [cameraAttempt, setCameraAttempt] = useState(0);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<
    string | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  const triggerShutterFlash = () => {
    setIsFlashing(false);
    requestAnimationFrame(() => {
      setIsFlashing(true);
      window.setTimeout(() => setIsFlashing(false), 360);
    });
  };

  const { user } = useUser();
  const isMobile = useIsMobile();
  const router = useRouter();

  const [deleteTarget, setDeleteTarget] = useState<SavedMakeupView | null>(
    null,
  );
  const [renameTarget, setRenameTarget] = useState<SavedMakeupView | null>(
    null,
  );
  const [productsTarget, setProductsTarget] = useState<SavedMakeupView | null>(
    null,
  );
  const [renameValue, setRenameValue] = useState("");
  const [isMutating, setIsMutating] = useState(false);

  const openRenameDialog = (makeup: SavedMakeupView) => {
    setRenameTarget(makeup);
    setRenameValue(makeup.name);
  };

  const confirmRename = async () => {
    if (!renameTarget) {
      return;
    }

    const trimmed = renameValue.trim();

    if (!trimmed) {
      toast.error("Name can't be empty.");
      return;
    }

    setIsMutating(true);
    try {
      await renameSavedTemplate({ templateId: renameTarget.id, name: trimmed });
      toast.success("Renamed.");
      setRenameTarget(null);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Couldn't rename this look.");
    } finally {
      setIsMutating(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setIsMutating(true);
    try {
      await deleteSavedTemplate({ templateId: deleteTarget.id });
      toast.success("Deleted.");
      setDeleteTarget(null);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Couldn't delete this look.");
    } finally {
      setIsMutating(false);
    }
  };

  const handleOpenMakeup = (templateId: string) => {
    router.push(`/dashboard/makeup/${templateId}`);
  };

  useEffect(() => {
    return () => {
      if (selectedPhotoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(selectedPhotoPreview);
      }
    };
  }, [selectedPhotoPreview]);

  const clearSelectedPhoto = () => {
    if (selectedPhotoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(selectedPhotoPreview);
    }

    setSelectedPhotoFile(null);
    setSelectedPhotoPreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCapturePhoto = () => {
    const screenshot = cameraRef.current?.getScreenshot();

    if (!screenshot) {
      return;
    }

    if (selectedPhotoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(selectedPhotoPreview);
    }

    const file = dataUrlToFile(screenshot, `looklens-camera-${Date.now()}.jpg`);

    triggerShutterFlash();
    setSelectedPhotoFile(file);
    setSelectedPhotoPreview(screenshot);
  };

  const handleImportPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (selectedPhotoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(selectedPhotoPreview);
    }

    setSelectedPhotoFile(file);
    setSelectedPhotoPreview(URL.createObjectURL(file));
  };

  const handleConfirmPhoto = async () => {
    if (!selectedPhotoFile || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const processingTemplatePromise = (async () => {
        const uploadedFiles = await uploadFiles("userPhotoUploader", {
          files: [selectedPhotoFile],
        });

        const uploadedFile = uploadedFiles?.[0];
        const uploadedFileUrl =
          uploadedFile?.serverData?.ufsUrl ?? uploadedFile?.ufsUrl;

        if (!uploadedFileUrl) {
          throw new Error("Upload did not return a file URL");
        }

        return createProcessingTemplate({
          sourcePhotoUrl: uploadedFileUrl,
          sourcePhotoKey: uploadedFile.key ?? null,
        });
      })();

      toast.promise(processingTemplatePromise, {
        loading: "Starting your makeup analysis...",
        success: (processingTemplate) => {
          router.push(
            `/dashboard/makeup/${processingTemplate.templateId}/processing`,
          );
          router.refresh();

          return "Processing started.";
        },
        error: "We couldn't start processing.",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-dvh overflow-hidden bg-black">
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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImportPhoto}
      />

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

      {selectedPhotoPreview ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 p-6 pb-40 backdrop-blur-xl animate-in fade-in-0 duration-300">
          <div className="animate-shutter-capture relative overflow-hidden rounded-3xl border border-white/15 bg-black/50 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
            <img
              src={selectedPhotoPreview}
              alt="Selected makeup reference"
              className="max-h-[70vh] max-w-[min(90vw,520px)] object-contain"
            />
          </div>
        </div>
      ) : null}

      {isFlashing ? (
        <div className="animate-shutter-flash pointer-events-none absolute inset-0 z-100 bg-white" />
      ) : null}

      <div className="absolute bottom-8 z-10 flex w-full items-center justify-center gap-3">
        <div className="flex flex-row gap-4">
          <Button
            size={"lg"}
            className="h-14 w-14 rounded-2xl"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageUp className="size-6" />
          </Button>
          {selectedPhotoPreview ? (
            <>
              <Button
                size={"lg"}
                variant="secondary"
                className="h-14 px-8 rounded-2xl text-base"
                onClick={clearSelectedPhoto}
              >
                Retake
              </Button>
              <Button
                size={"lg"}
                className="h-14 px-8 rounded-2xl text-base"
                disabled={!selectedPhotoFile || isSubmitting}
                onClick={handleConfirmPhoto}
              >
                {isSubmitting ? "Confirming..." : "Confirm"}
              </Button>
            </>
          ) : (
            <Button
              size={"lg"}
              className="h-14 px-8 rounded-2xl text-base"
              onClick={handleCapturePhoto}
            >
              Take Picture
            </Button>
          )}
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
                {savedMakeups.length === 0 ? (
                  <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                    You haven&apos;t saved any looks yet.
                  </p>
                ) : null}
                {savedMakeups.map((makeup) => (
                  <div key={makeup.id} className="relative">
                    <Card
                      className="gap-0 py-0 border cursor-pointer"
                      onClick={() => handleOpenMakeup(makeup.id)}
                    >
                      <CardContent className="grid min-h-28 grid-cols-[96px_1px_minmax(0,1fr)] px-0">
                        <div className="overflow-hidden text-sm text-muted-foreground">
                          {makeup.previewImageUrl ? (
                            <img
                              src={makeup.previewImageUrl}
                              alt={`${makeup.name} preview`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted text-xs">
                              No preview
                            </div>
                          )}
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
                                    i < makeup.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "fill-muted text-muted",
                                  )}
                                />
                              ))}
                            </div>
                          </div>

                          <div
                            className="flex items-center gap-2"
                            onClick={(event) => event.stopPropagation()}
                          >
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
                                  <DropdownMenuItem
                                    onClick={() => setProductsTarget(makeup)}
                                  >
                                    <ShoppingCart /> Order Products
                                  </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                  <DropdownMenuLabel>
                                    Managing
                                  </DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() => openRenameDialog(makeup)}
                                  >
                                    <Edit />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => setDeleteTarget(makeup)}
                                  >
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

      <AlertDialog
        open={productsTarget !== null}
        onOpenChange={(open) => {
          if (!open) setProductsTarget(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {productsTarget?.name ?? "Products"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tap a product to search it on Google.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {productsTarget && productsTarget.products.length > 0 ? (
            <div className="grid max-h-[60vh] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {productsTarget.products.map((product, index) => (
                <a
                  key={`${product.name}-${index}`}
                  href={`https://www.google.com/search?q=${encodeURIComponent(product.name)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block border rounded-xl"
                >
                  <Card
                    size="sm"
                    className="gap-0 py-3 px-3 transition hover:border-foreground/40 hover:shadow-sm"
                  >
                    <CardContent className="flex items-center justify-between gap-2 px-0">
                      <p className="text-sm font-medium line-clamp-2">
                        {product.name}
                      </p>
                      <p className="shrink-0 text-sm text-muted-foreground">
                        {product.price}
                      </p>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No products saved for this look.
            </p>
          )}

          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setProductsTarget(null)}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={renameTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename look</AlertDialogTitle>
            <AlertDialogDescription>
              Give this saved look a new name.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            placeholder="Look name"
            autoFocus
            disabled={isMutating}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMutating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                confirmRename();
              }}
              disabled={isMutating || !renameValue.trim()}
            >
              {isMutating ? "Saving..." : "Save"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this look?</AlertDialogTitle>
            <AlertDialogDescription className={"text-left"}>
              &ldquo;{deleteTarget?.name}&rdquo; will be removed from your saved
              looks. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMutating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                confirmDelete();
              }}
              disabled={isMutating}
              variant={"destructive"}
            >
              {isMutating ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
