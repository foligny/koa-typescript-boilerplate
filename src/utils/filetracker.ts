import fs from 'fs'
import { createHash } from 'crypto'
import { fsStat, getMediaChecksum, getMediaChecksumA } from './fileSync'
import { JsonStorage } from './storage'
import path from 'path'

const sha256 = createHash('sha256').update('bacon').digest('base64')

export interface FileEntry {
  filename: string
  shasum?: string
  parent: FileEntry | null | undefined
  children?: FileEntry[]
  lastChecked?: Date
  isDir?: boolean
  mtime?: Date
  ctime?: Date
}

interface Options {
  autoCreateId?: boolean
  useUuid?: boolean
}

export class FileTracker {
  protected jsonStorage: JsonStorage<Record<string, FileEntry>>
  protected options: Options = {
    useUuid: true
  }
  protected data: Record<string, FileEntry>
  protected workpad: FileEntry[] // to hash
  public total: number // total files
  public processed: number // processed <= total
  protected nextId: number
  protected simultaneous: number

  constructor(
    jsonStorage: JsonStorage<Record<string, FileEntry>>,
    options?: Options
  ) {
    this.jsonStorage = jsonStorage
    this.options = { ...this.options, ...options }
    this.options = options || { autoCreateId: true, useUuid: false }
    this.data = {}
    this.workpad = []
    this.total = 0
    this.processed = 0
    this.nextId = 1
    this.simultaneous = 0
  }

  // init routine
  async readFolderReccursive(
    directory: string,
    parent: FileEntry | null,
    callback?: (err?: any) => void
  ) {
    // return new Promise(async (resolve) => {
    let dirEntry: FileEntry
    let topLevel = false
    if (parent == null) {
      topLevel = true
      if (Object.hasOwnProperty.call(this.data, directory)) {
        dirEntry = this.data[directory]
      } else {
        dirEntry = {
          isDir: true,
          filename: directory,
          parent: null
        }
        this.data[directory] = dirEntry // add one root level
      }
      parent = dirEntry
    }

    let files: string[]
    try {
      files = await fs.promises.readdir(directory)
    } catch (err) {
      console.error(err)
      files = []
    }
    // fs.readdir(directory, async (err, files) => {
    let shasum: string
    let entry: FileEntry

    for (const file of files) {
      const fullpath = path.join(directory, file)
      console.log('loop file', fullpath)
      //if (Object.hasOwnProperty.call(this.jsonStorage.data, file)) {
      if (Object.hasOwnProperty.call(this.data, fullpath)) {
        // already known
        console.log('already known', fullpath)
        const entry2 = this.data[fullpath]
        entry = entry2
        if (entry2.shasum) {
          shasum = entry2.shasum
        }
      } else {
        // NEW
        const fstatRet = await fsStat(fullpath)
        if (fstatRet.err || fstatRet.stats == null) {
          console.error(
            'Failed to fetch stats for file',
            fullpath,
            fstatRet.err
          )
        } else {
          const fstat = fstatRet.stats
          entry = {
            filename: fullpath,
            mtime: fstat.mtime,
            ctime: fstat.ctime,
            parent: parent
          }

          if (fstat.isDirectory()) {
            entry.isDir = true
            this.data[fullpath] = entry // for dir use filename as checksum
            await this.readFolderReccursive(fullpath, entry)
          } else {
            this.total++
            this.simultaneous++
            this.workpad.push(entry)
            //console.log('going to getMediaChecksumA', this.simultaneous)
            //const ret = await getMediaChecksumA(fullpath);
            // console.log('getMediaChecksumA', this.simultaneous)
            this.simultaneous--
            // shasum = ret.checksum; // FIXME check err
          }
        }
      }
      console.log('fullpath', fullpath, shasum)
      this.data[fullpath] = entry
    } // end file forEach

    if (topLevel) {
      // we are root and finished
      console.log('finished')
      callback?.()
    }
  }

  // init routine
  async hashFiles(callback?: (err?: any) => void) {
    for (const entry of this.workpad) {
      console.log('going to hash', entry.filename)
      const ret = await getMediaChecksumA(entry.filename)
      if (!ret.err) {
        entry.shasum = ret.checksum
        console.log(' hashed', entry.filename, ret.checksum)
        // append to jsonStorage
      }
    }
    callback?.()
  }

  /**
   * Append to storage
   *
   * @param {Object} entry
   */
  //async inspectFile(entry:FileEntry) {
  async inspectFile(filename: string) {
    let shasum: string

    try {
      shasum = await getMediaChecksum(filename, (sha1sum: string) => {
        sha1sum = sha1sum
      })
    } catch (ex) {
      console.error('Error appending, file has no hash')
      return
    }

    let entry: FileEntry
    if (shasum in this.data) {
      entry = this.data[shasum]
    } else {
      entry = {
        filename: filename,
        shasum: shasum
      }
      this.data[shasum] = entry
    }

    return fs.appendFile(
      filename,
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
