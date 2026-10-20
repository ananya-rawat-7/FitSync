import { useEffect, useRef } from "react";
import { Trophy, X } from "lucide-react";

export default function CelebrationModal({ open, title = "CONGO!", message, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      document.body.classList.add("dialog-open");
    } else if (!open && dialog.open) {
      dialog.close();
    }
    if (!open) {
      document.body.classList.remove("dialog-open");
    }
  }, [open]);

  const close = () => onClose();

  return (
    <dialog
      ref={dialogRef}
      className="app-dialog celebration-dialog"
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClick={(event) => { if (event.target === dialogRef.current) close(); }}
    >
      <button className="dialog-close" type="button" aria-label="Close celebration" onClick={close}>
        <X />
      </button>
      <span className="dialog-mark"><Trophy /></span>
      <span className="eyebrow">WORKOUT LOGGED</span>
      <h2>{title}</h2>
      <p>{message}</p>
      <button className="button dialog-submit" type="button" onClick={close}>Nice!</button>
    </dialog>
  );
}
