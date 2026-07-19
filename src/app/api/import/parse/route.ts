import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import * as xlsx from "xlsx";
import mammoth from "mammoth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const source = formData.get("source") as string;
    
    let textToParse = "";

    if (source === "paste") {
      textToParse = formData.get("text") as string;
    } else if (source === "excel" || source === "word" || source === "json" || source === "jsonl") {
      const file = formData.get("file") as File;
      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      if (source === "excel") {
        const workbook = xlsx.read(buffer, { type: "buffer" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        textToParse = xlsx.utils.sheet_to_csv(worksheet);
      } else if (source === "word") {
        const result = await mammoth.extractRawText({ buffer });
        textToParse = result.value;
      } else if (source === "json" || source === "jsonl") {
        textToParse = buffer.toString("utf-8");
      }
    } else {
      return NextResponse.json({ error: "Invalid source" }, { status: 400 });
    }

    if (!textToParse || textToParse.trim().length === 0) {
      return NextResponse.json({ error: "No text to parse" }, { status: 400 });
    }

    // Direct parse for JSON if valid, bypass LLM
    if (source === "json") {
      try {
        const parsed = JSON.parse(textToParse);
        const leadsArray = parsed.leads || parsed.data || (Array.isArray(parsed) ? parsed : Object.values(parsed)[0]);
        if (Array.isArray(leadsArray) && leadsArray.length > 0 && typeof leadsArray[0] === 'object') {
          return NextResponse.json({ leads: leadsArray });
        }
      } catch (e) {
        // Fallback to LLM if direct parsing fails or format is unrecognized
      }
    } else if (source === "jsonl") {
      try {
        const lines = textToParse.split(/\r?\n/).filter(line => line.trim().length > 0);
        const leadsArray = lines.map(line => JSON.parse(line));
        if (leadsArray.length > 0 && typeof leadsArray[0] === 'object') {
          return NextResponse.json({ leads: leadsArray });
        }
      } catch (e) {
        // Fallback to LLM if direct parsing fails
      }
    }

    // Chunk the text to bypass the TPM rate limit on Groq API
    // The llama-3.1-8b-instant model has a strict 6,000 TPM limit on free tiers.
    // 8,000 characters is roughly 4,000 tokens for CSV data.
    const MAX_CHUNK_LENGTH = 8000; 
    const lines = textToParse.split(/\r?\n/);
    const chunks: string[] = [];
    let currentChunk = "";
    
    for (const line of lines) {
      if (currentChunk.length + line.length > MAX_CHUNK_LENGTH && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = "";
      }
      currentChunk += line + "\n";
    }
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk);
    }

    // Initialize Groq with support for multiple comma-separated API keys
    const apiKeyEnv = process.env.GROQ_API_KEY;
    if (!apiKeyEnv) {
      return NextResponse.json({ error: "GROQ_API_KEY is not set" }, { status: 500 });
    }
    
    // Split by comma, trim whitespace, and remove empty entries
    const apiKeys = apiKeyEnv.split(",").map(k => k.trim()).filter(Boolean);
    if (apiKeys.length === 0) {
      return NextResponse.json({ error: "No valid GROQ_API_KEY found" }, { status: 500 });
    }

    // To prevent hitting the rate limit across keys instantly, limit the number of parallel chunks 
    // to exactly the number of API keys we have (e.g. 3 keys = 3 chunks = ~24,000 chars processed in parallel).
    const limitedChunks = chunks.slice(0, apiKeys.length);

    const chunkPromises = limitedChunks.map(async (chunk, index) => {
      // Assign a unique API key to each concurrent chunk to perfectly distribute the TPM load
      const apiKey = apiKeys[index % apiKeys.length];
      const groq = new Groq({ apiKey });

      const prompt = `
      You are an expert data extraction assistant. I will provide you with raw text that contains business leads.
      Your task is to extract all the leads you can find into a JSON object containing a single key "leads" which maps to an array of objects.

      Each object MUST match this exact schema:
      {
        "businessName": "String (required)",
        "contactPerson": "String (optional, null if missing)",
        "phone": "String (required, extract main phone)",
        "altPhone": "String (optional, null if missing)",
        "email": "String (optional, null if missing)",
        "website": "String (optional, null if missing)",
        "address": "String (optional, null if missing)",
        "city": "String (required, infer if possible, else 'Unknown')",
        "state": "String (required, infer if possible, else 'Unknown')",
        "category": "String (required, guess the business category)"
      }

      Raw text to parse:
      """
      ${chunk}
      """
      `;

      try {
        const chatCompletion = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "llama-3.1-8b-instant",
          response_format: { type: "json_object" },
        });

        const responseText = chatCompletion.choices[0]?.message?.content || "{}";
        const parsedJson = JSON.parse(responseText);
        const leadsArray = parsedJson.leads || parsedJson.data || Object.values(parsedJson)[0] || [];
        return Array.isArray(leadsArray) ? leadsArray : [];
      } catch (e) {
        console.error(`Error processing chunk ${index}:`, e);
        return [];
      }
    });

    // Execute all chunks in parallel
    const results = await Promise.all(chunkPromises);
    const allLeads = results.flat();

    return NextResponse.json({ leads: allLeads });
  } catch (error: any) {
    console.error("Import Parse Error:", error);
    return NextResponse.json({ error: error.message || "Failed to parse import" }, { status: 500 });
  }
}
