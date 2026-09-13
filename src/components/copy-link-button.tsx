'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function CopyLinkButton({ url, label, copiedLabel }: { url: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // clipboard API unavailable — the link is still selectable text nearby.
        }
      }}
    >
      {copied ? copiedLabel : label}
    </Button>
  );
}
