import { z } from "zod";

const sourceRefinement = (
  value: { chapterId?: string; uploadId?: string },
  ctx: z.RefinementCtx,
) => {
  if (!value.chapterId && !value.uploadId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Provide chapterId or uploadId.",
      path: ["chapterId"],
    });
  }
};

export const sourceSchema = z
  .object({
    chapterId: z.string().min(1).optional(),
    uploadId: z.string().min(1).optional(),
  })
  .superRefine(sourceRefinement);

export const chatRequestSchema = z.object({
  chapterId: z.string().min(1).optional(),
  uploadId: z.string().min(1).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "ai"]),
        content: z.string().trim().min(1).max(4000),
      }),
    )
    .max(20)
    .optional(),
  question: z
    .string()
    .trim()
    .min(2, "Question is too short.")
    .max(4000, "Question is too long."),
});

export const quizGenerateSchema = sourceSchema.extend({
  count: z.number().int().min(1).max(40).default(10),
});

export const flashcardsGenerateSchema = sourceSchema.extend({
  count: z.number().int().min(1).max(30).default(10),
});

export const uploadCreateTextSchema = z.object({
  text: z
    .string()
    .trim()
    .min(80, "Paste at least a paragraph (80+ characters)."),
  title: z.string().trim().max(120).optional().default(""),
});

export const quizSubmitSchema = z.object({
  answers: z.record(z.string(), z.string()),
});

export const ttsRequestSchema = z.object({
  text: z.string().trim().min(1).max(5000),
  language: z.enum(["en", "am", "om", "ti"]).default("en"),
});

export const teacherExamGenerateSchema = z.object({
  chapterId: z.string().min(1, "Chapter is required."),
  title: z.string().trim().min(4).max(140),
  count: z.number().int().min(3).max(40),
  timeLimitSeconds: z.number().int().min(120).max(7200),
});
