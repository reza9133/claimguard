"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { fileToBytes, validatePhotoFile } from "@/lib/bytes";
import { toast } from "sonner";

interface Props {
  onChange: (bytes: Uint8Array | null) => void;
  label?: string;
}

export function PhotoDropzone({ onChange, label = "Evidence photo (optional)" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      const problem = validatePhotoFile(file);
      if (problem) {
        toast.error(problem);
        return;
      }
      const bytes = await fileToBytes(file);
      onChange(bytes);
      setFileName(file.name);
      setPreview(URL.createObjectURL(file));
    },
    [onChange]
  );

  const clear = () => {
    setPreview(null);
    setFileName(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </label>

      {!preview ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border-mid)] bg-[var(--input-bg)] py-8 text-[var(--text-muted)] transition-colors hover:border-emerald-500/50 hover:text-emerald-400"
        >
          <ImagePlus className="h-6 w-6" />
          <span className="text-sm">Click to attach a photo</span>
        </button>
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-[var(--border-mid)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={fileName ?? "evidence preview"} className="max-h-64 w-full object-contain bg-black/20" />
          <button
            type="button"
            onClick={clear}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            title="Remove photo"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="truncate bg-black/40 px-3 py-1.5 text-xs text-white">{fileName}</div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
        Sent directly with your transaction for the AI to inspect — not stored permanently on-chain.
      </p>
    </div>
  );
}
