"use client";
import React, { useState } from 'react';

const TranscriptDisplay: React.FC = () => {
    const [transcripts, setTranscripts] = useState<string[]>([
        "Welcome to the transcript display!",
        "This is an example of a transcript.",
        "The latest transcript will appear at the top.",
    ]);

    const colors = ["#FF5733", "#33FF57", "#3357FF", "#F3FF33", "#FF33F3"];

    return (
        <div
            style={{
                maxHeight: '300px',
                overflowY: 'auto',
                border: '1px solid #ccc',
                padding: '10px',
                borderRadius: '5px',
                backgroundColor: '#f9f9f9',
            }}
        >
            {transcripts.map((transcript, index) => (
                <p
                    key={index}
                    style={{
                        color: colors[index % colors.length],
                        margin: '5px 0',
                    }}
                >
                    {transcript}
                </p>
            ))}
        </div>
    );
};

export default TranscriptDisplay;