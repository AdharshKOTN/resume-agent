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
        //     style={{
        //         maxHeight: '300px',
        //         overflowY: 'auto',
        //         border: '1px solid #ccc',
        //         padding: '10px',
        //         borderRadius: '5px',
        //         backgroundColor: '#f9f9f9',
        //     }}
        // > 
        //     {transcripts.map((transcript, index) => (
        //         <p
        //             key={index}
        //             style={{
        //                 color: colors[index % colors.length],
        //                 margin: '5px 0',
        //             }}
        //         >
        //             {transcript}
        //         </p>
        //     ))}
        // </div>
    );
};