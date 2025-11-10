"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { trpc } from "@/lib/trpc";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { FormFieldWithCounter } from "@/components/ui/form-field-with-counter";
import { WrappableText } from "@/components/ui/wrappable-text";
import {
  validateName,
  validateDescription,
  VALIDATION_LIMITS,
} from "@/lib/validation";

const MODELS = [
  { value: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B" },
  { value: "mistralai/mistral-large", label: "Mistral Large" },
  { value: "qwen/qwen-2.5-72b-instruct", label: "Qwen 2.5 72B" },
  { value: "openai/gpt-oss-120b", label: "GPT-OSS 120B" },
];

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatbotToDelete, setChatbotToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    model: "meta-llama/llama-3.3-70b-instruct",
    systemPrompt:
      "You are a helpful teaching assistant. Answer questions based on the provided context from course materials.",
    temperature: 70,
    maxTokens: 2000,
  });

  // Fetch chatbots
  const {
    data: chatbots,
    isLoading: chatbotsLoading,
    refetch,
  } = trpc.chatbot.list.useQuery(undefined, {
    enabled: !!session,
  });

  // Create chatbot mutation
  const createChatbot = trpc.chatbot.create.useMutation({
    onSuccess: () => {
      setDialogOpen(false);
      refetch();
      toast.success("Chatbot created successfully!");
      setFormData({
        name: "",
        description: "",
        model: "meta-llama/llama-3.3-70b-instruct",
        systemPrompt:
          "You are a helpful teaching assistant. Answer questions based on the provided context from course materials.",
        temperature: 70,
        maxTokens: 2000,
      });
    },
    onError: (error) => {
      toast.error("Failed to create chatbot", {
        description: error.message,
      });
    },
  });

  // Delete chatbot mutation
  const deleteChatbot = trpc.chatbot.delete.useMutation({
    onSuccess: () => {
      setDeleteDialogOpen(false);
      setChatbotToDelete(null);
      refetch();
      toast.success("Chatbot deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete chatbot", {
        description: error.message,
      });
    },
  });

  const handleCreateChatbot = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameValidation = validateName(formData.name);
    if (!nameValidation.isValid) {
      toast.error(nameValidation.error!, {
        description: nameValidation.description,
      });
      return;
    }

    const descriptionValidation = validateDescription(
      formData.description,
      true,
    );
    if (!descriptionValidation.isValid) {
      toast.error(descriptionValidation.error!, {
        description: descriptionValidation.description,
      });
      return;
    }

    createChatbot.mutate({
      name: formData.name,
      model: formData.model as
        | "meta-llama/llama-3.3-70b-instruct"
        | "mistralai/mistral-large"
        | "qwen/qwen-2.5-72b-instruct"
        | "openai/gpt-oss-120b",
      systemPrompt: formData.systemPrompt,
      description: formData.description,
      temperature: formData.temperature,
      maxTokens: formData.maxTokens,
    });
  };

  const handleDeleteChatbot = () => {
    if (chatbotToDelete) {
      deleteChatbot.mutate({ id: chatbotToDelete });
    }
  };

  // Redirect if not logged in
  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  // Type assertion for extended user fields
  const user = session.user as typeof session.user & {
    role: "user" | "admin";
    status: "pending" | "approved" | "rejected";
  };

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Welcome back, {session.user.name}!
            </p>
          </div>
          <Button
            onClick={async () => {
              await signOut();
              toast.success("Signed out successfully");
              router.push("/login");
            }}
          >
            Sign Out
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Total Chatbots</CardTitle>
              <CardDescription>Active chatbots</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{chatbots?.length || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Role</CardTitle>
              <CardDescription>Account status</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                {user.role === "admin" ? "Admin" : "User"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Navigate</CardDescription>
            </CardHeader>
            <CardContent>
              {user.role === "admin" && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="w-full">
                    Admin Dashboard
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chatbots */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Your Chatbots</CardTitle>
                <CardDescription>
                  Create and manage your AI chatbots
                </CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Create Chatbot</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Chatbot</DialogTitle>
                    <DialogDescription>
                      Configure your AI chatbot for your course
                    </DialogDescription>
                  </DialogHeader>

                  {createChatbot.error && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {createChatbot.error.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleCreateChatbot} className="space-y-4">
                    <FormFieldWithCounter
                      id="name"
                      label="Chatbot Name"
                      value={formData.name}
                      onChange={(value) =>
                        setFormData({ ...formData, name: value })
                      }
                      maxLength={VALIDATION_LIMITS.NAME_MAX_LENGTH}
                      warningThreshold={
                        VALIDATION_LIMITS.NAME_WARNING_THRESHOLD
                      }
                      placeholder="CS101 Assistant"
                      required
                    />

                    <FormFieldWithCounter
                      id="description"
                      label="Description"
                      value={formData.description}
                      onChange={(value) =>
                        setFormData({ ...formData, description: value })
                      }
                      maxLength={VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH}
                      warningThreshold={
                        VALIDATION_LIMITS.DESCRIPTION_WARNING_THRESHOLD
                      }
                      placeholder="AI assistant for Introduction to Computer Science"
                      type="textarea"
                      rows={3}
                      required
                    />

                    <div className="space-y-2">
                      <Label htmlFor="model">AI Model *</Label>
                      <Select
                        value={formData.model}
                        onValueChange={(value) =>
                          setFormData({ ...formData, model: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MODELS.map((model) => (
                            <SelectItem key={model.value} value={model.value}>
                              {model.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="systemPrompt">System Prompt *</Label>
                      <Textarea
                        id="systemPrompt"
                        placeholder="You are a helpful teaching assistant..."
                        value={formData.systemPrompt}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            systemPrompt: e.target.value,
                          })
                        }
                        rows={4}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="temperature">Temperature</Label>
                        <Input
                          id="temperature"
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={formData.temperature}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              temperature: parseInt(e.target.value),
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Control randomness (0 = focused, 100 = creative)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxTokens">Max Tokens</Label>
                        <Input
                          id="maxTokens"
                          type="number"
                          min="100"
                          max="4000"
                          step="100"
                          value={formData.maxTokens}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              maxTokens: parseInt(e.target.value),
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Maximum length of responses (100-4000)
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        disabled={createChatbot.isPending}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createChatbot.isPending}>
                        {createChatbot.isPending
                          ? "Creating..."
                          : "Create Chatbot"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {chatbotsLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading chatbots...</p>
              </div>
            ) : !chatbots || chatbots.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No chatbots yet</p>
                <Button onClick={() => setDialogOpen(true)}>
                  Create Your First Chatbot
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {chatbots.map((chatbot) => (
                  <Card
                    key={chatbot.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{chatbot.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        <WrappableText>{chatbot.description}</WrappableText>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Model:</span>
                          <Badge variant="outline">
                            {MODELS.find((m) => m.value === chatbot.model)
                              ?.label || chatbot.model}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Created:
                          </span>
                          <span>
                            {new Date(chatbot.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Link
                            href={`/chatbot/${chatbot.id}`}
                            className="flex-1"
                          >
                            <Button className="w-full" variant="outline">
                              Open Chatbot
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setChatbotToDelete(chatbot.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteChatbot}
        title="Delete Chatbot"
        description="Are you sure you want to delete this chatbot? This action cannot be undone and will permanently delete all uploaded files, conversation history, and analytics data."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        loading={deleteChatbot.isPending}
      />
    </div>
  );
}
