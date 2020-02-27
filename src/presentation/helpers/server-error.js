module.exports = class ServerError extends Error {
  constructor (paramName) {
    super('An internal server error')
    this.name = 'ServerError'
  }
}
