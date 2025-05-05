"use client";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table";

interface TranscriptDisplayProps {
    transcripts: string[];
}

export default function TranscriptDisplay({transcripts}: TranscriptDisplayProps) {

    return (
        <div className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">#</TableHead>
              <TableHead>Transcript</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transcripts.map((text, i) => (
              <TableRow key={i}>
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell>{text}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
};