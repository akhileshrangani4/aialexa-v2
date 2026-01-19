"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useSession } from "@/lib/auth-client";
import { useState } from "react";
import { toast } from "sonner";
import { Save, CheckCircle2 } from "lucide-react";

export function ProfileSection() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user.name || "");

  const updateName = trpc.auth.updateName.useMutation({
    onSuccess: () => {
      toast.success("Name updated");
      window.location.reload();
    },
    onError: (error) => {
      toast.error("Failed to update name", { description: error.message });
    },
  });

  const handleUpdateName = () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    updateName.mutate({ name: name.trim() });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <div className="flex gap-2">
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="flex-1"
          />
          <Button
            onClick={handleUpdateName}
            disabled={
              updateName.isPending ||
              name === session?.user.name ||
              !name.trim()
            }
            size="sm"
          >
            {updateName.isPending ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        </div>
        {name === session?.user.name && name.trim() && (
          <p className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Up to date
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          value={session?.user.email || ""}
          disabled
          className="bg-muted/50"
        />
        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
      </div>
    </div>
  );
}
