'use client';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { useEffect, useState } from 'react';

interface Participant {
  id: string;
  name: string;
  team: {
    name: string;
  };
}

export default function ParticipantPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    const fetchParticipants = async () => {
      const res = await fetch('/api/participant');
      const data = await res.json();
      setParticipants(data);
    };

    fetchParticipants();
  }, []);

  return (
    <div className="w-full p-6">
      <h5 className="text-xl font-medium">List Participant KEDCOMP 2025</h5>
      <Table className="mt-2">
        <TableHeader>
          <TableRow>
            <TableHead>No</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Institution</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {participants.map((parti, i) => (
            <TableRow key={parti.id}>
              <TableCell className="font-medium">{i + 1}</TableCell>
              <TableCell>{parti.name}</TableCell>
              <TableCell>{parti.team.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
