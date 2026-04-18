"use client";

import * as React from "react";
import Webcam from "react-webcam";

type WebcamProps = React.ComponentProps<typeof Webcam>;

type RawCameraProps = Partial<
  Omit<WebcamProps, "audio" | "videoConstraints">
> & {
  audio?: boolean;
  facingMode?: "user" | "environment";
  videoConstraints?: MediaTrackConstraints;
};

export const RawCamera = React.forwardRef<Webcam, RawCameraProps>(
  function RawCamera(
    {
      audio = false,
      facingMode = "user",
      mirrored,
      screenshotFormat = "image/jpeg",
      videoConstraints,
      ...props
    },
    ref,
  ) {
    return (
      <Webcam
        ref={ref}
        audio={audio}
        mirrored={mirrored ?? facingMode === "user"}
        screenshotFormat={screenshotFormat}
        videoConstraints={{
          facingMode,
          ...videoConstraints,
        }}
        {...props}
      />
    );
  },
);
