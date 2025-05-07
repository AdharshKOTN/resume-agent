import { AudioResponse } from "./types";

interface AudioVisualProps {
  audioResp?: AudioResponse;
}

export default function AudioVisual({ audioResp }: AudioVisualProps) {

  return (
    <div>
      { audioResp && (
      <div className="grid grid-cols-2 gap-4">
      <audio src={audioResp.audioPath} autoPlay controls></audio>
      <div>Duration: {audioResp.duration}</div>
      </div>
      )}
    </div>
  );
}