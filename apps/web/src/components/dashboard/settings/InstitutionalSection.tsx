"use client";

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
import { Save } from "lucide-react";
import { TITLE_OPTIONS } from "@/lib/constants/title-options";

export function InstitutionalSection() {
  const [titleSelection, setTitleSelection] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [institution, setInstitution] = useState("");
  const [department, setDepartment] = useState("");
  const [webpage, setWebpage] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  const { data: profile, isLoading } = trpc.auth.getProfile.useQuery();

  const utils = trpc.useUtils();

  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: async () => {
      await utils.auth.getProfile.invalidate();
      toast.success("Information updated");
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error("Failed to update", { description: error.message });
    },
  });

  useEffect(() => {
    if (profile) {
      // Set title selection
      if (profile.title) {
        const match = TITLE_OPTIONS.find((opt) => opt.label === profile.title);
        if (match) {
          setTitleSelection(match.value);
          setCustomTitle("");
        } else {
          setTitleSelection("other");
          setCustomTitle(profile.title);
        }
      } else {
        setTitleSelection("");
        setCustomTitle("");
      }
      setInstitution(profile.institutionalAffiliation || "");
      setDepartment(profile.department || "");
      setWebpage(profile.facultyWebpage || "");
    }
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    const currentTitle =
      titleSelection === "other"
        ? customTitle
        : TITLE_OPTIONS.find((opt) => opt.value === titleSelection)?.label ||
          "";
    const changed =
      currentTitle !== (profile.title || "") ||
      institution !== (profile.institutionalAffiliation || "") ||
      department !== (profile.department || "") ||
      webpage !== (profile.facultyWebpage || "");
    setHasChanges(changed);
  }, [titleSelection, customTitle, institution, department, webpage, profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleSelection) return toast.error("Title is required");
    if (titleSelection === "other" && !customTitle.trim())
      return toast.error("Please enter your title");
    if (!institution.trim()) return toast.error("Institution is required");
    if (!department.trim()) return toast.error("Department is required");
    if (!webpage.trim()) return toast.error("Faculty webpage is required");
    try {
      new URL(webpage.trim());
    } catch {
      return toast.error("Invalid URL");
    }

    const resolvedTitle =
      titleSelection === "other"
        ? customTitle.trim()
        : TITLE_OPTIONS.find((opt) => opt.value === titleSelection)!.label;

    updateProfile.mutate({
      title: resolvedTitle,
      institutionalAffiliation: institution.trim(),
      department: department.trim(),
      facultyWebpage: webpage.trim(),
    });
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Select
            value={titleSelection}
            onValueChange={(v) => {
              setTitleSelection(v);
              if (v !== "other") setCustomTitle("");
            }}
            disabled={updateProfile.isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select title" />
            </SelectTrigger>
            <SelectContent>
              {TITLE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {titleSelection === "other" && (
            <Input
              placeholder="Enter title"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              disabled={updateProfile.isPending}
            />
          )}
        </div>

        <div className="space-y-2">
          <Label>Institution</Label>
          <Input
            placeholder="University of Example"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            disabled={updateProfile.isPending}
          />
        </div>

        <div className="space-y-2">
          <Label>Department</Label>
          <Input
            placeholder="Computer Science"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            disabled={updateProfile.isPending}
          />
        </div>

        <div className="space-y-2">
          <Label>Faculty Webpage</Label>
          <Input
            type="url"
            placeholder="university.edu/faculty/you"
            value={webpage}
            onChange={(e) => setWebpage(e.target.value)}
            onBlur={(e) => {
              const val = e.target.value.trim();
              if (val && !/^https?:\/\//i.test(val)) {
                setWebpage(`https://${val}`);
              }
            }}
            disabled={updateProfile.isPending}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={updateProfile.isPending || !hasChanges}
        size="sm"
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
    </form>
  );
}
