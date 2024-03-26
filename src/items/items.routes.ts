import Router from 'koa-router'
import { ITEMS_PATH } from '../constants/routes.constants'
import ItemsController from './items.controller'
import { validateItem, validateUpdateItem } from './items.validators'

const setupItemsRoutes = (router: Router) => {
  router.get(ITEMS_PATH, ItemsController.get)
  router.get(`${ITEMS_PATH}/:id`, ItemsController.getItem)
  router.post(ITEMS_PATH, validateItem, ItemsController.create)
  router.put(`${ITEMS_PATH}/:id`, validateUpdateItem, ItemsController.update)
  router.delete(`${ITEMS_PATH}/:id`, ItemsController.delete)
  console.log('create item route')
}

export default setupItemsRoutes
