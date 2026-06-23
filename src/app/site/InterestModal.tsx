import { useEffect, useState } from "react";
import { X, Gamepad2 } from "lucide-react";
import type { Interest } from "./data";
import { lockBodyScroll, unlockBodyScroll } from "../utils/scrollLock";

// Modale di dettaglio per hobby/passioni (foto + descrizione), condivisa.
export default function InterestModal({ item, onClose }: { item: Interest | null; onClose: () => void }) {
  const [imgStatus, setImgStatus] = useState<"loading" | "loaded" | "error">("loading");

  useEffect(() => {
    setImgStatus("loading");
  }, [item]);

  useEffect(() => {
    if (!item) return;
    lockBodyScroll();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      unlockBodyScroll();
    };
  }, [item, onClose]);

  if (!item) return null;

  return (
    <>
      <div className="ap-modal-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{ transform: "translate(-50%, -50%)" }}
        className="ap-modal"
      >
        <button type="button" className="ap-modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
        {item.img && imgStatus !== "error" && (
          <div className={`ap-modal-photo${imgStatus === "loaded" ? " ap-modal-photo--ready" : ""}`}>
            <img
              src={item.img}
              alt={item.label}
              loading="lazy"
              onLoad={() => setImgStatus("loaded")}
              onError={() => setImgStatus("error")}
            />
          </div>
        )}
        <div className="ap-modal-inner">
          <div className="ap-modal-icon-wrap" aria-hidden="true">
            <item.Icon size={32} />
          </div>
          <h2 id="modal-title" className="ap-modal-title">
            <span aria-hidden="true">{item.emoji}</span> {item.label}
          </h2>
          <p className="ap-modal-body">{item.desc}</p>
          {item.link && (
            <a href={item.link} className="btn btn-primary fw-semibold mt-2 d-inline-flex align-items-center">
              <Gamepad2 size={18} className="me-2" aria-hidden="true" />
              {item.linkLabel ?? "Open"}
            </a>
          )}
        </div>
      </div>
    </>
  );
}
