"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ImportLeadsClient() {
  const router = useRouter();
  const [pasteText, setPasteText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedLeads, setParsedLeads] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("paste");

  const handleParse = async (source: string) => {
    setIsLoading(true);
    setParsedLeads([]);
    
    try {
      const formData = new FormData();
      formData.append("source", source);
      
      if (source === "paste") {
        if (!pasteText.trim()) throw new Error("Please paste some text first.");
        formData.append("text", pasteText);
      } else {
        if (!file) throw new Error("Please select a file first.");
        formData.append("file", file);
      }

      const response = await fetch("/api/import/parse", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to parse data");
      }

      if (data.leads && data.leads.length > 0) {
        setParsedLeads(data.leads);
      } else {
        alert("No leads could be extracted from the provided data.");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (parsedLeads.length === 0) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/leads/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leads: parsedLeads,
          source: activeTab,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      alert(`Successfully imported ${data.count} leads!`);
      router.push("/dashboard");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!parsedLeads.length ? (
        <Tabs defaultValue="paste" onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto gap-1">
            <TabsTrigger value="paste">Paste Text</TabsTrigger>
            <TabsTrigger value="excel">Excel (.xlsx)</TabsTrigger>
            <TabsTrigger value="word">Word (.docx)</TabsTrigger>
            <TabsTrigger value="json">JSON (.json)</TabsTrigger>
            <TabsTrigger value="jsonl">JSONL (.jsonl)</TabsTrigger>
          </TabsList>
          
          <TabsContent value="paste">
            <Card className="shadow-sm border-[var(--crm-border)] rounded-xl bg-[var(--crm-surface)]">
              <CardHeader>
                <CardTitle>Paste Raw Data</CardTitle>
                <CardDescription>
                  Paste any unstructured text containing lead information. Our AI will extract the details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea 
                  placeholder="John Doe from Acme Corp. 555-0198..."
                  className="min-h-[200px]"
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                />
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleParse("paste")} 
                  disabled={isLoading || !pasteText.trim()}
                  className="bg-[var(--crm-accent)] hover:bg-[var(--crm-accent-hover)] text-white shadow-sm"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Extract Leads
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="excel">
            <Card className="shadow-sm border-[var(--crm-border)] rounded-xl bg-[var(--crm-surface)]">
              <CardHeader>
                <CardTitle>Upload Excel</CardTitle>
                <CardDescription>
                  Upload an Excel file. We will extract text from the first sheet and parse the leads.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="excel-file">Excel File</Label>
                  <Input 
                    id="excel-file" 
                    type="file" 
                    accept=".xlsx, .xls, .csv" 
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleParse("excel")} 
                  disabled={isLoading || !file}
                  className="bg-[var(--crm-accent)] hover:bg-[var(--crm-accent-hover)] text-white shadow-sm"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Extract Leads
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="word">
            <Card className="shadow-sm border-[var(--crm-border)] rounded-xl bg-[var(--crm-surface)]">
              <CardHeader>
                <CardTitle>Upload Word Document</CardTitle>
                <CardDescription>
                  Upload a Word document (.docx). We will extract the text and parse the leads.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="word-file">Word File</Label>
                  <Input 
                    id="word-file" 
                    type="file" 
                    accept=".docx" 
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleParse("word")} 
                  disabled={isLoading || !file}
                  className="bg-[var(--crm-accent)] hover:bg-[var(--crm-accent-hover)] text-white shadow-sm"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Extract Leads
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="json">
            <Card className="shadow-sm border-[var(--crm-border)] rounded-xl bg-[var(--crm-surface)]">
              <CardHeader>
                <CardTitle>Upload JSON</CardTitle>
                <CardDescription>
                  Upload a JSON file. We will extract the text and parse the leads.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="json-file">JSON File</Label>
                  <Input 
                    id="json-file" 
                    type="file" 
                    accept=".json" 
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleParse("json")} 
                  disabled={isLoading || !file}
                  className="bg-[var(--crm-accent)] hover:bg-[var(--crm-accent-hover)] text-white shadow-sm"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Extract Leads
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="jsonl">
            <Card className="shadow-sm border-[var(--crm-border)] rounded-xl bg-[var(--crm-surface)]">
              <CardHeader>
                <CardTitle>Upload JSONL</CardTitle>
                <CardDescription>
                  Upload a JSONL (JSON Lines) file. We will extract the text and parse the leads.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="jsonl-file">JSONL File</Label>
                  <Input 
                    id="jsonl-file" 
                    type="file" 
                    accept=".jsonl" 
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleParse("jsonl")} 
                  disabled={isLoading || !file}
                  className="bg-[var(--crm-accent)] hover:bg-[var(--crm-accent-hover)] text-white shadow-sm"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Extract Leads
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="shadow-sm border-[var(--crm-border)] rounded-xl bg-[var(--crm-surface)]">
          <CardHeader>
            <CardTitle>Review Extracted Leads</CardTitle>
            <CardDescription>
              We found {parsedLeads.length} leads. Please review them before saving to the database.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b-[var(--crm-border)] hover:bg-transparent">
                  <TableHead className="uppercase text-[10px] tracking-wider text-[var(--crm-text-secondary)] font-medium">Business Name</TableHead>
                  <TableHead className="uppercase text-[10px] tracking-wider text-[var(--crm-text-secondary)] font-medium">Contact Person</TableHead>
                  <TableHead className="uppercase text-[10px] tracking-wider text-[var(--crm-text-secondary)] font-medium">Phone</TableHead>
                  <TableHead className="uppercase text-[10px] tracking-wider text-[var(--crm-text-secondary)] font-medium">Location</TableHead>
                  <TableHead className="uppercase text-[10px] tracking-wider text-[var(--crm-text-secondary)] font-medium">Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedLeads.map((lead, idx) => (
                  <TableRow key={idx} className="border-b-[var(--crm-border)] hover:bg-slate-50/50">
                    <TableCell className="font-medium text-[var(--crm-text-primary)]">{lead.businessName}</TableCell>
                    <TableCell className="text-[var(--crm-text-primary)]">{lead.contactPerson || "-"}</TableCell>
                    <TableCell className="tabular-nums text-[var(--crm-text-primary)]">{lead.phone}</TableCell>
                    <TableCell className="text-[var(--crm-text-secondary)]">{lead.city}, {lead.state}</TableCell>
                    <TableCell className="text-[var(--crm-text-secondary)]">{lead.category}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setParsedLeads([])} className="border-[var(--crm-border)] text-[var(--crm-text-primary)] hover:bg-slate-50 shadow-sm">
              Cancel & Start Over
            </Button>
            <Button onClick={handleSave} disabled={isLoading} className="bg-[var(--crm-accent)] hover:bg-[var(--crm-accent-hover)] text-white shadow-sm">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm & Save {parsedLeads.length} Leads
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
