import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Filter, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Department, Year } from "@/types";

interface Student {
  id: string;
  user_id: string;
  prn: string;
  department: string;
  year: string;
  is_seda: boolean;
  is_placed: boolean;
  first_name?: string;
  last_name?: string;
}

const Students = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    year: "all-years",
    department: "all-branches",
    placed: "all-students",
    search: ""
  });

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);

        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('id, user_id, prn, department, year, is_seda, is_placed');

        if (studentsError) throw studentsError;
        console.log("Fetched students:", studentsData);

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name');

        if (profilesError) throw profilesError;
        console.log("Fetched profiles:", profilesData);

        const merged = studentsData.map(student => {
          const profile = profilesData.find(profile => profile.id === student.user_id);
          console.log(`Matching student user_id ${student.user_id} with profile:`, profile);
          return {
            ...student,
            first_name: profile?.first_name || '',
            last_name: profile?.last_name || ''
          };
        });

        console.log("Merged students:", merged);
        setStudents(merged);
        setFilteredStudents(merged);
      } catch (err) {
        console.error('Error fetching students or profiles:', err);
        setError('Failed to fetch students or profiles');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  useEffect(() => {
    let result = students;

    if (filters.year && filters.year !== "all-years") {
      result = result.filter(student => student.year === filters.year);
    }

    if (filters.department && filters.department !== "all-branches") {
      result = result.filter(student => student.department === filters.department);
    }

    if (filters.placed && filters.placed !== "all-students") {
      const isPlaced = filters.placed === "Placed";
      result = result.filter(student => student.is_placed === isPlaced);
    }

    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter(student =>
        (student.prn && student.prn.toLowerCase().includes(query)) ||
        (student.department && student.department.toLowerCase().includes(query))
      );
    }

    setFilteredStudents(result);
  }, [filters, students]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      year: "all-years",
      department: "all-branches",
      placed: "all-students",
      search: ""
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Students</h1>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2" /> Filter Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label htmlFor="year" className="text-sm font-medium">Year</label>
              <Select value={filters.year} onValueChange={(value) => handleFilterChange("year", value)}>
                <SelectTrigger id="year">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-years">All Years</SelectItem>
                  <SelectItem value={Year.FY}>{Year.FY}</SelectItem>
                  <SelectItem value={Year.SY}>{Year.SY}</SelectItem>
                  <SelectItem value={Year.TY}>{Year.TY}</SelectItem>
                  <SelectItem value={Year.BTECH}>{Year.BTECH}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="department" className="text-sm font-medium">Branch</label>
              <Select value={filters.department} onValueChange={(value) => handleFilterChange("department", value)}>
                <SelectTrigger id="department">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-branches">All Branches</SelectItem>
                  {Object.values(Department).map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="placed" className="text-sm font-medium">Placed</label>
              <Select value={filters.placed} onValueChange={(value) => handleFilterChange("placed", value)}>
                <SelectTrigger id="placed">
                  <SelectValue placeholder="All Students" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-students">All Students</SelectItem>
                  <SelectItem value="Placed">Placed</SelectItem>
                  <SelectItem value="Unplaced">Unplaced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="search" className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by PRN or branch"
                  className="pl-8"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={resetFilters} className="mr-2">
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Student Results ({filteredStudents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-6 text-red-500">
              {error}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>First Name</TableHead>
                    <TableHead>Last Name</TableHead>
                    <TableHead>PRN</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Is SEDA</TableHead>
                    <TableHead>Is Placed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.first_name || 'Unknown'}</TableCell>
                        <TableCell>{student.last_name || 'Unknown'}</TableCell>
                        <TableCell className="font-medium">{student.prn || 'N/A'}</TableCell>
                        <TableCell>{student.department || 'N/A'}</TableCell>
                        <TableCell>{student.year || 'N/A'}</TableCell>
                        <TableCell>{student.is_seda ? "Yes" : "No"}</TableCell>
                        <TableCell>
                          {student.is_placed ? (
                            <Badge className="bg-green-600">Yes</Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        No students found matching the filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Students;