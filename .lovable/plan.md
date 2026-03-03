

# Add Word & Excel file support to Assets

## Changes

### 1. `src/components/ui/image-upload.tsx` — Extend accepted file types

- Add Word and Excel MIME types to `ACCEPTED_TYPES`: `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Add a `isDocumentUrl` helper that checks for `.doc`, `.docx`, `.xls`, `.xlsx` extensions
- In the preview (when `value` is set), handle document URLs the same way as PDFs — show a `FileText` icon + filename
- Update the `accept` attribute on the file input to include `.doc,.docx,.xls,.xlsx`
- Update the placeholder text from "Images & PDFs" to "Images, PDFs & Office docs"
- Update the error toast to mention supported file types

### 2. `src/pages/Assets.tsx` — Display Word/Excel in detail view

- Extend the attachment display logic (lines 186-196) to treat `.doc`, `.docx`, `.xls`, `.xlsx` the same as PDF — render as a clickable file icon + filename link instead of an image preview.

Both changes are purely UI — no database or schema changes needed since `attachment_url` already stores any URL string.

