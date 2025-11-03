import { cn } from "@/lib/utils";
import { memo } from "react";
import { Streamdown } from "streamdown";

export type MarkdownProps = {
  children: string;
  className?: string;
  parseIncompleteMarkdown?: boolean;
};

function MarkdownComponent({
  children,
  className,
  parseIncompleteMarkdown = false,
}: MarkdownProps) {
  return (
    <div className={cn("streamdown-content", className)}>
      <Streamdown parseIncompleteMarkdown={parseIncompleteMarkdown}>
        {children}
      </Streamdown>
    </div>
  );
}

const Markdown = memo(MarkdownComponent);
Markdown.displayName = "Markdown";

export { Markdown };
