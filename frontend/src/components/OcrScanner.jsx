import { useEffect, useRef, useState } from "react";
import {
  BoundingBox,
  SpinnerGap,
  UploadSimple,
} from "@phosphor-icons/react";
import { scanOcr } from "../services/api";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

async function captureScreenAsBlob() {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { cursor: "always" },
  });

  try {
    const video = document.createElement("video");
    video.srcObject = stream;
    await new Promise((resolve) => {
      video.onloadedmetadata = () => resolve();
    });
    await video.play();

    const track = stream.getVideoTracks()[0];
    const settings = track.getSettings();
    const canvas = document.createElement("canvas");
    canvas.width = settings.width || video.videoWidth;
    canvas.height = settings.height || video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1));
  } finally {
    stream.getTracks().forEach((track) => track.stop());
  }
}

export default function OcrScanner({ onResult, onError }) {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [extractedText, setExtractedText] = useState("");

  useEffect(
    () => () => {
      if (preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    },
    [preview],
  );

  const updatePreview = (nextPreview) => {
    setPreview((current) => {
      if (current.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }
      return nextPreview;
    });
  };

  const submitImage = async (imageData, fileName = "capture.png") => {
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", imageData, fileName);

      const response = await scanOcr(formData);
      setExtractedText(response.data.extracted_text || "");
      onResult(response.data);
    } catch (error) {
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      onError?.(new Error("Please upload a PNG, JPG, or WebP image."));
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      onError?.(new Error("Image must be under 5MB."));
      return;
    }

    updatePreview(URL.createObjectURL(file));
    await submitImage(file, file.name);
  };

  const handleScreenCapture = async () => {
    try {
      const blob = await captureScreenAsBlob();

      if (!blob) {
        throw new Error("Unable to capture screen image.");
      }

      updatePreview(URL.createObjectURL(blob));
      await submitImage(blob);
    } catch (error) {
      onError?.(error);
    }
  };

  return (
    <div className="app-panel-soft p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-lg font-bold text-copy">OCR Scanner</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Upload a screenshot or capture your screen, then pass the extracted
              text into the live detector.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary-dark w-full rounded-xl sm:w-auto"
              disabled={loading}
            >
              <UploadSimple size={16} />
              Upload Image
            </button>
            <button
              type="button"
              onClick={handleScreenCapture}
              className="btn-primary-dark w-full rounded-xl sm:w-auto"
              disabled={loading}
            >
              <BoundingBox size={16} />
              Capture Screen
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileUpload}
          hidden
        />

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[24px] border border-line/15 bg-surface/60 p-4">
            <p className="text-sm font-semibold text-copy">Image preview</p>
            <div className="mt-4 flex min-h-[260px] items-center justify-center overflow-hidden rounded-[20px] bg-elevated-strong/70">
              {preview ? (
                <img
                  src={preview}
                  alt="OCR preview"
                  className="max-h-[340px] w-full object-contain"
                />
              ) : (
                <p className="max-w-xs text-center text-sm text-muted">
                  No image selected yet. The preview appears here after upload or
                  capture.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-line/15 bg-surface/60 p-4">
            <p className="text-sm font-semibold text-copy">OCR extraction</p>
            <div className="mt-4 min-h-[200px] rounded-[20px] bg-elevated-strong/70 p-4 sm:min-h-[240px]">
              {loading ? (
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <SpinnerGap size={18} className="animate-spin" />
                  Extracting text and scanning image...
                </div>
              ) : extractedText ? (
                <p className="whitespace-pre-wrap text-sm leading-7 text-copy">
                  {extractedText}
                </p>
              ) : (
                <p className="text-sm text-muted">
                  Extracted text will appear here once OCR completes.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
