import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { RequestStatus } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Loader2 } from "lucide-react";

interface SeminarRequest {
  id: string;
  title: string;
  proposed_date: string;
  status: RequestStatus;
}

interface Referral {
  id: string;
  student_id: string;
  student_name: string;
  company: string;
  job_title: string;
  status: RequestStatus;
  created_at: string;
}

const Requests = () => {
  const { toast } = useToast();
  const [seminarRequests, setSeminarRequests] = useState<SeminarRequest[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState({
    seminars: true,
    referrals: true,
  });
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("seminars");

  useEffect(() => {
    fetchSeminarRequests();
    fetchReferrals();
  }, []);

  const fetchSeminarRequests = async () => {
    try {
      setLoading((prev) => ({ ...prev, seminars: true }));
      const { data, error } = await supabase
        .from("seminar_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Normalize status to lowercase
      const normalizedData = data.map((req: any) => ({
        ...req,
        status: req.status.toLowerCase() as RequestStatus,
      }));

      setSeminarRequests(normalizedData as SeminarRequest[]);
    } catch (err) {
      console.error("Error fetching seminar requests:", err);
      toast({
        title: "Error",
        description: "Failed to fetch seminar requests",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, seminars: false }));
    }
  };

  const fetchReferrals = async () => {
    try {
      setLoading((prev) => ({ ...prev, referrals: true }));
      const { data, error } = await supabase
        .from("referrals")
        .select(`
          id,
          student_id,
          students:student_id(first_name, last_name),
          company,
          job_title,
          status,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Map the data to include student name and normalize status
      const formattedData = data.map((referral: any) => ({
        id: referral.id,
        student_id: referral.student_id,
        student_name: `${referral.students?.first_name || ''} ${referral.students?.last_name || ''}`.trim() || "Unknown",
        company: referral.company,
        job_title: referral.job_title,
        status: referral.status.toLowerCase() as RequestStatus,
        created_at: referral.created_at,
      }));

      setReferrals(formattedData);
    } catch (err) {
      console.error("Error fetching referrals:", err);
      toast({
        title: "Error",
        description: "Failed to fetch referrals",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, referrals: false }));
    }
  };

  const handleRequestStatus = async (id: string, status: RequestStatus, type: "seminar" | "referral") => {
    try {
      setUpdatingId(id);

      const tableName = type === "seminar" ? "seminar_requests" : "referrals";
      const { error } = await supabase
        .from(tableName)
        .update({ status: status.toLowerCase() }) // Ensure status is lowercase in the database
        .eq("id", id);

      if (error) throw error;

      if (type === "seminar") {
        setSeminarRequests((prev) =>
          prev.map((req) => (req.id === id ? { ...req, status: status.toLowerCase() as RequestStatus } : req))
        );
      } else {
        setReferrals((prev) =>
          prev.map((req) => (req.id === id ? { ...req, status: status.toLowerCase() as RequestStatus } : req))
        );
      }

      toast({
        title: `${type === "seminar" ? "Seminar" : "Referral"} request ${status.toLowerCase()}`,
        description: `The ${type} request has been ${status.toLowerCase()}.`,
      });
    } catch (err) {
      console.error(`Error updating ${type} status:`, err);
      toast({
        title: "Error",
        description: `Failed to update ${type} status`,
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Requests</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="seminars">Seminar Requests</TabsTrigger>
          <TabsTrigger value="referrals">Referral Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="seminars">
          <Card>
            <CardHeader>
              <CardTitle>Seminar Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {loading.seminars ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : seminarRequests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Proposed Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seminarRequests.map((seminar) => (
                      <TableRow key={seminar.id}>
                        <TableCell className="font-medium">{seminar.title}</TableCell>
                        <TableCell>
                          {new Date(seminar.proposed_date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              seminar.status === "approved"
                                ? "bg-green-600 hover:bg-green-700"
                                : seminar.status === "rejected"
                                  ? "bg-red-600 hover:bg-red-700"
                                  : "bg-yellow-500 hover:bg-yellow-600"
                            }
                          >
                            {seminar.status.charAt(0).toUpperCase() + seminar.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {seminar.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  className="gap-2 bg-green-600 hover:bg-green-700"
                                  onClick={() => handleRequestStatus(seminar.id, "approved", "seminar")}
                                  disabled={updatingId === seminar.id}
                                >
                                  {updatingId === seminar.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Check className="h-4 w-4" />
                                      Approve
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="gap-2"
                                  onClick={() => handleRequestStatus(seminar.id, "rejected", "seminar")}
                                  disabled={updatingId === seminar.id}
                                >
                                  {updatingId === seminar.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <X className="h-4 w-4" />
                                      Reject
                                    </>
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No seminar requests available.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals">
          <Card>
            <CardHeader>
              <CardTitle>Referral Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {loading.referrals ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : referrals.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map((referral) => (
                      <TableRow key={referral.id}>
                        <TableCell className="font-medium">{referral.student_name}</TableCell>
                        <TableCell>{referral.company}</TableCell>
                        <TableCell>{referral.job_title}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              referral.status === "approved"
                                ? "bg-green-600 hover:bg-green-700"
                                : referral.status === "rejected"
                                  ? "bg-red-600 hover:bg-red-700"
                                  : referral.status === "withdrawn"
                                    ? "bg-gray-500 hover:bg-gray-600"
                                    : "bg-yellow-500 hover:bg-yellow-600"
                            }
                          >
                            {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {referral.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  className="gap-2 bg-green-600 hover:bg-green-700"
                                  onClick={() => handleRequestStatus(referral.id, "approved", "referral")}
                                  disabled={updatingId === referral.id}
                                >
                                  {updatingId === referral.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Check className="h-4 w-4" />
                                      Approve
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="gap-2"
                                  onClick={() => handleRequestStatus(referral.id, "rejected", "referral")}
                                  disabled={updatingId === referral.id}
                                >
                                  {updatingId === referral.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <X className="h-4 w-4" />
                                      Reject
                                    </>
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No referral requests available.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Requests;