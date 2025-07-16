"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import JobsDisplay from "@/components/placement/JobsDisplay"
import { Loader2, Building, Calendar, Briefcase, Search, Check, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

interface Referral {
  id: string
  alumni_id: string
  student_id: string
  job_title: string
  company: string
  message: string
  job_id?: string
  status: string
  created_at: string
}

interface AlumniProfile {
  id: string
  first_name: string
  last_name: string
}

const Opportunities = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [studentData, setStudentData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filterDepartment, setFilterDepartment] = useState<string | undefined>()
  const [filterYear, setFilterYear] = useState<string | undefined>()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [filteredReferrals, setFilteredReferrals] = useState<Referral[]>([])
  const [alumniProfiles, setAlumniProfiles] = useState<{ [key: string]: AlumniProfile }>({})
  const [referralsLoading, setReferralsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchStudentData()
      fetchReferrals()
    }
  }, [user])

  useEffect(() => {
    if (activeTab === "recommended" && studentData) {
      setFilterDepartment(studentData.department)
      setFilterYear(studentData.year)
    }
  }, [activeTab, studentData])

  // Filter referrals when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredReferrals(referrals)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = referrals.filter(
      (referral) =>
        referral.job_title.toLowerCase().includes(term) ||
        referral.company.toLowerCase().includes(term) ||
        referral.message.toLowerCase().includes(term) ||
        alumniProfiles[referral.alumni_id]?.first_name.toLowerCase().includes(term) ||
        alumniProfiles[referral.alumni_id]?.last_name.toLowerCase().includes(term),
    )
    setFilteredReferrals(filtered)
  }, [searchTerm, referrals, alumniProfiles])

  const fetchStudentData = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("students").select("*").eq("user_id", user.id).maybeSingle()

      if (error) throw error

      setStudentData(data)

      // Set initial filters based on student's department and year
      if (data) {
        setFilterDepartment(data.department)
        setFilterYear(data.year)
      }
    } catch (error) {
      console.error("Error fetching student data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchReferrals = async () => {
    if (!user) return

    try {
      setReferralsLoading(true)

      // First get the student ID from the students table
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (studentError) {
        console.error("Error fetching student ID:", studentError)
        setReferralsLoading(false)
        return
      }

      if (!studentData || !studentData.id) {
        console.error("Student ID not found")
        setReferralsLoading(false)
        return
      }

      // Now fetch referrals for this student
      const { data, error } = await supabase.from("referrals").select("*").eq("student_id", studentData.id)

      if (error) throw error

      if (data && data.length > 0) {
        setReferrals(data)
        setFilteredReferrals(data)

        // Fetch alumni profiles for each referral
        const alumniIds = [...new Set(data.map((ref) => ref.alumni_id))]
        const profiles: { [key: string]: AlumniProfile } = {}

        for (const alumniId of alumniIds) {
          try {
            // Use user_id instead of id for the profiles table
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("id, first_name, last_name")
              .eq("id", alumniId)
              .single()

            if (profileError) {
              console.error(`Error fetching profile for alumni ${alumniId}:`, profileError)
              // Add a placeholder profile
              profiles[alumniId] = {
                id: alumniId,
                first_name: "Unknown",
                last_name: "Alumni",
              }
            } else if (profileData) {
              profiles[alumniId] = profileData
            }
          } catch (err) {
            console.error(`Error processing alumni ${alumniId}:`, err)
          }
        }

        setAlumniProfiles(profiles)
      } else {
        setReferrals([])
        setFilteredReferrals([])
      }
    } catch (error) {
      console.error("Error fetching referrals:", error)
    } finally {
      setReferralsLoading(false)
    }
  }

  const handleAcceptReferral = async (referralId: string) => {
    try {
      setUpdatingId(referralId)

      // Update the referral status to "approved" in the database
      const { error } = await supabase
        .from("referrals")
        .update({ status: "approved" })
        .eq("id", referralId)

      if (error) throw error

      // Update local state
      setReferrals((prev) =>
        prev.map((ref) =>
          ref.id === referralId ? { ...ref, status: "approved" } : ref
        )
      )
      setFilteredReferrals((prev) =>
        prev.map((ref) =>
          ref.id === referralId ? { ...ref, status: "approved" } : ref
        )
      )

      toast({
        title: "Referral Accepted",
        description: "You have successfully accepted the referral.",
      })
    } catch (error) {
      console.error("Error accepting referral:", error)
      toast({
        title: "Error",
        description: "Failed to accept the referral. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRejectReferral = async (referralId: string) => {
    try {
      setUpdatingId(referralId)

      // Update the referral status to "rejected" in the database
      const { error } = await supabase
        .from("referrals")
        .update({ status: "rejected" })
        .eq("id", referralId)

      if (error) throw error

      // Update local state
      setReferrals((prev) =>
        prev.map((ref) =>
          ref.id === referralId ? { ...ref, status: "rejected" } : ref
        )
      )
      setFilteredReferrals((prev) =>
        prev.map((ref) =>
          ref.id === referralId ? { ...ref, status: "rejected" } : ref
        )
      )

      toast({
        title: "Referral Rejected",
        description: "You have successfully rejected the referral.",
      })
    } catch (error) {
      console.error("Error rejecting referral:", error)
      toast({
        title: "Error",
        description: "Failed to reject the referral. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleWithdrawApplication = async (referralId: string) => {
    try {
      setWithdrawingId(referralId)

      // Update the referral status to "withdrawn" in the database
      const { error } = await supabase
        .from("referrals")
        .update({ status: "withdrawn" })
        .eq("id", referralId)

      if (error) throw error

      // Update local state
      setReferrals((prev) =>
        prev.map((ref) =>
          ref.id === referralId ? { ...ref, status: "withdrawn" } : ref
        )
      )
      setFilteredReferrals((prev) =>
        prev.map((ref) =>
          ref.id === referralId ? { ...ref, status: "withdrawn" } : ref
        )
      )

      toast({
        title: "Application Withdrawn",
        description: "Your application has been successfully withdrawn.",
      })
    } catch (error) {
      console.error("Error withdrawing application:", error)
      toast({
        title: "Error",
        description: "Failed to withdraw the application. Please try again.",
        variant: "destructive",
      })
    } finally {
      setWithdrawingId(null)
    }
  }

  const confirmWithdraw = (referralId: string) => {
    toast({
      title: "Confirm Withdrawal",
      description: "Are you sure you want to withdraw this application?",
      action: (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => handleWithdrawApplication(referralId)}
            className="bg-red-600 hover:bg-red-700"
          >
            Yes, Withdraw
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast({})}
          >
            Cancel
          </Button>
        </div>
      ),
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  const renderReferrals = () => {
    if (referralsLoading) {
      return (
        <div className="flex justify-center items-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-placement-primary" />
        </div>
      )
    }

    if (filteredReferrals.length === 0) {
      return (
        <Card className="bg-gray-50 border-dashed mb-6">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Briefcase className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              {searchTerm ? "No matching referrals found" : "No referrals yet"}
            </h3>
            <p className="text-sm text-gray-500 text-center mt-2">
              {searchTerm
                ? "Try adjusting your search terms or clear the search"
                : "You don't have any referrals from alumni yet."}
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Referrals For You</h2>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search referrals..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredReferrals.map((referral) => {
            const alumni = alumniProfiles[referral.alumni_id]
            return (
              <Card key={referral.id} className="overflow-hidden border-placement-primary/20">
                <CardHeader className="pb-2 bg-placement-primary/5">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{referral.job_title}</CardTitle>
                      <div className="flex items-center mt-1 text-gray-500">
                        <Building className="h-4 w-4 mr-1" />
                        <CardDescription>{referral.company}</CardDescription>
                      </div>
                    </div>
                    <Badge
                      className={
                        referral.status === "pending"
                          ? "bg-yellow-500"
                          : referral.status === "approved"
                            ? "bg-green-600"
                            : referral.status === "withdrawn"
                              ? "bg-gray-500"
                              : "bg-red-500"
                      }
                    >
                      {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 pb-2">
                  <div className="space-y-4">
                    {alumni && (
                      <div className="flex items-start gap-2">
                        <div className="h-8 w-8 rounded-full bg-placement-primary/10 flex items-center justify-center text-placement-primary font-medium">
                          {alumni.first_name?.[0] || "?"}
                          {alumni.last_name?.[0] || "?"}
                        </div>
                        <div>
                          <p className="font-medium">
                            {alumni.first_name || "Unknown"} {alumni.last_name || "Alumni"}
                          </p>
                          <p className="text-sm text-gray-500">Referred you on {formatDate(referral.created_at)}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Date: {formatDate(referral.created_at)}</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Referral Message</h4>
                      <p className="text-sm text-gray-600 italic">"{referral.message}"</p>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="bg-gray-50 border-t pt-4 flex flex-col gap-2">
                  {referral.status === "pending" ? (
                    <div className="flex gap-2 w-full">
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => handleAcceptReferral(referral.id)}
                        disabled={updatingId === referral.id}
                      >
                        {updatingId === referral.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Accept
                          </>
                        )}
                      </Button>
                      <Button
                        className="w-full bg-red-600 hover:bg-red-700"
                        onClick={() => handleRejectReferral(referral.id)}
                        disabled={updatingId === referral.id}
                      >
                        {updatingId === referral.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <>
                      {referral.job_id ? (
                        <Button className="w-full bg-placement-primary hover:bg-placement-primary/90">
                          View Job Details
                        </Button>
                      ) : (
                        <Button className="w-full bg-placement-primary hover:bg-placement-primary/90">
                          Contact Alumni
                        </Button>
                      )}
                      {referral.status === "approved" && (
                        <Button
                          className="w-full bg-red-600 hover:bg-red-700"
                          onClick={() => confirmWithdraw(referral.id)}
                          disabled={withdrawingId === referral.id}
                        >
                          {withdrawingId === referral.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Withdraw Application"
                          )}
                        </Button>
                      )}
                    </>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-placement-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Job Opportunities</h1>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filter Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium block mb-2">Department</label>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CS">Computer Science</SelectItem>
                  <SelectItem value="IT">Information Technology</SelectItem>
                  <SelectItem value="ENTC">Electronics & Telecom</SelectItem>
                  <SelectItem value="MECH">Mechanical</SelectItem>
                  <SelectItem value="CIVIL">Civil</SelectItem>
                  <SelectItem value="ELECTRICAL">Electrical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Year</label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger>
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FE">First Year</SelectItem>
                  <SelectItem value="SE">Second Year</SelectItem>
                  <SelectItem value="TE">Third Year</SelectItem>
                  <SelectItem value="BE">Final Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">
            All Opportunities
          </TabsTrigger>
          <TabsTrigger value="recommended" className="flex-1">
            Recommended For You
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <JobsDisplay mode="student" />
        </TabsContent>

        <TabsContent value="recommended" className="mt-6">
          {renderReferrals()}
          <JobsDisplay mode="student" filterByDepartment={studentData?.department} filterByYear={studentData?.year} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Opportunities