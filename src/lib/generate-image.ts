import { createServerFn } from '@tanstack/react-start'

export type GenerateImageInput = {
  prompt: string
  steps?: number
}

export type GenerateImageResult = {
  imageDataUrl: string
}

function getImageGenConfig(): { url: string; apiKey: string } {
  const url = process.env.IMAGE_GEN_URL?.trim()
  const apiKey =
    process.env.IMAGE_GEN_API_KEY?.trim() || process.env.API_KEY?.trim()

  if (!url || !apiKey) {
    throw new Error(
      'Generování není nakonfigurované. Nastavte IMAGE_GEN_URL a IMAGE_GEN_API_KEY v .env.',
    )
  }

  return { url, apiKey }
}

function normalizeInput(data: GenerateImageInput): {
  prompt: string
  steps: number
} {
  const prompt = typeof data.prompt === 'string' ? data.prompt.trim() : ''
  if (!prompt) {
    throw new Error('Prompt nesmí být prázdný.')
  }
  if (prompt.length > 500) {
    throw new Error('Prompt může mít maximálně 500 znaků.')
  }

  let steps = data.steps ?? 4
  if (!Number.isFinite(steps)) steps = 4
  steps = Math.min(8, Math.max(1, Math.round(steps)))

  return { prompt, steps }
}

async function readWorkerError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as {
      error?: string
      details?: string
    }
    if (payload.error) return payload.error
  } catch {
    // ignore JSON parse errors
  }
  return `Worker vrátil chybu (${response.status}).`
}

export const generateImage = createServerFn({ method: 'POST' })
  .validator((data: GenerateImageInput) => data)
  .handler(async ({ data }): Promise<GenerateImageResult> => {
    const { prompt, steps } = normalizeInput(data)
    const { url, apiKey } = getImageGenConfig()

    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, steps }),
        signal: AbortSignal.timeout(60_000),
      })
    } catch (cause) {
      if (cause instanceof Error && cause.name === 'TimeoutError') {
        throw new Error('Generování vypršelo (timeout 60s). Zkuste to znovu.')
      }
      throw new Error(
        cause instanceof Error
          ? 'Nepodařilo se spojit s image workerem.'
          : 'Nepodařilo se spojit s image workerem.',
      )
    }

    if (!response.ok) {
      throw new Error(await readWorkerError(response))
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.byteLength === 0) {
      throw new Error('Worker nevrátil žádný obrázek.')
    }

    const contentType =
      response.headers.get('content-type')?.split(';')[0]?.trim() ||
      'image/jpeg'

    return {
      imageDataUrl: `data:${contentType};base64,${buffer.toString('base64')}`,
    }
  })
