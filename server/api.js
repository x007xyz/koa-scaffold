const fs = require('fs')
const path = require('path')

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const passport = require('koa-passport')
const Router = require('koa-router')
const api = new Router({
  prefix: '/api'
})

const User = require('./model/User')
const keys = require('../config/keys')

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

api.post('/auth', passport.authenticate('jwt', { session: false }), async ctx => {
  ctx.body = 'auth'
})

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

module.exports = api.routes()