import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { prisma } from '../prisma'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

export async function saveUploadedFile(file: File) {
  await mkdir(UPLOAD_DIR, { recursive: true })

  const id = randomUUID()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filename = `${id}-${safeName}`
  const diskPath = path.join(UPLOAD_DIR, filename)
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(diskPath, buffer)

  const url = `/uploads/${filename}`
  const stored = await prisma.storedFile.create({
    data: {
      id,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      url,
    },
  })

  return stored
}
