import Router from 'koa-router'
import { Routes } from '../constants/routes.constants'
import StoresController from './inventory-controller'
import { validateItem, validateUpdate } from './inventory.validators'

const setupStoresRoutes = (router: Router) => {
  router.get(Routes.stores, StoresController.getAll)
  router.get(`${Routes.stores}/:id`, StoresController.getItem)
  router.post(Routes.stores, validateItem, StoresController.post)
  router.put(`${Routes.stores}/:id`, validateUpdate, StoresController.put)
  router.delete(`${Routes.stores}/:id`, StoresController.delete)
  console.log('created stores routes')
}

export default setupStoresRoutes
