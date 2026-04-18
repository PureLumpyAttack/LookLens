"use client";

import { useRef, useState } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useOnboarding } from "../onboarding-provider";
import { Camera, GalleryVerticalEnd, ImageUp, RotateCcw } from "lucide-react";

export function GettingStartedStep() {
  const cameraRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [cameraAttempt, setCameraAttempt] = useState(0);
  const { draft, nextStep, updateDraft } = useOnboarding();
  const previewImage = draft.facePhotoPreview;

  function useCurrentPhoto() {
    if (!draft.facePhotoFile || !previewImage) return;

    updateDraft({ started: true });
    nextStep();
  }

  function dataUrlToFile(dataUrl: string, filename: string) {
    const [metadata, base64] = dataUrl.split(",");

    if (!metadata || !base64) {
      throw new Error("Invalid captured image format");
    }

    const mimeMatch = metadata.match(/data:(.*?);base64/);
    const mimeType = mimeMatch?.[1] ?? "image/jpeg";
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0),
    );

    return new File([bytes], filename, { type: mimeType });
  }

  function setSelectedPhoto(file: File) {
    const preview = URL.createObjectURL(file);

    updateDraft({
      facePhotoFile: file,
      facePhotoPreview: preview,
    });
  }

  function capturePhoto() {
    const screenshot = cameraRef.current?.getScreenshot();

    if (!screenshot) {
      return;
    }

    setSelectedPhoto(dataUrlToFile(screenshot, `looklens-face-${Date.now()}.jpg`));
  }

  function resetPhoto() {
    if (draft.facePhotoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(draft.facePhotoPreview);
    }

    updateDraft({ facePhotoFile: null, facePhotoPreview: null });
    setPermissionDenied(false);
    setCameraAttempt((value) => value + 1);
  }

  return (
    <div className="flex w-full flex-col items-center gap-4 px-5">
      <div className="flex items-center gap-2 self-center font-medium text-lg">
        <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <GalleryVerticalEnd className="size-4" />
        </div>
        LookLens
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send a photo of your face or import</CardTitle>
          <CardDescription>
            Use a clear selfie so we can personalize try-ons more accurately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-4/5 w-full max-w-xl overflow-hidden rounded-[2rem] border border-zinc-800">
            {previewImage ? (
              <img
                src={previewImage}
                alt="Selected face preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <RawCamera
                key={cameraAttempt}
                ref={cameraRef}
                className="h-full w-full object-cover"
                onUserMedia={() => {
                  setPermissionDenied(false);
                }}
                onUserMediaError={(error) => {
                  if (
                    typeof error !== "string" &&
                    (error.name === "NotAllowedError" ||
                      error.name === "PermissionDeniedError")
                  ) {
                    setPermissionDenied(true);
                  }
                }}
              />
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (!file) {
                return;
              }

              setSelectedPhoto(file);
              event.currentTarget.value = "";
            }}
          />
        </CardContent>
        <CardFooter>
          <div className="flex w-full justify-start gap-3">
            {previewImage ? (
              <>
                <Button variant="outline" onClick={resetPhoto}>
                  <RotateCcw className="size-4" />
                  Retake
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={capturePhoto}
                >
                  <Camera className="size-4" />
                  Capture
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                >
                  <ImageUp className="size-4" />
                  Import
                </Button>
              </>
            )}
          </div>

          <div className="flex w-full justify-end">
            <Button onClick={useCurrentPhoto} disabled={!draft.facePhotoFile || !previewImage}>
              Use
            </Button>
          </div>
        </CardFooter>
      </Card>

      <AlertDialog open={permissionDenied}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Camera access is blocked</AlertDialogTitle>
            <AlertDialogDescription>
              Allow camera access in your browser settings, or import a photo
              instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setPermissionDenied(false);
                fileInputRef.current?.click();
              }}
            >
              Import photo
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                setPermissionDenied(false);
                setCameraAttempt((value) => value + 1);
              }}
            >
              Retry camera
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
