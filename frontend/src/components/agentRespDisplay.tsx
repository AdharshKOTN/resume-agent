"use client";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table";

interface AgentRespDisplayProps {
    responses: string[];
}

export default function AgentRespDisplay({responses}: AgentRespDisplayProps) {

    return (
        <div className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">#</TableHead>
              <TableHead>Agent Responses</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {responses.map((res, i) => (
              <TableRow key={i}>
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell>{res}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
};