
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JobPostForm from "@/components/placement/JobPostForm";
import JobsDisplay from "@/components/placement/JobsDisplay";

const Opportunities = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Job Opportunities</h1>
      
      <Tabs defaultValue="posted">
        <TabsList className="w-full">
          <TabsTrigger value="posted" className="flex-1">Posted Opportunities</TabsTrigger>
          <TabsTrigger value="create" className="flex-1">Post New Opportunity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="posted" className="mt-6">
          <JobsDisplay mode="placement" />
        </TabsContent>
        
        <TabsContent value="create" className="mt-6">
          <JobPostForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Opportunities;



