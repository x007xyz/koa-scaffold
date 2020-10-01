const fs = require('fs')
const path = require('path')

const Router = require('koa-router')
const api = new Router({
  prefix: '/api'
})

api.post('/test', ctx => {
  // 使用koa-parameter对参数进行校验
  ctx.verifyParams({
    name: { type: "string", required: true }
  })
  // koa-body会将参数解析到ctx.request.body
  ctx.body = ctx.request.body
})

api.post('/upload', ctx => {
  // 文件在ctx.request.files中以对象的形式保存，如果多个文件的key相同，则value是一个File对象组成的数组，结构{ key: <File|File[]>value }
  Object.keys(ctx.request.files).forEach(key => {
    const file = ctx.request.files[key]
    const reader = fs.createReadStream(file.path)
    const upStream = fs.createWriteStream(path.join(__dirname, '../dist/' + file.name))

    reader.pipe(upStream)
  })
  ctx.body = 'upload success'
})

module.exports = api.routes()