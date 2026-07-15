"use client";

import { useState } from "react";
import { LeadStatus } from "@prisma/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateLeadStatus } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";

const schema = z.object({
  status: z.enum(["NEW", "CONTACTED", "FOLLOW_UP", "INTERESTED", "CONVERTED", "NOT_INTERESTED", "NOT_ANSWERED", "NOT_REACHABLE"]),
  notes: z.string().optional(),
  nextFollowUpAt: z.string().optional(),
  denyCategory: z.string().optional(),
  denyDetails: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const denyCategories = ["Price", "Competitor", "Wrong number", "Closed business", "No response"];

export function StatusChangeForm({ leadId, currentStatus, onSuccess }: { leadId: string; currentStatus: LeadStatus; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: currentStatus, notes: "", nextFollowUpAt: "", denyCategory: "", denyDetails: "" },
  });

  const selectedStatus = form.watch("status");

  async function onSubmit(data: FormData) {
    setError("");
    setLoading(true);
    try {
      await updateLeadStatus({
        leadId,
        status: data.status,
        notes: data.notes || undefined,
        nextFollowUpAt: data.nextFollowUpAt || undefined,
        denyCategory: data.denyCategory || undefined,
        denyDetails: data.denyDetails || undefined,
      });
      form.reset({ status: data.status, notes: "", nextFollowUpAt: "", denyCategory: "", denyDetails: "" });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="status" render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="CONTACTED">Contacted</SelectItem>
                <SelectItem value="FOLLOW_UP">Follow-up</SelectItem>
                <SelectItem value="INTERESTED">Interested</SelectItem>
                <SelectItem value="CONVERTED">Converted</SelectItem>
                <SelectItem value="NOT_INTERESTED">Not Interested</SelectItem>
                <SelectItem value="NOT_ANSWERED">Not Answered</SelectItem>
                <SelectItem value="NOT_REACHABLE">Customer Busy/Not Reachable/Not connected</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        {selectedStatus === "FOLLOW_UP" && (
          <>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Follow-up Notes</FormLabel>
                <FormControl><Textarea placeholder="Call notes..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="nextFollowUpAt" render={({ field }) => (
              <FormItem>
                <FormLabel>Next Follow-up Date</FormLabel>
                <FormControl><Input type="datetime-local" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </>
        )}

        {selectedStatus === "NOT_INTERESTED" && (
          <>
            <FormField control={form.control} name="denyCategory" render={({ field }) => (
              <FormItem>
                <FormLabel>Reason Category *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {denyCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="denyDetails" render={({ field }) => (
              <FormItem>
                <FormLabel>Details</FormLabel>
                <FormControl><Textarea placeholder="Additional details..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </>
        )}

        {selectedStatus !== "FOLLOW_UP" && selectedStatus !== "NOT_INTERESTED" && (
          <FormField control={form.control} name="notes" render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl><Textarea placeholder="Add notes..." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        )}

        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Status
        </Button>
      </form>
    </Form>
  );
}
