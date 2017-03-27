import express from 'express'
import LoggerHandler from '../handlers/logger.handler'
import ErrorHandler from '../handlers/error.handler'
import ApplicationService from '../services/application.service'

export default () => {
  const router = express.Router()
  const logger = LoggerHandler
  const applicationService = new ApplicationService()

  router.get('/:applicationId/profile', (req, res) => {
    const path = req.originalUrl
    const applicationId = req.params.applicationId
    const responseHandler = (res, application) => {
      res.status(200).send({
        id: application.id,
        billingEmail: application.billingEmail,
        card: application.card,
        plan: application.plan
      })
    }

    applicationService.get(applicationId).then((application) => {
      logger.info(`${path} result of applicationService.get then`)
      return responseHandler(res, application)
    }).catch((err) => {
      logger.warn(`${path} result of applicationService.get catch`)
      return ErrorHandler.responseError(err, req, res)
    })
  })

  router.put('/:applicationId/creditCard/:token', (req, res) => {
    const path = req.originalUrl
    const applicationId = req.params.applicationId
    const token = req.params.token
    const responseHandler = (res, card) => {
      res.status(200).send({
        last4: card.last4,
        brand: card.brand,
        exp_month: card.exp_month,
        exp_year: card.exp_year
      })
    }

    applicationService.updateCreditCard({
      applicationId: applicationId,
      token: token
    }).then((card) => {
      logger.info(`${path} result of applicationService.setCreditCard then`)
      return responseHandler(res, card)
    }).catch((err) => {
      logger.warn(`${path} result of applicationService.setCreditCard catch`)
      return ErrorHandler.responseError(err, req, res)
    })
  })

  router.put('/:applicationId/plan/:planId', (req, res) => {
    const path = req.originalUrl
    const applicationId = req.params.applicationId
    const planId = req.params.planId
    const responseHandler = (res, subscription) => {
      res.status(200).send({
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        trial_start: subscription.trial_start,
        trial_end: subscription.trial_end,
        plan: {
          id: subscription.plan.id,
          interval: subscription.plan.interval,
          upcoming: subscription.plan.upcoming
        }
      })
    }

    applicationService.get(applicationId).then((application) => {
      logger.info(`${path} result of applicationService.get then`)
      let error

      if (!application.card || (application.card && !application.card.last4)) {
        error = {
          name: 'CreditCardNotFound',
          message: 'Please add a card to your account before choosing a plan.'
        }
      }

      console.log('eita preula')
      console.log(application.subscription.plan.id)
      console.log(planId)
      if (application.subscription.plan && application.subscription.plan.id &&
        application.subscription.plan.id === planId) {
        error = {
          name: 'SamePlan',
          message: 'The selected plan is the same as the current plan.'
        }
      }

      if (error) {
        return ErrorHandler.responseError(error, req, res)
      }

      applicationService.updateSubscription({
        applicationId: applicationId,
        planId: planId
      }).then((subscription) => {
        logger.info(`${path} result of applicationService.updateSubscription then`)
        return responseHandler(res, subscription)
      }).catch((err) => {
        logger.warn(`${path} result of applicationService.updateSubscription catch`, err.name)
        return ErrorHandler.responseError(err, req, res)
      })
    }).catch((err) => {
      logger.warn(`${path} result of applicationService.get catch`, err.name)
      return ErrorHandler.responseError(err, req, res)
    })
  })

  router.get('/:applicationId/plan/:planId/upcomingCost', (req, res) => {
    const path = req.originalUrl
    const applicationId = req.params.applicationId
    const planId = req.params.planId
    const responseHandler = (res, cost) => {
      res.status(200).send({
        cost: cost
      })
    }

    applicationService.upcomingSubscriptionCost({
      applicationId: applicationId,
      planId: planId
    }).then((cost) => {
      logger.info(`${path} result of this.applicationService.upcomingPlanCost then`)
      return responseHandler(res, cost)
    }).catch((err) => {
      logger.warn(`${path} result of this.applicationService.upcomingPlanCost catch`, err.name)
      return ErrorHandler.responseError(err, req, res)
    })
  })

  return router
}
