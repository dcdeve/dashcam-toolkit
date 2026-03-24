import { useMemo } from 'react';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ClipPlayer } from '@/components/ClipPlayer';
import { useAppStore } from '@/store';
import type { UIClip } from '@/store';

interface ClipPlayerModalProps {
  clip: UIClip | null;
  open: boolean;
  onClose: () => void;
}

export function ClipPlayerModal({ clip, open, onClose }: ClipPlayerModalProps): React.ReactElement {
  // Selector avoids re-rendering on every unrelated store change
  const volume = useAppStore((s) => s.volume);

  // Stable reference — new array only when `clip` identity changes
  const clips = useMemo(() => (clip ? [clip] : []), [clip]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      {/* aria-describedby={undefined} suppresses the Radix a11y description warning */}
      <DialogContent className="max-w-4xl p-0 overflow-hidden" aria-describedby={undefined}>
        <VisuallyHidden.Root>
          <DialogTitle>{clip?.filename ?? 'Clip player'}</DialogTitle>
        </VisuallyHidden.Root>
        {/* flex flex-col gives ClipPlayer's flex-1 root a proper flex context with defined height */}
        {open && clip && (
          <div className="flex flex-col aspect-video w-full">
            <ClipPlayer clips={clips} volume={volume} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
