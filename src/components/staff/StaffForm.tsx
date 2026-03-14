'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { createStaff, updateStaff } from '@/actions/staff'
import { staffProfileSchema, type StaffProfileInput } from '@/lib/validations/staff'

interface StaffFormProps {
  mode: 'create' | 'edit'
  staff?: { id: string; name: string }
  onClose: () => void
}

export function StaffForm({ mode, staff, onClose }: StaffFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StaffProfileInput>({
    resolver: zodResolver(staffProfileSchema),
    defaultValues: {
      name: mode === 'edit' ? (staff?.name ?? '') : '',
    },
  })

  async function onSubmit(data: StaffProfileInput) {
    try {
      if (mode === 'create') {
        await createStaff(data)
        toast.success('Staff member added.')
      } else if (mode === 'edit' && staff) {
        await updateStaff(staff.id, data)
        toast.success('Staff member updated.')
      }
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  const title = mode === 'create' ? 'Add Staff Member' : 'Edit Staff Member'

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              placeholder="Staff member name"
              aria-invalid={!!errors.name}
              {...register('name')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Saving…
                </span>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
