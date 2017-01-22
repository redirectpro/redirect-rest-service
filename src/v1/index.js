import { Router } from 'express'
import auth from './auth'

export default ({ config, db }) => {
  let v1 = Router()

  // mount the auth resource
  v1.use('/auth', auth({ config, db }))

  return v1
}
