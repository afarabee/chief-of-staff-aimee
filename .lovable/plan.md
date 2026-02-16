

# Expand Accepted Attachment Types to Include PDFs and PNGs

## Overview
Currently the upload component only accepts image files (`image/*`). This change expands it to also accept PDFs, and updates the preview to handle non-image files gracefully.

## Changes (single file: `src/components/ui/image-upload.tsx`)

### 1. Expand accepted MIME types
- Change the `accept` attribute on the file input from `image/*` to `image/*,.pdf`
- Update the validation check in `uploadFile()` from `file.type.startsWith('image/')` to also allow `application/pdf`
- Update the drag-and-drop handler to accept PDFs too
- Update the paste handler to accept PDFs too

### 2. Update preview for non-image files
- When the attached file is a PDF (detected by URL ending in `.pdf`), show a file icon with the filename instead of an `<img>` tag, since PDFs can't be previewed as images
- Images (including PNGs, which are already covered by `image/*`) continue to show the image preview as before

### 3. Update labels
- Change the toast message from "Image uploaded" to "File uploaded"
- Change the upload area hint text from referencing only images to "Images & PDFs"
- Add a `Paperclip` or `FileText` icon alongside the image icon to indicate PDF support

### Note
PNGs are already accepted since `image/*` covers all image types including PNG. The real expansion here is adding PDF support.

