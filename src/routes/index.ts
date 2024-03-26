import Router from 'koa-router'
import createItemsRoutes from '../items/items.routes'
import createStoresRoutes from '../inventory/inventory-routes'
import setupWatchRoutes from '../watch/watch.routes'

const initRoutes = (router: Router) => {
  createItemsRoutes(router)
  createStoresRoutes(router)
  setupWatchRoutes(router)
}

export default initRoutes
