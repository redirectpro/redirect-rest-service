import express from 'express'
import http from 'http'
import cors from 'cors'
import bodyParser from 'body-parser'
import initializeDb from './db'
import middleware from './middleware'
import v1 from './v1'
import config from './config.js'
import {version, commit} from '../package.json'

const app = express()
app.server = http.createServer(app)

// 3rd party middleware
app.use(cors({
  exposedHeaders: config.corsHeaders
}))

app.use(bodyParser.json({
  limit: config.bodyLimit
}))

// connect to db
initializeDb(db => {
  // internal middleware
  app.use(middleware({config, db}))

  // version/commit
  app.get('/', (req, res) => {
    res.json({
      'version': version,
      'commit': commit
    })
  })

  // api v1 router
  app.use('/v1', v1({config, db}))

  app.server.listen(config.port)

  console.log(`Started on port ${app.server.address().port}`)
})

export default app
