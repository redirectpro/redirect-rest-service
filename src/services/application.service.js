import Promise from 'es6-promise'
import ErrorHandler from '../handlers/error.handler'
import LoggerHandler from '../handlers/logger.handler'
import DynDBService from './dyndb.service'
import StripeService from './stripe.service'
import ApplicationUserService from './application-user.service'
import ApplicationBillingService from './application-billing.service'
const logger = LoggerHandler
const path = 'application.service'

export default class ApplicationService {

  constructor () {
    this.stripeService = new StripeService()
    this.dyndbService = new DynDBService()
    this.user = new ApplicationUserService(this)
    this.billing = new ApplicationBillingService(this)
  }

  get (applicationId) {
    const _path = `${path} get`
    logger.info(`${_path} ${applicationId}`)

    return new Promise((resolve, reject) => {
      this.dyndbService.get('application', { id: applicationId }).then((data) => {
        logger.info(`${_path} result of this.dyndbService.get then`)

        if (data.Items[0]) {
          return resolve(data.Items[0])
        } else {
          return reject(ErrorHandler.typeError('ApplicationNotFound', 'Application does not exist.'))
        }
      }).catch((err) => {
        logger.warn(`${_path} result of this.dyndbService.get catch`, err.name)
        return reject(err)
      })
    })
  }

  create (parameters) {
    const _path = `${path} create`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      this.stripeService.create({
        userEmail: parameters.userEmail,
        planId: parameters.planId
      }).then((customer) => {
        logger.info(`${_path} result of stripeService.create then`)

        const item = {
          id: customer.id,
          users: [ parameters.userId ],
          billingEmail: parameters.userEmail,
          subscription: this.subscriptionResponseHandler(customer.subscriptions.data[0])
        }

        this.dyndbService.insert('application', item).then((item) => {
          logger.info(`${_path} result of this.dyndbService.insert then`)
          return resolve(item)
        }).catch((err) => {
          logger.warn(`${_path} result of this.dyndbService.insert catch`)
          return reject(err)
        })
      }).catch((err) => {
        logger.warn(`${_path} result of stripeService.create catch`, err.name)
        return reject(err)
      })
    })
  }

  delete (applicationId) {
    const _path = `${path} delete`
    logger.info(`${_path} ${applicationId}`)

    return new Promise((resolve, reject) => {
      let promiseDeleteStripe = this.stripeService.delete(applicationId)
      let promiseDeleteDynDB = this.dyndbService.delete('application', applicationId)

      Promise.all([promiseDeleteStripe, promiseDeleteDynDB]).then(() => {
        resolve()
      }).catch((err) => {
        if (err.message === `No such customer: ${applicationId}`) {
          resolve()
        } else {
          reject(err)
        }
      })
    })
  }

  removeUser (userId, deleteOrphanApplication = false) {
    const _path = `${path} removeUser`
    logger.info(`${_path} ${userId} ${deleteOrphanApplication}`)

    return new Promise((resolve, reject) => {
      this.getByUserId(userId).then((items) => {
        if (items.length === 0) return resolve()

        let promises = []

        for (let itemIndex in items) {
          let item = items[itemIndex]
          let users = item.users
          let indexes = []
          let lastIndex = -1

          while (users.indexOf(userId, (lastIndex + 1)) >= 0) {
            lastIndex = users.indexOf(userId, (lastIndex + 1))
            indexes.push(lastIndex)
          }

          if (users.length === indexes.length && deleteOrphanApplication === true) {
            let promise = this.delete(item.id)
            promises.push(promise)
          }

          let promise = this.dyndbService
            .listRemoveByIndex('application', item.id, 'users', indexes)
          promises.push(promise)
        }

        Promise.all(promises).then(() => {
          resolve()
        }).catch((err) => {
          reject(err)
        })

        return resolve()
      }).catch((err) => {
        if (err.name === 'NotFound') {
          return resolve()
        } else {
          return reject(err)
        }
      })
    })
  }

  getByUserId (userId) {
    const _path = `${path} getByUserId`
    logger.info(`${_path} ${userId}`)

    return new Promise((resolve, reject) => {
      this.dyndbService.getByUserId('application', { id: userId }).then((applicationInfo) => {
        logger.info(`${_path} result of this.dyndbService.getByUserId then`)

        if (applicationInfo.Count > 0) {
          return resolve(applicationInfo.Items)
        } else {
          return reject(ErrorHandler.typeError('NotFound', 'Applications do not exist.'))
        }
      }).catch((err) => {
        logger.warn(`${_path} result of getByUserId catch`, err.name)
        return reject(err)
      })
    })
  }

}