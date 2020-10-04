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