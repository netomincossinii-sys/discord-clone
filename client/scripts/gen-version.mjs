import { writeFileSync, mkdirSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

const version = `${Date.now()}-${randomUUID().slice(0, 8)}`
mkdirSync('public', { recursive: true })
writeFileSync('public/version.json', JSON.stringify({ version }))
console.log('Generated public/version.json:', version)
