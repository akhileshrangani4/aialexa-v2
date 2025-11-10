import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ChatHeaderProps {
  name: string;
  description: string;
  model: string;
}

export function ChatHeader({ name, description, model }: ChatHeaderProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">{name}</CardTitle>
            <CardDescription className="mt-2">{description}</CardDescription>
          </div>
          <Badge>{model.split("/")[1]}</Badge>
        </div>
      </CardHeader>
    </Card>
  );
}
