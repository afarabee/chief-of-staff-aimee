import { toast } from "@/hooks/use-toast";

export function openExternalUrl(url: string) {
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (!win) {
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: "Link copied to clipboard", description: url });
    }).catch(() => {
      toast({ title: "Could not open link", description: url });
    });
  }
}
