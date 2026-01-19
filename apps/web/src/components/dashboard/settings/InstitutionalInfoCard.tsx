"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Building2, GraduationCap, Globe, Award, Save } from "lucide-react";

const TITLE_OPTIONS = [
  { value: "dr", label: "Dr" },
  { value: "professor", label: "Professor" },
  { value: "associate_professor", label: "Associate Professor" },
  { value: "assistant_professor", label: "Assistant Professor" },
  { value: "lecturer", label: "Lecturer" },
  { value: "researcher", label: "Researcher" },
  { value: "mr", label: "Mr" },
  { value: "ms", label: "Ms" },
  { value: "mrs", label: "Mrs" },
  { value: "other", label: "Other" },
];

export function InstitutionalInfoCard() {
  const [titleSelection, setTitleSelection] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [institutionalAffiliation, setInstitutionalAffiliation] = useState("");
  const [department, setDepartment] = useState("");
  const [facultyWebpage, setFacultyWebpage] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  const { data: profile, isLoading } = trpc.auth.getProfile.useQuery();

  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Institutional information updated");
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error("Failed to update information", {
        description: error.message,
      });
    },
  });

  // Pre-fill form with existing data
  useEffect(() => {
    if (profile) {
      if (profile.title) {
        const matchingOption = TITLE_OPTIONS.find(
          (opt) => opt.label === profile.title,
        );
        if (matchingOption) {
          setTitleSelection(matchingOption.value);
        } else {
          setTitleSelection("other");
          setCustomTitle(profile.title);
        }
      }
      setInstitutionalAffiliation(profile.institutionalAffiliation || "");
      setDepartment(profile.department || "");
      setFacultyWebpage(profile.facultyWebpage || "");
    }
  }, [profile]);

  // Track changes
  useEffect(() => {
    if (!profile) return;

    const currentTitle =
      titleSelection === "other"
        ? customTitle
        : TITLE_OPTIONS.find((opt) => opt.value === titleSelection)?.label ||
          "";

    const changed =
      currentTitle !== (profile.title || "") ||
      institutionalAffiliation !== (profile.institutionalAffiliation || "") ||
      department !== (profile.department || "") ||
      facultyWebpage !== (profile.facultyWebpage || "");

    setHasChanges(changed);
  }, [
    titleSelection,
    customTitle,
    institutionalAffiliation,
    department,
    facultyWebpage,
    profile,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const resolvedTitle =
      titleSelection === "other"
        ? customTitle || null
        : TITLE_OPTIONS.find((opt) => opt.value === titleSelection)?.label ||
          null;

    updateProfile.mutate({
      title: resolvedTitle,
      institutionalAffiliation,
      department,
      facultyWebpage: facultyWebpage || null,
    });
  };

  if (isLoading) {
    return (
      <Card className="border-2 shadow-sm">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">
                Institutional Information
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Loading...
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="pb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold">
              Institutional Information
            </CardTitle>
            <CardDescription className="text-base mt-1">
              Your academic affiliation and contact details
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              Title{" "}
              <span className="text-muted-foreground font-normal">
                (Optional)
              </span>
            </Label>
            <Select
              value={titleSelection}
              onValueChange={(value) => {
                setTitleSelection(value);
                if (value !== "other") {
                  setCustomTitle("");
                }
              }}
              disabled={updateProfile.isPending}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select your title" />
              </SelectTrigger>
              <SelectContent>
                {TITLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {titleSelection === "other" && (
              <Input
                placeholder="Enter your title"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                disabled={updateProfile.isPending}
                className="h-11"
              />
            )}
          </div>

          <div className="h-px bg-border" />

          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Institutional Affiliation
            </Label>
            <Input
              placeholder="University of Example"
              value={institutionalAffiliation}
              onChange={(e) => setInstitutionalAffiliation(e.target.value)}
              disabled={updateProfile.isPending}
              className="h-11"
            />
          </div>

          <div className="h-px bg-border" />

          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              Department
            </Label>
            <Input
              placeholder="Department of Computer Science"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={updateProfile.isPending}
              className="h-11"
            />
          </div>

          <div className="h-px bg-border" />

          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              Faculty Webpage{" "}
              <span className="text-muted-foreground font-normal">
                (Optional)
              </span>
            </Label>
            <Input
              type="url"
              placeholder="https://university.edu/faculty/you"
              value={facultyWebpage}
              onChange={(e) => setFacultyWebpage(e.target.value)}
              disabled={updateProfile.isPending}
              className="h-11"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={updateProfile.isPending || !hasChanges}
              className="w-full h-11"
            >
              {updateProfile.isPending ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
