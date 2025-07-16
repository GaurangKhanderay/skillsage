import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Users, Briefcase, Loader2 } from "lucide-react";
import { mockPlacementStats } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

// Color constants
const COLORS = ["#1e40af", "#a1a1aa"];

// Helper function to create pie chart data
const createPieData = (placed: number, total: number) => [
  { name: "Placed", value: placed },
  { name: "Not Placed", value: total - placed }
];

const Dashboard = () => {
  const [totalOpportunities, setTotalOpportunities] = useState<number | null>(null);
  const [isLoadingOpportunities, setIsLoadingOpportunities] = useState(true);
  const { toast } = useToast();

  // Calculate total placed students
  const totalPlacedStudents = mockPlacementStats.reduce((sum, dept) => sum + dept.placedStudents, 0);
  
  // Calculate total students
  const totalStudents = mockPlacementStats.reduce((sum, dept) => sum + dept.totalStudents, 0);

  // Fetch the total number of job opportunities from the database
  useEffect(() => {
    const fetchTotalOpportunities = async () => {
      setIsLoadingOpportunities(true);
      try {
        const { count, error } = await supabase
          .from("job_opportunities")
          .select("*", { count: "exact", head: true }); // Fetch only the count

        if (error) throw error;

        setTotalOpportunities(count || 0);
      } catch (error: any) {
        console.error("Error fetching total opportunities:", error);
        toast({
          title: "Error",
          description: "Failed to load total job opportunities.",
          variant: "destructive",
        });
        setTotalOpportunities(0); // Fallback to 0 on error
      } finally {
        setIsLoadingOpportunities(false);
      }
    };

    fetchTotalOpportunities();
  }, [toast]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-placement-primary text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Placed Students</CardTitle>
            <Users className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlacedStudents}</div>
            <p className="text-sm">
              Out of {totalStudents} students ({((totalPlacedStudents / totalStudents) * 100).toFixed(1)}%)
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-placement-secondary text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Opportunities Posted</CardTitle>
            <Briefcase className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            {isLoadingOpportunities ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{totalOpportunities}</div>
                <p className="text-sm">Across all departments</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Department-wise placement analytics */}
      <h2 className="text-xl font-bold mt-8">Department-wise Placement Analytics</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {mockPlacementStats.map((dept, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{dept.department}</CardTitle>
              <p className="text-xs text-muted-foreground">Placed Students</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={createPieData(dept.placedStudents, dept.totalStudents)}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {createPieData(dept.placedStudents, dept.totalStudents).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <div>
                  <p className="font-medium">Avg Package</p>
                  <p className="text-placement-primary font-bold">₹{dept.averagePackage} LPA</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">Highest Package</p>
                  <p className="text-placement-primary font-bold">₹{dept.highestPackage} LPA</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Recent Activities */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-blue-100 p-2">
                <Briefcase className="h-4 w-4 text-placement-primary" />
              </div>
              <div>
                <p className="font-medium">New job opportunity posted: Software Developer at Google</p>
                <p className="text-sm text-gray-500">2 days ago</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-green-100 p-2">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium">15 new students placed at Microsoft</p>
                <p className="text-sm text-gray-500">5 days ago</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-yellow-100 p-2">
                <Users className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium">Seminar request approved: Web Development Workshop</p>
                <p className="text-sm text-gray-500">1 week ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;