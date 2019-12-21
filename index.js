'use strict'
const fs = require('fs')
const path = require('path')

const http = require('http')
const url = require('url')

const livereload = require('livereload')

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
          if(cfg.livereload && isHTML(ext)) {
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

if(cfg.livereload) {
  console.log(`Serving ${ROOT} from port ${PORT} (with live-reloading)`)
} else {
  console.log(`Serving ${ROOT} from port ${PORT} (live-reloading: off)`)
}
