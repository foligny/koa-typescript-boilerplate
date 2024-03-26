import { Context } from 'koa'
import HttpStatus from 'http-status'
import { itemList } from '../items/items.mock'
import { JsonStorage } from '../utils/storage'
import { Item } from '../items/items.models'

const stores = new JsonStorage<Item>('data/inventory.json', {}, 'id')

const InventoryController = {
  getAll: async (ctx: Context) => {
    const data = await stores.readStorageFile()
    ctx.body = data
    console.log('get list', data)
    ctx.status = HttpStatus.OK
  },
  getItem: (ctx: Context) => {
    ctx.body = itemList[0]
    ctx.status = HttpStatus.OK
  },
  post: (ctx: Context) => {
    ctx.body = ctx.request.body
    ctx.status = HttpStatus.CREATED
  },
  put: (ctx: Context) => {
    ctx.body = ctx.request.body
    ctx.status = HttpStatus.OK
  },
  delete: (ctx: Context) => {
    ctx.status = HttpStatus.NO_CONTENT
  }
}

export default InventoryController
