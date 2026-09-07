import { ReactNode } from "react";

interface PhoneFrameProps {
  children: ReactNode;
  /** Carrier / status bar text, e.g. "GreyNet 5G" */
  carrier?: string;
  time?: string;
  /** Optional lock-screen style banner shown above the content */
  alert?: { app: string; title: string; body: string };
}

/**
 * Realistic handset bezel used for hero alert injects, so the artefact reads
 * as something a participant would actually be shown on a phone.
 */
const PhoneFrame = ({ children, carrier = "GreyNet 5G", time = "07:42", alert }: PhoneFrameProps) => (
  <div className="flex justify-center py-4">
    <div className="relative w-full max-w-[320px] rounded-[2.75rem] bg-[#101114] p-[10px] shadow-[0_28px_60px_-20px_rgba(0,0,0,0.85),inset_0_0_0_1px_rgba(255,255,255,0.14)]">
      {/* side buttons */}
      <span className="absolute -left-[3px] top-28 h-14 w-[3px] rounded-l bg-[#2a2c31]" />
      <span className="absolute -left-[3px] top-44 h-8 w-[3px] rounded-l bg-[#2a2c31]" />
      <span className="absolute -right-[3px] top-32 h-20 w-[3px] rounded-r bg-[#2a2c31]" />

      <div className="relative overflow-hidden rounded-[2.25rem] bg-black">
        {/* status bar + dynamic island */}
        <div className="relative flex items-center justify-between px-5 pb-1 pt-2 text-[10px] font-medium text-white/80">
          <span>{time}</span>
          <span className="absolute left-1/2 top-[6px] h-[22px] w-[86px] -translate-x-1/2 rounded-full bg-black ring-1 ring-white/10" />
          <span className="flex items-center gap-1">
            <span className="tracking-wide">{carrier}</span>
            <span className="inline-block h-[9px] w-[18px] rounded-[3px] border border-white/60">
              <span className="block h-full w-2/3 rounded-[2px] bg-white/70" />
            </span>
          </span>
        </div>

        {alert && (
          <div className="mx-3 mt-2 rounded-2xl bg-white/10 p-3 backdrop-blur-sm ring-1 ring-white/15">
            <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.2em] text-white/60">
              <span>{alert.app}</span>
              <span>now</span>
            </div>
            <p className="mt-1 text-[12px] font-semibold leading-snug text-white">{alert.title}</p>
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-white/70">{alert.body}</p>
          </div>
        )}

        <div className="mt-2 bg-black">{children}</div>

        {/* home indicator */}
        <div className="flex justify-center py-2">
          <span className="h-[4px] w-24 rounded-full bg-white/40" />
        </div>
      </div>
    </div>
  </div>
);

export default PhoneFrame;
