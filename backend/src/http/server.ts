import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'
import fastify from 'fastify'
import { z } from 'zod'
import { env } from '../env'
import { cloudflareR2 } from '../lib/cloudflare'

const app = fastify()

const prisma = new PrismaClient()

app.get('/healthcheck', async () => ({ message: 'Server is health! 🚀' }))

app.post('/uploads', async (request, reply) => {
  const uploadBodySchema = z.object({
    name: z.string().min(1).max(100),
    contentType: z.string().regex(/\w+\/[-+.\w]+/),
  })

  const { name, contentType } = uploadBodySchema.parse(request.body)

  const fileKey = randomUUID().concat('-').concat(name)

  const signedUrl = await getSignedUrl(
    cloudflareR2,
    new PutObjectCommand({
      Bucket: env.CLOUDFLARE_BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
    }),
    { expiresIn: 600 }
  )

  const { id } = await prisma.file.create({
    data: {
      name,
      key: fileKey,
      contentType,
    }
  })

  return { signedUrl, fileId: id }
})

app.get('/uploads/:id', async (request, reply) => {
  const getFileParamsSchema = z.object({
    id: z.string().cuid()
  })

  const { id } = getFileParamsSchema.parse(request.params)

  const file = await prisma.file.findUniqueOrThrow({
    where: { id }
  })

  if (!file) {
    reply.status(404)
    return { message: 'File not found' }
  }

  const signedUrl = await getSignedUrl(
    cloudflareR2,
    new GetObjectCommand({
      Bucket: env.CLOUDFLARE_BUCKET_NAME,
      Key: file.key,
    }),
    { expiresIn: 600 }
  )

  return { signedUrl}
})


app.listen({
  port: 3333,
  host: '0.0.0.0'
}).then(() => console.log('Server is running on port 3000 🚀'))