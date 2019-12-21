'use strict'
const fs = require('fs')
const path = require('path')
const proc = require('child_process')

const http = require('http')
const url = require('url')

const livereload = require('livereload')
const chokidar = require('chokidar')

if(!fs.existsSync('./config.json')) {
  console.log(`Please create a "config.json" to configure the server.
(You can use the existing config-sample.json as a reference)`)
  process.exit()
}
const cfg = require('./config.json')

const DEFAULT_PORT = 6543
const PORT = process.env.PORT || cfg.port || DEFAULT_PORT
const INDEX = cfg.index || "index.html"

const mimeType = {
  '.ico': 'image/x-icon',
  '.html': 'text/html',
  '.htm': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.eot': 'appliaction/vnd.ms-fontobject',
  '.ttf': 'aplication/font-sfnt'
}

const ROOT = process.argv[2] || cfg.site || "."

http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`)

  let parsedUrl = url.parse(req.url)

  let reqPath = parsedUrl.pathname
  let safePath = path.resolve('/', reqPath)
  let loc = path.join(__dirname, ROOT, safePath)

  fs.lstat(loc, (err, stat) => {
    if(err) {
      if(err.code == 'ENOENT') {
        let msg = `${reqPath} not found`
        console.error(msg)
        res.statusCode = 404
        res.end(msg)
      } else {
        console.error(err)
        res.statusCode = 400
        res.end()
      }
    } else {
      if(stat.isDirectory()) {
        loc = path.join(loc, INDEX)
      }
      fs.readFile(loc, (err, data) => {
        if(err) {
          let msg = `${reqPath} not readable`
          console.error(msg)
          res.statusCode = 500
          res.end(msg)
        } else {
          let ext = path.parse(loc).ext
          let mime_type = mimeType[ext]
          if(mime_type) res.setHeader('Content-type', mime_type)
          if(isLive() && isHTML(ext)) {
            send_with_live_reloading_1(data, res)
          } else {
            res.end(data)
          }
        }
      })
    }
  })

}).listen(parseInt(PORT))

function isHTML(ext) { return ext == '.html' || ext == '.htm' }
function isLive() { return cfg.livereload || isRegen() }
function isRegen() { return cfg.regenerate && cfg.regenerate.watch }

function regenCmd() {
  if(cfg.regenerate.script) {
    return cfg.regenerate.script.split(' ')[0]
  }
  else return "node"
}
function regenArgs() {
  if(cfg.regenerate.script) {
    let r = cfg.regenerate.script.split(' ')
    r.shift()
    return r
  } else return ['.']
}
function regenWatch() {
  return path.join(__dirname, cfg.regenerate.watch)
}
function regenCwd() {
  let f = regenWatch()
  let stat = fs.lstatSync(f)
  if(stat.isFile()) return path.basename(f)
  else return f
}

function send_with_live_reloading_1(data, res) {
  let ndx = data.lastIndexOf('</body>')
  if(ndx == -1) res.end(data)
  else {
    res.write(data.slice(0, ndx))
    res.write(`<script>
  document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] +
  ':35729/livereload.js?snipver=1"></' + 'script>')
</script>`)
    res.write(data.slice(ndx))
    res.end()
  }
}

let server = livereload.createServer({
  delay: 250,
})
server.watch(path.join(__dirname, ROOT))

if(isRegen()) {
  chokidar.watch(regenWatch(), {
    ignored: [/(^|[\/\\])\../,/^node_modules/],
  }).on('all', doUpdate)
}

/*    outcome/
 * Wait a little bit to batch changes then launch the update process.
 * After it's done, check to see if there are more changes to be handled
 * and run again if there are.
 */
let numchanges = 0
let updateRunning = false
function doUpdate(event, path) {
  console.log(`Detected ${event} in ${path}..`)
  numchanges++
  if(updateRunning) return
  do_update_1()

  function do_update_1() {
    updateRunning = true
    setTimeout(() => {
      let curr_changes = numchanges
      console.log('Running update...')
      let proc_ = proc.spawn(regenCmd(), regenArgs(), {
        cwd: regenCwd(),
        stdio: 'inherit',
        windowsHide: true,
      })
      proc_.on('exit', (code) => {
        if(code) console.error('Update exited with error!')
        else console.log('Update done.')
        if(curr_changes != numchanges) do_update_1()
        updateRunning = false
      })
    }, 500)
  }
}


if(isRegen()) {
  console.log(`Serving ${ROOT} from port ${PORT} (with live-reloading)`)
  console.log(`Generated from ${cfg.regenerate.watch} using ${regenCmd()}`)
} else if(isLive()) {
  console.log(`Serving ${ROOT} from port ${PORT} (with live-reloading, regeneration: off)`)
} else {
  console.log(`Serving ${ROOT} from port ${PORT} (live-reloading:off, regeneration: off)`)
}
