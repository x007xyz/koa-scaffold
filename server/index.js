const path = require('path')

const Koa = require('koa')
const app = new Koa()

app.use(require('koa-body')({
  multipart: true,
  formidable: {
      maxFileSize: 200*1024*1024    // 设置上传文件大小最大限制，默认2M
  }
}))

require('koa-parameter')(app)

const static = require('koa-static')
app.use(static(path.resolve(__dirname, '../dist')))

const render = require('koa-art-template')
render(app, {
  root: path.join(__dirname, 'view'),
  extname: '.art',
  debug: process.env.NODE_ENV !== 'production'
})

require('./dbconnect')

const passport = require('koa-passport')
require('./auth')(passport)
app.use(passport.initialize())

app.use(require('./api'))
app.use(require('./routes'))

app.listen(3000)