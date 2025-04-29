import { AudioResponse } from "./types";

interface AudioVisualProps {
  audioResponse: Blob;
}

export default function AudioVisual({audioResponse}: AudioVisualProps) {
  return (
    <div className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
      <audio src={audioResponse} autoPlay controls></audio>
    </div>
  );
}