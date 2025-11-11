import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function extractAPIDetailsWithAI(file: Buffer, filename: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

    const base64Data = file.toString("base64")
    const mimeType = getMimeType(filename)

    const prompt = `Analyze this API documentation file and extract the following information in JSON format:
    {
      "name": "API name",
      "description": "Brief description",
      "baseUrl": "Base URL",
      "authentication": "api_key | oauth | jwt | basic",
      "endpoints": [
        {
          "path": "/endpoint",
          "method": "GET|POST|PUT|DELETE|PATCH",
          "description": "What it does",
          "requiresAuth": true/false,
          "parameters": [{"name": "param", "type": "string", "required": true}]
        }
      ],
      "rateLimit": {"requestsPerMinute": 60, "requestsPerDay": 1000}
    }
    
    Extract all relevant information from the documentation provided.`

    const response = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType as string,
        },
      },
      { text: prompt },
    ])

    const textContent = response.content.parts[0]
    if (textContent.type !== "text") throw new Error("Invalid response type")

    // Parse JSON from response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON found in response")

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error("[v0] Gemini API error:", error)
    throw error
  }
}

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    txt: "text/plain",
    json: "application/json",
    yaml: "application/yaml",
    yml: "application/yaml",
  }
  return mimeTypes[ext || ""] || "application/octet-stream"
}
