import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Pill, Plus } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { usePrescriptions } from '@/hooks/usePrescriptions';
import { PrescriptionForm } from '@/components/prescriptions/PrescriptionForm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ResponsiveFormDialog } from '@/components/ui/responsive-dialog';
import type { Prescription } from '@/types/prescriptions';

export default function Prescriptions() {
  usePageTitle('Rx List');
  const { data: prescriptions = [], isLoading } = usePrescriptions();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRx, setEditingRx] = useState<Prescription | undefined>(undefined);

  const openAdd = () => { setEditingRx(undefined); setIsFormOpen(true); };
  const openEdit = (rx: Prescription) => { setEditingRx(rx); setIsFormOpen(true); };
  const closeForm = () => { setIsFormOpen(false); setEditingRx(undefined); };

  const active = prescriptions.filter((rx) => rx.isActive);
  const inactive = prescriptions.filter((rx) => !rx.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Rx List</h1>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Prescription
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : prescriptions.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Pill className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No prescriptions yet. Add your first prescription to get started.</p>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Prescription
          </Button>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Active</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {active.map((rx) => (
                  <PrescriptionCard key={rx.id} rx={rx} onClick={() => openEdit(rx)} />
                ))}
              </div>
            </div>
          )}
          {inactive.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Inactive</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {inactive.map((rx) => (
                  <PrescriptionCard key={rx.id} rx={rx} onClick={() => openEdit(rx)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <ResponsiveFormDialog
        open={isFormOpen}
        onOpenChange={(open) => { if (!open) closeForm(); else setIsFormOpen(true); }}
        title={editingRx ? 'Edit Prescription' : 'Add Prescription'}
      >
        <PrescriptionForm prescription={editingRx} onClose={closeForm} />
      </ResponsiveFormDialog>
    </div>
  );
}

function PrescriptionCard({ rx, onClick }: { rx: Prescription; onClick: () => void }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground">{rx.medicationName}</h3>
          <Badge variant={rx.isActive ? 'default' : 'secondary'}>
            {rx.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        {rx.dosage && (
          <p className="text-sm text-muted-foreground">Dosage: {rx.dosage}</p>
        )}
        {rx.frequency && (
          <p className="text-sm text-muted-foreground">Frequency: {rx.frequency}</p>
        )}
        {rx.prescriber && (
          <p className="text-sm text-muted-foreground">Prescriber: {rx.prescriber}</p>
        )}
        {rx.pharmacy && (
          <p className="text-sm text-muted-foreground">Pharmacy: {rx.pharmacy}</p>
        )}
        {rx.startDate && (
          <p className="text-xs text-muted-foreground">
            Started: {format(parseISO(rx.startDate), 'MMM d, yyyy')}
            {rx.endDate && ` - Ends: ${format(parseISO(rx.endDate), 'MMM d, yyyy')}`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
