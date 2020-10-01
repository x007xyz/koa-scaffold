# Koa-基础框架构建
> Koa 是一个新的 web 框架，由 Express 幕后的原班人马打造， 致力于成为 web 应用和 API 开发领域中的一个更小、更富有表现力、更健壮的基石。

Koa与Express风格类似，不同在于默认异步解决方案和采用洋葱圈模型的中间件。

Koa没有绑定任何中间件，简单的同时也缺失了很多Web程序基础的功能，现在我们使用Koa来实现一般Web程序中基础的功能。

## 实现路由功能

实现路由功能我们使用到三个中间件，分别是`koa-router`、`koa-body`、`koa-parameter`：
1. 其中`koa-router`来实现最基础的路由功能，将不同的url分发到相应的处理函数中；
2. `koa-body`对post请求的参数进行处理，将处理结果解析到`ctx.request.body`中，`koa-body`也能够处理上传文件，文件会被解析到`ctx.request.files`中；
3. `koa-parameter`对传参进行校验，get请求会对`query`进行校验，post请求则对`body`进行校验，校验方法基于[parameter](https://github.com/node-modules/parameter)。

在`server/index.js`中引用中间件：
```javascript
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
```
在`server/api.js`中分发请求进行相应的处理：
```javascript
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
```
执行命令`node ./server/index.js`，运行程序，使用postman访问路由，访问`/api/test`时，如果没有参数name，状态码为422，提示Validation Failed，而我们带上参数name，返回结果为我们请求的参数；使用postman模拟文件上传，调用`/api/upload`接口，上传成功显示upload success，我们项目中的dist文件夹也多出了上传的文件（dist文件夹需要先创建，不然程序会报错）。

为了方便我们调试程序，我们使用`nodemon`启动程序，首先运行`yarn run nodemon --dev`，然后在`package.json`中添加命令"dev": "nodemon ./server/index.js"，之后我们启动程序只需要运行`yarn run dev`即可，如果项目进行了修改，程序自动会自动重新运行。
