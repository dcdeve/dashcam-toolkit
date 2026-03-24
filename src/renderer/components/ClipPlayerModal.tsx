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
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <VisuallyHidden.Root>
          <DialogTitle>{clip?.filename ?? 'Clip player'}</DialogTitle>
        </VisuallyHidden.Root>
        {open && clip && <ClipPlayer clips={clips} volume={volume} />}
      </DialogContent>
    </Dialog>
  );
}
