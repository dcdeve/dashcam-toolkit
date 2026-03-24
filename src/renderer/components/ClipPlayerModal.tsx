import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ClipPlayer } from '@/components/ClipPlayer';
import { useAppStore } from '@/store';
import type { UIClip } from '@/store';

interface ClipPlayerModalProps {
  clip: UIClip | null;
  open: boolean;
  onClose: () => void;
}

export function ClipPlayerModal({ clip, open, onClose }: ClipPlayerModalProps): React.ReactElement {
  const { volume } = useAppStore();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        {open && clip && <ClipPlayer clips={[clip]} volume={volume} />}
      </DialogContent>
    </Dialog>
  );
}
