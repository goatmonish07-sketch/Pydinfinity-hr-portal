/** Resize an image file to a square-ish JPEG data URL (keeps localStorage small: ~10–25 KB). */
export function resizeImage(file: File, max = 320, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("Please choose an image file (JPG, PNG or WebP)."));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      // centre-crop to a square, then scale down
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      const size = Math.min(max, side);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That image couldn't be read."));
    };
    img.src = url;
  });
}

export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export const fmtBytes = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(1)} MB`);

/** Resume files up to this size are kept in the browser so they can be opened later; larger ones keep name/size only. */
export const RESUME_INLINE_LIMIT = 900 * 1024;
