# Quick And Dirty

A quick development server with live-reload and regeneration. Ideal for [html-in-js](http://theproductiveprogrammer.github.io/html-in-js/)

![icon](./quick-and-dirty.png)

This is a simple development server that can be used to have a live-preview of your site that regenerates automatically as you work.

## Usage

1. Download this package
2. Set up your configuration by creating a [config.json](./config-sample.json)
3. Start the server: `npm start`

Now the server will detect changes as you save, regenerate the site if needed, and automatically cause the browser to refresh the page.

## Features

You can use [Quick-And-Dirty](http://theproductiveprogrammer.github.io/quick-and-dirty/):

1. As a simple HTTP server (set `livereload` to `false`)
   - In this mode, it will act as a simple web server
2. As a `live-reloading` server (set `regenerate` to `false` or just delete it from the config)
   - In this mode, the server will monitor the `site` for changes and inject a script into every HTML page that causes it to refresh correctly when pages change.
3. As a `regenerating` and `live-reloading` sever
   - In this mode, the server will also watch the `regenerate` paths and call the `regenerate` script when it detects any changes

## Feedback

Report feedback/issues/etc in [Github](https://github.com/theproductiveprogrammer/quick-and-dirty/issues)