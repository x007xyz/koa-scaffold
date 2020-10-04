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

## 页面与资源

我们使用`koa-static`来实现静态资源的访问；生成页面一般会使用`koa-views`+相应的模板引擎的方式来实现，但是我准备使用`atr-tempate`来生成页面，根据官网的说明我们使用`koa-art-template`即可：
```javascript
const static = require('koa-static')
app.use(static(path.resolve(__dirname, '../dist')))

const render = require('koa-art-template')
render(app, {
  root: path.join(__dirname, 'view'),
  extname: '.art',
  debug: process.env.NODE_ENV !== 'production'
})
```
新建页面和样式文件，并且添加路由：
```html
<!-- server/view/index.art -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
</head>
<body>
  <div id="app">
    Hello World
  </div>
  <link rel="stylesheet" href="style.css">
</body>
</html>
```
```css
/* dist/style.css */
#app {
  color: red;
  font-size: 24px;
}
```
```javascript
// server/routes.js
const Router = require('koa-router')
const page = new Router()

page.get('/index',async ctx => {
  await ctx.render('index', { title: 'Hello' })
})

module.exports = page.routes()
```
## 连接数据库

数据库用于持久化保存数据，服务端的开发往往离不开数据库的使用。MongoDB 是一个基于分布式文件存储的开源数据库系统。在`node.js`中我们可以通过`mongoose`操作MongoDB数据库。

首先我们参考[菜鸟教程](https://www.runoob.com/mongodb/mongodb-tutorial.html)安装好MongoDB数据库，然后为项目添加`mongoose`。

在项目中操作数据库，第一步先连接数据库，新建dbconnect.js文件：
```javascript
const mongoose = require('mongoose')
const db = require('../config/db')
mongoose.connect(db.dbname, {useNewUrlParser: true, useUnifiedTopology: true}, err => {
    if (err) {
        log.fatal({msg: '[Mongoose] database connect failed!', err})
    } else {
        console.log('[Mongoose] database connect success!')
    }
})
module.exports = mongoose
```
`Mongoose`中所有东西都是从`Schema`，`Schema`类似于MySQL中的数据结构，`Schema`约束了MongoDB中每个集合的字段结构，限制程序随意修改数据库；`Model`是根据`Schema`定义的结构编译生成的高级构造函数，`Model`的实例被称为`Document`，`Model`负责从底层MongoDB数据库中创建和读取文档；关于`Mongoose`的其他概念，还有`Schema`、`Model`、`Document`三者相关的接口可以查看[Mongoose官方文档](https://mongoosejs.com/docs/models.html)。

在项目中新建`model/User.js`：
```javascript
const { Schema, model } = require('mongoose')

const UserSchema = new Schema({
  username: { type: String, require: true, unique: true },
  password: { type: String, require: true }
})

module.exports = model('User', UserSchema)
```
在这个文件中，我们定义了`Schema`，然后生成`Model`导出使用，要操作数据库，我们只需要使用`Model`相应的方法即可。

## 身份验证

> Passport是Node.js的身份验证中间件。 Passport极其灵活和模块化，可以毫不费力地放入任何基于Express的Web应用程序中。一套全面的策略支持使用用户名和密码，Facebook，Twitter等进行身份验证。

我们准备使用jwt进行身份验证，暂时不使用第三方授权登录，如果想要了解第三方授权登录或者Passport更多的信息可以阅读[官方文档](http://www.passportjs.org/)；在项目安装`koa-passport`和jwt对应的策略`passport-jwt`，新建`auth.js`：
```javascript
const keys = require('../config/keys')
const User = require('./model/User')


const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: keys.secretOrkey
}

module.exports = passport => {
  passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
    User.findById(jwt_payload._id).then(user => {
      if (user) {
        done(null, user)
      } else {
        done(null, false)
      }
    })
  }))
}
```
然后在项目中使用：
```js
const passport = require('koa-passport')
require('./auth')(passport)
app.use(passport.initialize())
```
新建接口，并使用passport验证身份信息:
```js
api.post('/auth', passport.authenticate('jwt', { session: false }), async ctx => {
  ctx.body = 'auth'
})
```
结果提示Unauthorized，证明身份验证中间件已经生效。接下来我们来实现用户的注册和登录，完善身份验证的整个流程，注册和登录我们会用到`bcrypt`和`jsonwebtoken`，`bcrypt`用于密码的加密和比较，`jsonwebtoken`用于生成token；新增login和register接口：
```js
api.post('/login', async ctx => {
  ctx.verifyParams({
    username: { type: "string", required: true },
    password: { type: "string", required: true },
  })
  const { username, password } = ctx.request.body
  const user = await User.findOne({ username })
  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ _id: user._id, username }, keys.secretOrkey, { expiresIn: 3600 })
    ctx.status = 200
    ctx.body = { token: 'Bearer ' + token }
  } else if (user) {
    ctx.status = 500
    ctx.body = { error: '密码错误' }
  } else {
    ctx.status = 500
    ctx.body = { error: '用户名不存在' }
  }
})

api.post('/register', async ctx => {
  const { username, password } = ctx.request.body
  const users = await User.find({ username })
  if (users.length > 0) {
    ctx.status = 500
    ctx.body = { error: '用户名已被占用' }
  } else {
    await User.create({ username, password: bcrypt.hashSync(password, keys.salt) }).then(user => {
      ctx.body = user
    }).catch(err => {
      ctx.status = 500
      ctx.body = { error: err }
    })
  }
})
```
调用这两个接口获取用户登录的token，再次访问auth接口，状态码200，正常返回访问信息。


