
class TestHandler {
  prototype () {
    this.tests = {}
  }
  getTestList () {
    return Object.keys(this.tests).map(name => this.tests[name])
  }
  isTestRunnig () {
    return this.getTestList().some(test => test.status === 'running' )
  }
  isSequentialTestRunning () {
    return this.getTestList().some(test => !test.isParallel() && test.status === 'running' )
  }
  isParallelTestRunning () {
    return this.getTestList().some(test => test.isParallel() && test.status === 'running' )
  }
  get numberOfTests () {
    return this.getTestList().length
  }
  get numberOfCompletedTests () {
    return this.getTestList().filter(test => test.done).length
  }
  get numberOfSuccessfullTests () {
    return this.getTestList().filter(test => test.success).length
  }
  registerTest (test) {
    if (test.name == null) {
      throw new Error(`
      Each test must be defined by a unique function name!

      E.g. \`test('test description', async function uniqueName () { .. })\``
    )
    }
    if (this.tests[test.name] != null) {
      throw new Error(`
        Each test must be defined by a unique function name!

        \`test('test description', async function ${test.name} () { .. })\` is already registered!`
      )
    }
    if (state.query.test == null || test.name.indexOf(state.query.test) >= 0) {
      this.tests[test.name] = test
      if (!this.isTestRunnig() || (test.isParallel() && this.isParallelTestRunning())) {
        // only if no test is running, or if parallel tests are already running
        test.run()
      }
    }
  }
  _runNextSequentialTest () {
    let nextSequential = this.getTestList().find(
      t => t.status === 'pending' && t.isSequential()
    )
    if (nextSequential != null) {
      nextSequential.run()
      return true
    } else {
      return false
    }
  }
  _runNextParallelTests () {
    let nextParallels = this.getTestList().filter(
      t => t.status === 'pending' && t.isParallel()
    )
    if (nextParallels.length > 0) {
      nextParallels.map(t => t.run())
      return true
    } else {
      return false
    }
  }
  testCompleted (test) {
    this._runNextParallelTests()
    if (!this.isTestRunnig()) {
      this._runNextSequentialTest()
      if (!this.isSequentialTestRunning()) {
        this.done()
      }
    }
  }
  done () {
    if (this.numberOfTests === this.numberOfCompletedTests) {
      if (this.numberOfTests === this.numberOfSuccessfullTests) {
        if (browserSupport) {
          console.log('\n%cAll tests passed!', 'colod:green; font-weight:bold')
          console.log('%c ',
            'font-size: 1px; padding: 60px 80px; background-size: 170px 120px; line-height: 120px; background-image: url(https://cloud.githubusercontent.com/assets/5553757/25725585/ee1e2ac0-3120-11e7-9401-323c153a99f1.gif)'
          )
        } else {
          console.log('\n -- All tests passed! --')
        }
      } else {
        if (browserSupport) {
          console.log(`\n%cPassed: ${this.numberOfSuccessfullTests} %cFailed: ${this.numberOfTests - this.numberOfSuccessfullTests}`, 'font-weight:bold; color: green', 'font-weight:bold; color:red')
        } else {
          console.log(`\nPassed: ${this.numberOfSuccessfullTests}\nFailed: ${this.numberOfTests - this.numberOfSuccessfullTests}`)
        }
      }
    }
  }
}

const testHandler = new TestHandler()
testHandler.run()

export default testHandler
