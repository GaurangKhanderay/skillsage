import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Seminars = () => {
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const [tab, setTab] = useState<"form" | "previous">("form");
  const [seminarRequests, setSeminarRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: any) => {
    try {
      const { error } = await supabase.from('seminar_requests').insert([{
        title: data.title,
        description: data.description,
        proposed_date: data.proposedDate,
        duration: data.duration,
        target_audience: data.targetAudience,
        requirements: data.requirements || null,
        status: 'pending', // Use lowercase to match the database constraint
      }]);

      if (error) throw error;

      toast({
        title: "Seminar request submitted",
        description: "Your seminar request has been submitted for approval.",
      });

      reset();
    } catch (err: any) {
      console.error("Error submitting seminar request:", err);
      toast({
        title: "Error",
        description: `Failed to submit the seminar request: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const fetchPreviousRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("seminar_requests")
        .select("*")
        .order("proposed_date", { ascending: false });

      if (error) throw error;

      // Normalize status to lowercase for consistency
      const normalizedData = data.map((req: any) => ({
        ...req,
        status: req.status.toLowerCase(),
      }));

      setSeminarRequests(normalizedData);
    } catch (err) {
      console.error("Error fetching seminar requests:", err);
      toast({
        title: "Error",
        description: "Failed to load previous seminar requests.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "previous") {
      fetchPreviousRequests();
    }
  }, [tab]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Seminars</h1>

      <Tabs defaultValue="form" value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="form">Request a Seminar</TabsTrigger>
          <TabsTrigger value="previous">Previous Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle>Request a Seminar</CardTitle>
              <CardDescription>
                Share your industry knowledge with current students by requesting to organize a seminar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">Seminar Title</label>
                  <Input
                    id="title"
                    placeholder="e.g. Web Development Trends 2023"
                    {...register("title", { required: true })}
                  />
                  {errors.title && <p className="text-red-500 text-xs">This field is required</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">Seminar Description</label>
                  <Textarea
                    id="description"
                    placeholder="Describe the seminar topic, what students will learn, and its relevance..."
                    className="min-h-32"
                    {...register("description", { required: true })}
                  />
                  {errors.description && <p className="text-red-500 text-xs">This field is required</p>}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="proposedDate" className="text-sm font-medium">Proposed Date</label>
                    <Input
                      id="proposedDate"
                      type="date"
                      {...register("proposedDate", { required: true })}
                    />
                    {errors.proposedDate && <p className="text-red-500 text-xs">This field is required</p>}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="duration" className="text-sm font-medium">Duration (hours)</label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="e.g. 2"
                      {...register("duration", { required: true, min: 0.5, max: 8 })}
                    />
                    {errors.duration && <p className="text-red-500 text-xs">Valid duration required (0.5–8 hours)</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="targetAudience" className="text-sm font-medium">Target Audience</label>
                  <Input
                    id="targetAudience"
                    placeholder="e.g. Third-year Computer Science students interested in web development"
                    {...register("targetAudience", { required: true })}
                  />
                  {errors.targetAudience && <p className="text-red-500 text-xs">This field is required</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="requirements" className="text-sm font-medium">Special Requirements (optional)</label>
                  <Textarea
                    id="requirements"
                    placeholder="Any special requirements for the seminar, such as equipment, software, etc."
                    {...register("requirements")}
                  />
                </div>

                <Button type="submit" className="bg-placement-primary hover:bg-placement-primary/90">
                  Submit Request
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="previous">
          <Card>
            <CardHeader>
              <CardTitle>Previous Seminar Requests</CardTitle>
              <CardDescription>Track the status of your submitted seminar requests.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : seminarRequests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Proposed Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seminarRequests.map((req: any) => (
                      <TableRow key={req.id}>
                        <TableCell>{req.title}</TableCell>
                        <TableCell>{new Date(req.proposed_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge className={
                            req.status === "pending"
                              ? "bg-yellow-500 hover:bg-yellow-600"
                              : req.status === "approved"
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-red-600 hover:bg-red-700"
                          }>
                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No seminar requests found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Seminars;