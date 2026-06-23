import express from 'express'
import cookieParser from 'cookie-parser'
import { randomUUID } from 'node:crypto'
import { env } from './env'
import { Authed, errorHandler } from './http'
import { platformRouter } from './routes/platform'
import { authRouter } from './routes/auth'
import { membersRouter } from './routes/members'
import { clientsRouter } from './routes/clients'
import { projectsRouter } from './routes/projects'

const app = express()
app.use(express.json())
app.use(cookieParser())
app.use((req, _res, next) => {
  ;(req as Authed).id = `req_${randomUUID()}`
  next()
})

app.get('/api/v1/health', (_req, res) => res.json({ ok: true }))

app.use('/api/v1/platform', platformRouter)
app.use('/api/v1/auth', authRouter)
app.use('/api/v1', membersRouter)
app.use('/api/v1', clientsRouter)
app.use('/api/v1', projectsRouter)

app.use(errorHandler)

app.listen(env.PORT, () => console.log(`API listening on http://localhost:${env.PORT}/api/v1`))
