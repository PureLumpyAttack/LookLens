"use client";

import { useRef, useState } from "react";
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

export default function DashboardPage() {
  const cameraRef = useRef<Webcam>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [cameraAttempt, setCameraAttempt] = useState(0);

  return (
    <main>
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

      <RawCamera
        ref={cameraRef}
        key={cameraAttempt}
        className="w-full h-screen"
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
    </main>
  );
}
