const restify = require('restify')
const corsMiddleware = require('restify-cors-middleware')
const apiRoot = require('./endpoints/root.js')
const apiHashes = require('./endpoints/hashes.js')
const apiProofs = require('./endpoints/proofs.js')
const apiCalendar = require('./endpoints/calendar.js')
const apiVerify = require('./endpoints/verify.js')

// state indicating if the local calendar is fully synched to the global calendar
// let calendarInSync = false

// middleware to ensure the calendar is in sync before processing API requests
/*
function ensureInSync (req, res, next) {
  if (!calendarInSync) {
    return next(new restify.ServiceUnavailableError('Service is currently syncing calendar data.'))
  }
  return next()
} */

// RESTIFY SETUP
// 'version' : all routes will default to this version
let server = restify.createServer({
  name: 'chainpoint-node',
  version: '1.0.0'
})

// Clean up sloppy paths like //todo//////1//
server.pre(restify.pre.sanitizePath())

// Checks whether the user agent is curl. If it is, it sets the
// Connection header to "close" and removes the "Content-Length" header
// See : http://restify.com/#server-api
server.pre(restify.pre.userAgentConnection())

let cors = corsMiddleware({
  preflightMaxAge: 600,
  origins: ['*']
})
server.pre(cors.preflight)
server.use(cors.actual)

server.use(restify.gzipResponse())
server.use(restify.queryParser())
server.use(restify.bodyParser())

// API RESOURCES

// submit hash(es)
server.post({ path: '/hashes', version: '1.0.0' }, apiHashes.postHashesV1)
// get a single proof with a single hash_id
server.get({ path: '/proofs/:hash_id', version: '1.0.0' }, apiProofs.getProofsByIDV1)
// get multiple proofs with 'hashids' header param
// server.get({ path: '/proofs', version: '1.0.0' }, proofs.getProofsByIDV1)
// verify one or more proofs
server.post({ path: '/verify', version: '1.0.0' }, apiVerify.postProofsForVerificationV1)
// get the block hash for the calendar at the specified hieght
// server.get({ path: '/calendar/:height/hash', version: '1.0.0' }, apiCalendar.getCalBlockHashByHeightV1)
// get the dataVal item for the calendar at the specified hieght
// server.get({ path: '/calendar/:height/data', version: '1.0.0' }, apiCalendar.getCalBlockDataByHeightV1)
// get the block object for the calendar at the specified hieght
server.get({ path: '/calendar/:height', version: '1.0.0' }, apiCalendar.getCalBlockByHeightV1Async)
// get the block objects for the calendar in the specified range, incusive
// server.get({ path: '/calendar/:fromHeight/:toHeight', version: '1.0.0' }, apiCalendar.getCalBlockRangeV1)
// get configuration information for this stack
// server.get({ path: '/config', version: '1.0.0' }, config.getConfigInfoV1)
// teapot
server.get({ path: '/', version: '1.0.0' }, apiRoot.getV1)

module.exports = {
  api: server,
  setRedis: (redisClient) => {
    apiHashes.setRedis(redisClient)
    apiProofs.setRedis(redisClient)
  }
  // setCalendarInSync: (inSync) => { calendarInSync = inSync }
}