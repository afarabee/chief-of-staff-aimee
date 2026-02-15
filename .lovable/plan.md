

# Resize Description and Attachment in Task & Idea Forms

## Overview
Make the Description textarea taller and the Attachment upload area more compact in both the Task and Idea forms (Add and Edit modes).

## Changes

### 1. TaskForm (`src/components/tasks/TaskForm.tsx`)
- Change the Description `Textarea` from `rows={3}` to `rows={6}` for a taller text area

### 2. IdeaForm (`src/components/ideas/IdeaForm.tsx`)
- Change the Description `Textarea` from `rows={4}` to `rows={6}` for consistency

### 3. ImageUpload (`src/components/ui/image-upload.tsx`)
- Reduce the empty-state padding from `py-6 px-4` to `py-3 px-4` to make the drop zone more compact
- Reduce icon sizes slightly (h-6/h-5 to h-5/h-4)

These are small CSS/prop tweaks across 3 files -- no logic changes.
