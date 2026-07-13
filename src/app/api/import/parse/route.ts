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
    } else if (source === "excel" || source === "word") {
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
      }
    } else {
      return NextResponse.json({ error: "Invalid source" }, { status: 400 });
    }

    if (!textToParse || textToParse.trim().length === 0) {
      return NextResponse.json({ error: "No text to parse" }, { status: 400 });
    }

    // Initialize Groq
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY is not set" }, { status: 500 });
    }
    const groq = new Groq({ apiKey });

    const prompt = `
    You are an expert data extraction assistant. I will provide you with raw text that contains business leads (which might be from an email, a pasted list, an Excel CSV dump, or a Word document).
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
      "category": "String (required, guess the business category, e.g. 'Software', 'Real Estate', 'Retail')"
    }

    Raw text to parse:
    """
    ${textToParse}
    """
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-70b-8192", // We use 70b for better schema adherence and extraction quality
      response_format: { type: "json_object" },
    });

    const responseText = chatCompletion.choices[0]?.message?.content || "{}";
    const parsedJson = JSON.parse(responseText);
    
    // Ensure we always return an array
    const leadsArray = parsedJson.leads || parsedJson.data || Object.values(parsedJson)[0] || [];

    return NextResponse.json({ leads: Array.isArray(leadsArray) ? leadsArray : [] });
  } catch (error: any) {
    console.error("Import Parse Error:", error);
    return NextResponse.json({ error: error.message || "Failed to parse import" }, { status: 500 });
  }
}
