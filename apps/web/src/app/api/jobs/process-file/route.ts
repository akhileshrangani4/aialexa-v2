import { NextRequest, NextResponse } from "next/server";
import { verifyQStashSignature } from "@/lib/qstash";
import { env } from "@/lib/env";
import { logError } from "@/lib/logger";
import { processFile } from "@/lib/file-processor";

export async function POST(req: NextRequest) {
  try {
    // Verify QStash signature
    const signature = req.headers.get("Upstash-Signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const body = await req.text();
    const isValid = await verifyQStashSignature(
      signature,
      env.QSTASH_CURRENT_SIGNING_KEY,
      env.QSTASH_NEXT_SIGNING_KEY,
      body,
    );

    if (!isValid) {
      logError(
        new Error("Invalid QStash signature"),
        "File processing job rejected",
      );
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse job data
    const { fileId, chatbotId } = JSON.parse(body);

    // Process the file using shared function
    const result = await processFile({ fileId, chatbotId });

    return NextResponse.json({
      success: result.success,
      fileId,
      chunkCount: result.chunkCount,
    });
  } catch (error) {
    logError(error, "File processing job failed");

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
