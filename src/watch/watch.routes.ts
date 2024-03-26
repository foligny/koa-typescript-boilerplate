import Router from 'koa-router'
import { Routes } from '../constants/routes.constants'
import WatchFoldersController from './watch.controller'
import { validateItem, validateUpdate } from './watch.validation'

const setupWatchRoutes = (router: Router) => {
  router.get(Routes.watch, WatchFoldersController.getAll)
  router.get(`${Routes.watch}/:id`, WatchFoldersController.getItem)
  router.post(Routes.watch, validateItem, WatchFoldersController.post)
  router.put(`${Routes.watch}/:id`, validateUpdate, WatchFoldersController.put)
  router.delete(`${Routes.watch}/:id`, WatchFoldersController.delete)
  console.log('created stores routes')
}

export default setupWatchRoutes
