import { env } from 'cloudflare:workers'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/media/$')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const storageKey = params._splat
        if (
          !storageKey ||
          !/^(photos|audio|capsules)\/[a-f0-9-]{36}\.[a-z0-9]{1,8}$/i.test(
            storageKey,
          )
        ) {
          return new Response('Not found', { status: 404 })
        }

        const metadata = await env.DB.prepare(
          `SELECT storage_key FROM photos WHERE storage_key = ?
           UNION ALL
           SELECT storage_key FROM audio_records WHERE storage_key = ?
           UNION ALL
           SELECT storage_key FROM time_capsules
            WHERE storage_key = ? AND date(reveal_at) <= date('now')
           LIMIT 1`,
        )
          .bind(storageKey, storageKey, storageKey)
          .first()
        if (!metadata) return new Response('Not found', { status: 404 })

        const object = await env.PHOTOS.get(storageKey)
        if (!object) return new Response('Not found', { status: 404 })

        const headers = new Headers()
        object.writeHttpMetadata(headers)
        headers.set('etag', object.httpEtag)
        headers.set('cache-control', 'private, max-age=86400')
        headers.set('x-content-type-options', 'nosniff')
        return new Response(object.body, { headers })
      },
    },
  },
})
