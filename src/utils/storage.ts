import fs from 'fs'
import stream from 'stream'
import readline from 'readline'
import { createHash } from 'crypto'
import { getMediaChecksum } from './fileSync'

const sha256 = createHash('sha256').update('bacon').digest('base64')

interface Options {
  autoCreateId?: boolean
  useUuid?: boolean
}

export class JsonStorage<T extends Object> {
  public data: Record<keyof T, T>
  protected filename: string
  protected primaryKey: keyof T
  protected options: Options = { autoCreateId: true, useUuid: false }
  protected nextId: number

  constructor(
    filename: string,
    initialData: Record<keyof T, T>,
    primaryKey: keyof T,
    options?: Options
  ) {
    this.filename = filename
    this.primaryKey = primaryKey
    this.options = options || { autoCreateId: true, useUuid: false }
    this.data = initialData
    this.nextId = 1
  }

  async readStorageFile(callback?: any) {
    var inputStream = fs.createReadStream(this.filename, { encoding: 'utf-8' })

    var rl = readline.createInterface({
      input: inputStream
      //  output: outputstream
    })

    rl.on('line', (line) => {
      let entry = JSON.parse(line) as T
      if (entry != null) {
        if (this.options.autoCreateId && (entry as any).id >= this.nextId) {
          this.nextId = (entry as any).id + 1
        }
        console.log('add line', entry)
        const item = entry[this.primaryKey]
        this.data[item as keyof T] = entry
      }
    })

    inputStream.on('error', (err) => {
      console.error('Error reading json file', err)
      // File could have grown too big (like >1GB)
      if (callback) {
        callback?.(err)
      }
    })

    inputStream.on('end', () => {
      console.log('end')
      if (callback) {
        callback?.(this.data)
      }
    })

    console.log('going to await')
    for await (const line of rl) {
      // console.log('line', line)
    }
    console.log('after await', this.data)
    return this.data
  }

  /**
   * Append to storage
   *
   * @param {Object} entry
   */
  async append(entry: any) {
    if (entry.sha1sum == null) {
      getMediaChecksum(entry.filename, (sha1sum: string) => {
        entry.sha1sum = sha1sum
        return this.append(entry)
      })
      console.error('Error appending, file has no hash')
      return
    }
    this.data[entry.sha1sum as keyof T] = entry
    return fs.appendFile(
      this.filename,
      JSON.stringify(entry) + '\n',
      { encoding: 'utf8' },
      (err) => {
        if (err) {
          console.error('Error appending to watch folder history', err)
          return
        }
      }
    )
  }

  /**
   * Reset history (should be used only fatal error that prevents running)
   * Description: Truncate history.json to empty
   *
   */
  async resetHistory() {
    fs.open(this.filename, 'w' /*truncate*/, (err, fd) => {
      if (err) {
        console.error('Error resetting watch folder history', err)
        return
      }

      //TODO(flemieux): Instead of truncating maybe write our current self.history entries ? It depends on the reason of resetting, maybe self.history is too big?

      fs.close(fd)
      console.info('Success resetting history')
    })
  }
}
