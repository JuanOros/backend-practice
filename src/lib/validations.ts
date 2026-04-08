// src/lib/validations.ts
//
// Zod schemas for validating API request bodies.
//
// WHY ZOD?
// TypeScript types only exist at compile time — they disappear at runtime.
// When data arrives from an HTTP request, TypeScript has NO idea if it
// matches your types. Zod validates the actual runtime values and returns
// fully typed results.
//
// Pattern:
//   1. Define schema with z.object({...})
//   2. Infer the TypeScript type from the schema with z.infer<typeof schema>
//   3. In your API route: const result = schema.safeParse(body)
//   4. if (!result.success) return 400 with result.error.flatten().fieldErrors
//   5. Use result.data — it's now fully typed and validated

import { z } from 'zod'

// ─── Task Schemas ──────────────────────────────────────────────────────────

export const createTaskSchema = z.object({
  title: z
    .string({ error: 'Title is required' })
    .min(1, 'Title cannot be empty')
    .max(200, 'Title must be 200 characters or less')
    .trim(), // trim() removes leading/trailing whitespace before validation

  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .trim()
    .optional(),

  // cuid() validates that the string has the format of a Prisma CUID
  userId: z.string().cuid('Invalid user ID format').optional(),
})

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(1000).trim().nullable().optional(),
  // z.enum() restricts the value to one of the allowed strings
  status: z.enum(['PENDING', 'IN_PROGRESS', 'DONE']).optional(),
})

// ─── User Schemas ──────────────────────────────────────────────────────────

export const createUserSchema = z.object({
  name: z
    .string({ error: 'Name is required' })
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be 100 characters or less')
    .trim(),

  email: z
    .string({ error: 'Email is required' })
    .email('Must be a valid email address')
    .toLowerCase(), // normalize to lowercase before saving
})

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  email: z.string().email().toLowerCase().optional(),
})

// ─── Inferred TypeScript Types ─────────────────────────────────────────────
// These types are automatically derived from the schemas above.
// No need to manually keep types and schemas in sync — Zod does it for you.

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
