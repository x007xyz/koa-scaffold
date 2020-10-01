const Koa = require('koa')
const app = new Koa()

app.use(require('koa-body')({
  multipart: true,
  formidable: {
      maxFileSize: 200*1024*1024    // 设置上传文件大小最大限制，默认2M
  }
}))

require('koa-parameter')(app)

app.use(require('./api'))

app.listen(3000)