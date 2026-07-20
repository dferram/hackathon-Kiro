import { Router } from "express";
import { OpenAI } from "openai";
import Anthropic from "@anthropic-ai/sdk";
import prisma from "../../db.js";

const router = Router();

// POST run AI code review
router.post("/review", async (req, res) => {
  const { projectId, pullRequestNumber, codeFiles, provider } = req.body;

  if (!projectId) {
    return res.status(400).json({ error: "projectId is required" });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) },
    });

    if (!project) return res.status(404).json({ error: "Project not found" });

    const codeToReview = (codeFiles || [])
      .map((f: any) => `File: ${f.filename}\n\`\`\`\n${f.content}\n\`\`\``)
      .join("\n\n");

    const prompt = `You are a strict, senior code reviewer. Review the following code for:
1. Logic and bug detection
2. Performance/optimization opportunities
3. Readability and clean code practices

Return your response as a valid JSON array of objects, each object containing:
- file: the filename
- line: line number or approximate range
- severity: "error" | "warning" | "info"
- message: clear review comments
- suggestion: proposed refactoring / replacement snippet

Do not return any markdown wraps outside of the JSON block, output ONLY the JSON array. Example:
[
  {
    "file": "main.js",
    "line": 42,
    "severity": "warning",
    "message": "Use const instead of var.",
    "suggestion": "const result = calculate();"
  }
]`;

    let reviewFindings = "";

    if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const msg = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1500,
        messages: [
          { role: "user", content: `${prompt}\n\nCode to review:\n${codeToReview}` },
        ],
      });
      const textBlock = msg.content[0];
      if (textBlock && textBlock.type === "text") {
        reviewFindings = textBlock.text;
      }
    } else if (provider === "openai" && process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: `${prompt}\n\nCode to review:\n${codeToReview}` }],
        max_tokens: 1500,
      });
      reviewFindings = completion.choices[0]?.message?.content || "";
    } else {
      const mockResult = (codeFiles || []).map((file: any) => ({
        file: file.filename,
        line: 5,
        severity: "warning",
        message: "Consider using structured error handling or try/catch blocks to prevent crashes.",
        suggestion: "try {\n  // your operation\n} catch (error) {\n  console.error(error);\n}",
      }));

      if (mockResult.length === 0) {
        mockResult.push({
          file: "index.js",
          line: 1,
          severity: "info",
          message: "No source files were submitted. Add files to analyze potential improvements.",
          suggestion: "// Example: const api = new ApiService();",
        });
      }
      reviewFindings = JSON.stringify(mockResult);
    }

    let parsedFindings;
    try {
      const cleanJson = reviewFindings.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedFindings = JSON.parse(cleanJson);
    } catch {
      parsedFindings = [
        {
          file: "System",
          line: 0,
          severity: "info",
          message: "AI returned review comments in a non-JSON format.",
          rawText: reviewFindings,
        },
      ];
    }

    const reviewResult = await prisma.codeReviewResult.create({
      data: {
        projectId: project.id,
        pullRequestNumber: pullRequestNumber ? parseInt(pullRequestNumber) : null,
        findings: JSON.stringify(parsedFindings),
        status: "COMPLETED",
      },
    });

    res.json(reviewResult);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET all reviews for a project
router.get("/reviews/:projectId", async (req, res) => {
  try {
    const reviews = await prisma.codeReviewResult.findMany({
      where: { projectId: parseInt(req.params.projectId) },
      orderBy: { createdAt: "desc" },
    });
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
