"use client";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table";

import { useEffect } from "react";
import {AgentResponse} from "@/components/types"


interface AgentRespDisplayProps {
    responses: AgentResponse[];
}

export default function AgentRespDisplay({responses}: AgentRespDisplayProps) {

    return (
        <div className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">#</TableHead>
              <TableHead>Agent Responses</TableHead>
              <TableHead className="w-[100px]">Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {responses.map((res, i) => (
              <TableRow key={i}>
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell>{res.text}</TableCell>
                <TableCell className="text-muted-foreground">{res.duration}s</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
};