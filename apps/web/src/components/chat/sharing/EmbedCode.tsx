"use client";

import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CodeBlock,
  CodeBlockCode,
  CodeBlockGroup,
} from "@/components/ui/code-block";
import { CopyButton } from "@/components/ui/copy-button";
import {
  generateWidgetHTML,
  generateWidgetReact,
  generateWindowHTML,
} from "@/components/embed/embedCodeGenerators";

interface EmbedCodeProps {
  shareToken: string;
}

export function EmbedCode({ shareToken }: EmbedCodeProps) {
  // Use environment variable for production, fallback to window.location.origin for dev
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const widgetHTML = generateWidgetHTML(baseUrl, shareToken);
  const widgetReact = generateWidgetReact(baseUrl, shareToken);
  const windowHTML = generateWindowHTML(baseUrl, shareToken);

  return (
    <Tabs defaultValue="widget" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="widget">Widget</TabsTrigger>
        <TabsTrigger value="window">Window</TabsTrigger>
      </TabsList>

      <TabsContent value="widget" className="space-y-4 mt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">HTML</Label>
            <CodeBlock>
              <CodeBlockGroup>
                <span className="px-4 py-2 text-xs text-muted-foreground">
                  html
                </span>
                <CopyButton text={widgetHTML} />
              </CodeBlockGroup>
              <CodeBlockCode code={widgetHTML} language="html" />
            </CodeBlock>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">JavaScript (React)</Label>
            <CodeBlock>
              <CodeBlockGroup>
                <span className="px-4 py-2 text-xs text-muted-foreground">
                  javascript
                </span>
                <CopyButton text={widgetReact} />
              </CodeBlockGroup>
              <CodeBlockCode code={widgetReact} language="javascript" />
            </CodeBlock>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="window" className="space-y-4 mt-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">HTML</Label>
          <CodeBlock>
            <CodeBlockGroup>
              <span className="px-4 py-2 text-xs text-muted-foreground">
                html
              </span>
              <CopyButton text={windowHTML} />
            </CodeBlockGroup>
            <CodeBlockCode code={windowHTML} language="html" />
          </CodeBlock>
        </div>
      </TabsContent>
    </Tabs>
  );
}
