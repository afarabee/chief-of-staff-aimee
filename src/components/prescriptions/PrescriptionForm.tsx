import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useCreatePrescription, useUpdatePrescription, useDeletePrescription } from '@/hooks/usePrescriptions';
import type { Prescription } from '@/types/prescriptions';

interface PrescriptionFormProps {
  prescription?: Prescription;
  onClose: () => void;
}

export function PrescriptionForm({ prescription, onClose }: PrescriptionFormProps) {
  const isEdit = !!prescription;
  const [medicationName, setMedicationName] = useState(prescription?.medicationName ?? '');
  const [dosage, setDosage] = useState(prescription?.dosage ?? '');
  const [frequency, setFrequency] = useState(prescription?.frequency ?? '');
  const [prescriber, setPrescriber] = useState(prescription?.prescriber ?? '');
  const [pharmacy, setPharmacy] = useState(prescription?.pharmacy ?? '');
  const [startDate, setStartDate] = useState<Date | undefined>(
    prescription?.startDate ? new Date(prescription.startDate + 'T00:00:00') : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    prescription?.endDate ? new Date(prescription.endDate + 'T00:00:00') : undefined
  );
  const [notes, setNotes] = useState(prescription?.notes ?? '');
  const [isActive, setIsActive] = useState(prescription?.isActive ?? true);

  const createRx = useCreatePrescription();
  const updateRx = useUpdatePrescription();
  const deleteRx = useDeletePrescription();
  const isPending = createRx.isPending || updateRx.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicationName.trim()) return;

    const payload = {
      medication_name: medicationName.trim(),
      dosage: dosage.trim() || null,
      frequency: frequency.trim() || null,
      prescriber: prescriber.trim() || null,
      pharmacy: pharmacy.trim() || null,
      start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
      end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      notes: notes.trim() || null,
      is_active: isActive,
    };

    if (isEdit) {
      updateRx.mutate({ id: prescription.id, ...payload }, { onSuccess: onClose });
    } else {
      createRx.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="rx-name">Medication Name *</Label>
        <Input id="rx-name" value={medicationName} onChange={(e) => setMedicationName(e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rx-dosage">Dosage</Label>
          <Input id="rx-dosage" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="e.g., 500mg" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rx-frequency">Frequency</Label>
          <Input id="rx-frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="e.g., twice daily" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rx-prescriber">Prescriber</Label>
        <Input id="rx-prescriber" value={prescriber} onChange={(e) => setPrescriber(e.target.value)} placeholder="Doctor name" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rx-pharmacy">Pharmacy</Label>
        <Input id="rx-pharmacy" value={pharmacy} onChange={(e) => setPharmacy(e.target.value)} placeholder="Pharmacy name" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Start Date</Label>
            {startDate && (
              <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs text-muted-foreground" onClick={() => setStartDate(undefined)}>
                Clear
              </Button>
            )}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !startDate && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'PP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>End Date</Label>
            {endDate && (
              <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs text-muted-foreground" onClick={() => setEndDate(undefined)}>
                Clear
              </Button>
            )}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !endDate && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'PP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rx-notes">Notes</Label>
        <Textarea id="rx-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>

      <div className="flex items-center gap-3">
        <Switch checked={isActive} onCheckedChange={setIsActive} id="rx-active" />
        <Label htmlFor="rx-active">Active prescription</Label>
      </div>

      <div className="flex justify-between pt-2">
        {isEdit && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Prescription?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{prescription.medicationName}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteRx.mutate(prescription.id, { onSuccess: onClose })}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <div className="flex gap-2 ml-auto">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isPending || !medicationName.trim()}>
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </form>
  );
}
