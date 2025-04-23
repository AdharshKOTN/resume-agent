"use client";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table";

import socket from "@/components/socket";
import { useEffect } from "react";
import {AgentResponse} from "@/components/types"


interface AgentRespDisplayProps {
    responses: string[];
    onAgentResponse: (response: AgentResponse) => void;
}

export default function AgentRespDisplay({responses, onAgentResponse}: AgentRespDisplayProps) {

    useEffect(() => {
        socket.on("agent_response", (response: AgentResponse) => {
            console.log("Received agent response:", response);
            if (response.text.trim()) {
                onAgentResponse(response);
            }
        })
    }, []);

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
            {responses.map((text, i) => (
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