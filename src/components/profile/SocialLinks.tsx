import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, Linkedin, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface SocialLinksProps {
  socialLinks: {
    linkedin?: string | null;
    github?: string | null;
    portfolio?: string | null;
  };
  onUpdate: (links: {
    linkedin: string;
    github: string;
    portfolio: string;
  }) => void;
}

const SocialLinks = ({ socialLinks, onUpdate }: SocialLinksProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    linkedin: socialLinks.linkedin || "",
    github: socialLinks.github || "",
    portfolio: socialLinks.portfolio || ""
  });
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSocialLinksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  const handleSocialLinksSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { data: existingLinks, error: checkError } = await supabase
        .from('social_links')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Error checking social links:", checkError);
        toast({
          title: "Failed to update",
          description: "There was an error updating your social links. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      const linksToSave = {
        linkedin: formData.linkedin || null,
        github: formData.github || null,
        portfolio: formData.portfolio || null
      };
      
      if (existingLinks) {
        const { error: updateError } = await supabase
          .from('social_links')
          .update(linksToSave)
          .eq('id', existingLinks.id);
          
        if (updateError) {
          console.error("Error updating social links:", updateError);
          toast({
            title: "Failed to update",
            description: "There was an error updating your social links. Please try again.",
            variant: "destructive"
          });
          return;
        }
      } else {
        const { error: insertError } = await supabase
          .from('social_links')
          .insert({
            user_id: user.id,
            ...linksToSave
          });
          
        if (insertError) {
          console.error("Error inserting social links:", insertError);
          toast({
            title: "Failed to save",
            description: "There was an error saving your social links. Please try again.",
            variant: "destructive"
          });
          return;
        }
      }
      
      onUpdate({
        linkedin: formData.linkedin,
        github: formData.github,
        portfolio: formData.portfolio
      });
      
      toast({
        title: "Links updated",
        description: "Your social links have been successfully updated.",
      });
      
      setIsEditMode(false);
    } catch (error) {
      console.error("Error saving social links:", error);
      toast({
        title: "Failed to save",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const getDisplayUrl = (url: string) => {
    if (!url) return "";
    try {
      return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    } catch (e) {
      return url;
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Social Links</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setIsEditMode(!isEditMode)}>
          {isEditMode ? "Cancel" : "Edit"}
        </Button>
      </CardHeader>
      <CardContent>
        {isEditMode ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="linkedin" className="text-sm font-medium flex items-center">
                <Linkedin className="h-4 w-4 mr-2 text-blue-600" /> LinkedIn
              </label>
              <Input 
                id="linkedin" 
                placeholder="https://linkedin.com/in/username" 
                value={formData.linkedin}
                onChange={handleSocialLinksChange}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="github" className="text-sm font-medium flex items-center">
                <Github className="h-4 w-4 mr-2 text-gray-900" /> GitHub
              </label>
              <Input 
                id="github" 
                placeholder="https://github.com/username" 
                value={formData.github}
                onChange={handleSocialLinksChange}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="portfolio" className="text-sm font-medium flex items-center">
                <Globe className="h-4 w-4 mr-2 text-green-600" /> Portfolio
              </label>
              <Input 
                id="portfolio" 
                placeholder="https://yourportfolio.com" 
                value={formData.portfolio}
                onChange={handleSocialLinksChange}
              />
            </div>
            
            <Button 
              className="w-full bg-placement-primary hover:bg-placement-primary/90" 
              onClick={handleSocialLinksSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="animate-spin mr-2">⏳</span> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <a 
              href={socialLinks.linkedin || "#"} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`flex items-center p-2 rounded-md hover:bg-gray-100 ${!socialLinks.linkedin && 'pointer-events-none text-gray-400'}`}
            >
              <Linkedin className="h-5 w-5 mr-3 text-blue-600" />
              <div className="flex flex-col">
                <span className="font-medium">LinkedIn</span>
              </div>
            </a>
            
            <a 
              href={socialLinks.github || "#"} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`flex items-center p-2 rounded-md hover:bg-gray-100 ${!socialLinks.github && 'pointer-events-none text-gray-400'}`}
            >
              <Github className="h-5 w-5 mr-3 text-gray-900" />
              <div className="flex flex-col">
                <span className="font-medium">GitHub</span>
              </div>
            </a>
            
            <a 
              href={socialLinks.portfolio || "#"} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`flex items-center p-2 rounded-md hover:bg-gray-100 ${!socialLinks.portfolio && 'pointer-events-none text-gray-400'}`}
            >
              <Globe className="h-5 w-5 mr-3 text-green-600" />
              <div className="flex flex-col">
                <span className="font-medium">Portfolio</span>
              </div>
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SocialLinks;
