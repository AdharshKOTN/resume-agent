import { useEffect, useState } from "react";
import { AudioResponse } from "./types";
import socket from "@/components/socket";


interface AudioVisualProps {
  audioPath: string;
}

export default function AudioVisual({ audioPath }: AudioVisualProps) {

  return (
    <div className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
      { audioPath && (
      <audio src={audioPath} autoPlay controls></audio>
      )}
    </div>
  );
}