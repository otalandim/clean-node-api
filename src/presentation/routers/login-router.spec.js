const LoginRouter = require('./login-router')
const MissingParamError = require('../helpers/missing-param-error')
const UnauthorizedError = require('../helpers/unauthorized-error')
const ServerError = require('../helpers/server-error')

const makeSut = () => {
  const authSpy = makeAuthSpy()
  authSpy.accessToken = 'valid_token'
  const sut = new LoginRouter(authSpy)
  return {
    sut,
    authSpy
  }
}

const makeAuthSpy = () => {
  class AuthSpy {
    auth (email, password) {
      this.email = email
      this.password = password
      return this.accessToken
    }
  }
  return new AuthSpy()
}

const makeAuthErrorSpy = () => {
  class AuthSpy {
    auth () {
      throw new Error()
    }
  }
  return new AuthSpy()
}

describe('Login Router', () => {
  test('should return 400 if no email is provided', () => {
    const { sut } = makeSut()
    const httpRequest = {
      body: {
        password: '123456'
      }
    }
    const httpResponse = sut.route(httpRequest)
    expect(httpResponse.statusCode).toBe(400)
    expect(httpResponse.body).toEqual(new MissingParamError('email'))
  })

  test('should return 400 if no password is provided', () => {
    const { sut } = makeSut()
    const httpRequest = {
      body: {
        email: 'email@email.com'
      }
    }
    const httpResponse = sut.route(httpRequest)
    expect(httpResponse.statusCode).toBe(400)
    expect(httpResponse.body).toEqual(new MissingParamError('password'))
  })

  test('should return 500 if no httpRequest is provided', () => {
    const { sut } = makeSut()
    const httpResponse = sut.route()
    expect(httpResponse.statusCode).toBe(500)
    expect(httpResponse.body).toEqual(new ServerError())
  })

  test('should return 500 if httpRequest has no body', () => {
    const { sut } = makeSut()
    const httpResponse = sut.route({})
    expect(httpResponse.statusCode).toBe(500)
    expect(httpResponse.body).toEqual(new ServerError())
  })

  test('should calling authentication with correct params', () => {
    const { sut, authSpy } = makeSut()
    const httpRequest = {
      body: {
        email: 'email@email.com',
        password: '123456'
      }
    }
    sut.route(httpRequest)
    expect(authSpy.email).toBe(httpRequest.body.email)
    expect(authSpy.password).toBe(httpRequest.body.password)
  })

  test('should returns 401 when invalid credentials are provided', () => {
    const { sut, authSpy } = makeSut()
    authSpy.accessToken = null
    const httpRequest = {
      body: {
        email: 'invalid_email@email.com',
        password: 'invalid_123456'
      }
    }
    const httpResponse = sut.route(httpRequest)
    expect(httpResponse.statusCode).toBe(401)
    expect(httpResponse.body).toEqual(new UnauthorizedError())
  })

  test('should returns 200 when valid credentials are provided', () => {
    const { sut, authSpy } = makeSut()
    const httpRequest = {
      body: {
        email: 'email@email.com',
        password: '123456'
      }
    }
    const httpResponse = sut.route(httpRequest)
    expect(httpResponse.statusCode).toBe(200)
    expect(httpResponse.body.accessToken).toEqual(authSpy.accessToken)
  })

  test('should returns 500 if no authUseCase is provided', () => {
    const sut = new LoginRouter()
    const httpRequest = {
      body: {
        email: 'email@email.com',
        password: '123456'
      }
    }
    const httpResponse = sut.route(httpRequest)
    expect(httpResponse.statusCode).toBe(500)
    expect(httpResponse.body).toEqual(new ServerError())
  })

  test('should returns 500 if authUseCase has no auth method', () => {
    const sut = new LoginRouter({})
    const httpRequest = {
      body: {
        email: 'email@email.com',
        password: '123456'
      }
    }
    const httpResponse = sut.route(httpRequest)
    expect(httpResponse.statusCode).toBe(500)
    expect(httpResponse.body).toEqual(new ServerError())
  })

  test('should returns 500 if authUseCase throws', () => {
    const authSpy = makeAuthErrorSpy()
    const sut = new LoginRouter(authSpy)
    const httpRequest = {
      body: {
        email: 'email@email.com',
        password: '123456'
      }
    }
    const httpResponse = sut.route(httpRequest)
    expect(httpResponse.statusCode).toBe(500)
  })
})
