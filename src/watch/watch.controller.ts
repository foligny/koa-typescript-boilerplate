import { Context } from 'koa'
import HttpStatus from 'http-status'
import { itemList } from '../items/items.mock'
import { JsonStorage } from '../utils/storage'
import Watcher from 'watcher'
import { FileTracker } from '../utils/filetracker'

const watchFolders = new JsonStorage<any>('data/watchFolders.json', {}, 'path')
const watchFoldersContent = new JsonStorage<any>(
  'data/watchFoldersContent.json',
  {},
  'sha1sum'
) // existing file already seem & tracked
const fileTracker = new FileTracker(watchFoldersContent)

let watcher
// all this initialization goes on in the background and could take minutes and even hours and should not be awaited
watchFolders.readStorageFile(async (data: any) => {
  const keys = Object.keys(data)
  const todoCount = keys.length
  let doneCount = 0
  for (const dir of keys) {
    await fileTracker.readFolderReccursive(dir, null, async (err) => {
      console.log('finished scraping all files', fileTracker.total)
      doneCount++
      if (doneCount >= todoCount) {
        console.log('okt hashing')
        await fileTracker.hashFiles(() => {
          console.log('done hashing')
        })
      }
    })
    console.log('end one run of readFolder', doneCount)
    // await fileTracker.inspectFile(dir);
  }
  watcher = new Watcher(Object.keys(data))

  watcher.on('all', (event, targetPath, targetPathNext) => {
    //// console.log ( event ); // => could be any target event: 'add', 'addDir', 'change', 'rename', 'renameDir', 'unlink' or 'unlinkDir'
    // console.log ( targetPath ); // => the file system path where the event took place, this is always provided
    // console.log ( targetPathNext ); // => the file system path "targetPath" got renamed to, this is only provided on 'rename'/'renameDir' events
  })
})

const WatchFoldersController = {
  getAll: async (ctx: Context) => {
    const data = await watchFolders.readStorageFile()
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

export default WatchFoldersController
