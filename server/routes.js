const Router = require('koa-router')
const page = new Router()

page.get('/index',async ctx => {
  await ctx.render('index', { title: 'Hello' })
})

module.exports = page.routes()