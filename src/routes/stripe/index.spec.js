import chai from 'chai'
import index from './index'

const expect = chai.expect

describe('./stripe/index', () => {
  it('should expect a function', (done) => {
    expect(index).to.be.a('function')
    done()
  })
})
