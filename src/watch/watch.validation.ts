import Joi from 'joi'

import { createJoiMiddleware } from '../middleware/joi'
import { MAX_ITEM_QUANTITY } from '../constants/items.constants'
import { NAME_REQUIRED_ERROR } from '../items/items.errors'

const schema = Joi.object({
  name: Joi.string().required().error(new Error(NAME_REQUIRED_ERROR)),
  location: Joi.string()
})

const updateSchema = Joi.object({
  id: Joi.string().required().error(new Error(NAME_REQUIRED_ERROR)),
  name: Joi.string().required().error(new Error(NAME_REQUIRED_ERROR)),
  location: Joi.string()
})

export const validateItem = createJoiMiddleware(schema)
export const validateUpdate = createJoiMiddleware(updateSchema)
