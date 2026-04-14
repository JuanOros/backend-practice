
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

// ─── Treino Schemas ────────────────────────────────────────────────────────

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')

export const treinoSchema = z.object({
  perfil: z.object({
    nome: z.string().min(1),
    sexo: z.enum(['M', 'F']),
    altura_cm: z.number().int().positive(),
    idade: z.number().int().positive(),
    limitacoes: z.array(z.string()).default([]),
    suplementos: z.array(z.string()).default([]),
    meta_corrida_km: z.number().positive(),
  }).optional(),

  programa: z.object({
    fase_atual: z.number().int().positive(),
    semana_atual: z.number().int().positive(),
    inicio: dateString,
  }).optional(),

  corpo: z.array(z.object({
    data: dateString,
    peso_kg: z.number().positive(),
    gordura_pct: z.number().min(0).max(100),
    massa_gorda_kg: z.number().min(0),
    musculo_esqueletico_kg: z.number().min(0),
    agua_corporal_kg: z.number().min(0),
  })).optional(),

  treinos: z.array(z.object({
    data: dateString,
    tipo: z.enum(['musculacao_A', 'musculacao_B', 'musculacao_C', 'corrida_leve', 'corrida_longa']),
    descricao: z.string(),
    duracao_min: z.number().int().min(0),
    kcal: z.number().min(0),
    fc_media: z.number().min(0),
    fc_maxima: z.number().min(0),
    zona_predominante: z.number().int().min(1).max(5),
    observacoes: z.string(),
  })).optional(),
})

export type TreinoInput = z.infer<typeof treinoSchema>

// ─── Inferred TypeScript Types ─────────────────────────────────────────────
// These types are automatically derived from the schemas above.
// No need to manually keep types and schemas in sync — Zod does it for you.

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
