// src/app/api/treino/route.ts
//
// GET  /api/treino  → returns all persisted workout data
// POST /api/treino  → upserts workout data (see upsert rules below)

import { prisma } from '@/lib/prisma'
import { treinoSchema } from '@/lib/validations'
import { ok, badRequest, serverError } from '@/lib/api-helpers'
import { NextResponse } from 'next/server'

const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:3000'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

// Preflight for CORS
export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

// GET /api/treino
export async function GET() {
  try {
    const [perfil, programa, corpo, treinos] = await Promise.all([
      prisma.perfil.findFirst(),
      prisma.programa.findUnique({ where: { id: 'singleton' } }),
      prisma.corpo.findMany({ orderBy: { data: 'desc' } }),
      prisma.treinoSessao.findMany({ orderBy: { data: 'desc' } }),
    ])

    const response = ok({
      perfil: perfil
        ? {
            nome: perfil.nome,
            sexo: perfil.sexo,
            altura_cm: perfil.altura_cm,
            idade: perfil.idade,
            limitacoes: perfil.limitacoes,
            suplementos: perfil.suplementos,
            meta_corrida_km: perfil.meta_corrida_km,
          }
        : null,
      programa: programa
        ? {
            fase_atual: programa.fase_atual,
            semana_atual: programa.semana_atual,
            inicio: programa.inicio,
          }
        : null,
      corpo: corpo.map((c) => ({
        data: c.data,
        peso_kg: c.peso_kg,
        gordura_pct: c.gordura_pct,
        massa_gorda_kg: c.massa_gorda_kg,
        musculo_esqueletico_kg: c.musculo_esqueletico_kg,
        agua_corporal_kg: c.agua_corporal_kg,
      })),
      treinos: treinos.map((t) => ({
        data: t.data,
        tipo: t.tipo,
        descricao: t.descricao,
        duracao_min: t.duracao_min,
        kcal: t.kcal,
        fc_media: t.fc_media,
        fc_maxima: t.fc_maxima,
        zona_predominante: t.zona_predominante,
        observacoes: t.observacoes,
      })),
    })

    corsHeaders() && Object.entries(corsHeaders()).forEach(([k, v]) => response.headers.set(k, v))
    return response
  } catch (error) {
    console.error('[GET /api/treino]', error)
    return serverError()
  }
}

// POST /api/treino
// Upsert rules:
//   perfil    — upsert by nome (overwrites)
//   programa  — always overwrites (singleton)
//   corpo[]   — ignore if date already exists (skipDuplicates)
//   treinos[] — ignore if (data + tipo) pair already exists (skipDuplicates)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = treinoSchema.safeParse(body)
    if (!result.success) {
      const res = badRequest('Validation failed', result.error.flatten().fieldErrors as Record<string, string[]>)
      Object.entries(corsHeaders()).forEach(([k, v]) => res.headers.set(k, v))
      return res
    }

    const { perfil, programa, corpo, treinos } = result.data

    await prisma.$transaction(async (tx) => {
      if (perfil) {
        await tx.perfil.upsert({
          where: { nome: perfil.nome },
          create: perfil,
          update: {
            sexo: perfil.sexo,
            altura_cm: perfil.altura_cm,
            idade: perfil.idade,
            limitacoes: perfil.limitacoes,
            suplementos: perfil.suplementos,
            meta_corrida_km: perfil.meta_corrida_km,
          },
        })
      }

      if (programa) {
        await tx.programa.upsert({
          where: { id: 'singleton' },
          create: { id: 'singleton', ...programa },
          update: programa,
        })
      }

      if (corpo && corpo.length > 0) {
        await tx.corpo.createMany({ data: corpo, skipDuplicates: true })
      }

      if (treinos && treinos.length > 0) {
        await tx.treinoSessao.createMany({ data: treinos, skipDuplicates: true })
      }
    })

    const res = ok({ ok: true })
    Object.entries(corsHeaders()).forEach(([k, v]) => res.headers.set(k, v))
    return res
  } catch (error) {
    console.error('[POST /api/treino]', error)
    return serverError()
  }
}
