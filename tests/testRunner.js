#!/usr/bin/env node

import { spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Comprehensive Test Runner and Reporting System
 *
 * Features:
 * - Runs all test suites with detailed reporting
 * - Generates HTML, JSON, and console reports
 * - Tracks test coverage and performance metrics
 * - Provides pre-deployment validation
 * - Supports parallel test execution
 */

class TestRunner {
  constructor() {
    this.testSuites = [
      {
        name: 'Supabase Integration Tests',
        file: 'tests/integration/supabase.test.js',
        type: 'integration',
        critical: true,
        timeout: 30000
      },
      {
        name: 'R2 Storage Integration Tests',
        file: 'tests/integration/r2Storage.test.js',
        type: 'integration',
        critical: true,
        timeout: 45000
      },
      {
        name: 'End-to-End Workflow Tests',
        file: 'tests/e2e/workflows.test.js',
        type: 'e2e',
        critical: true,
        timeout: 60000
      },
      {
        name: 'Performance and Load Tests',
        file: 'tests/performance/loadTests.test.js',
        type: 'performance',
        critical: false,
        timeout: 120000
      },
      {
        name: 'PayPal Payment Flow Tests',
        file: 'tests/integration/paypal.test.js',
        type: 'integration',
        critical: true,
        timeout: 30000
      }
    ]

    this.results = {
      summary: {
        totalSuites: 0,
        passedSuites: 0,
        failedSuites: 0,
        skippedSuites: 0,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        duration: 0,
        coverage: null
      },
      suites: [],
      errors: [],
      warnings: [],
      performance: {
        slowestSuites: [],
        memoryUsage: null,
        resourceLeaks: []
      }
    }

    this.startTime = null
    this.reportDir = path.join(__dirname, '..', 'test-reports')
  }

  /**
   * Main test runner entry point
   */
  async run(options = {}) {
    const {
      suiteFilter = null,
      parallel = true,
      skipPerformance = false,
      generateReport = true,
      verbose = false
    } = options

    console.log('🚀 Starting Comprehensive Integration Test Suite')
    console.log('=' .repeat(60))

    this.startTime = Date.now()

    try {
      // Setup test environment
      await this.setupTestEnvironment()

      // Filter test suites based on options
      let suitesToRun = this.testSuites
      if (suiteFilter) {
        suitesToRun = suitesToRun.filter(suite =>
          suite.name.toLowerCase().includes(suiteFilter.toLowerCase()) ||
          suite.type === suiteFilter
        )
      }

      if (skipPerformance) {
        suitesToRun = suitesToRun.filter(suite => suite.type !== 'performance')
      }

      this.results.summary.totalSuites = suitesToRun.length

      console.log(`📋 Running ${suitesToRun.length} test suites...\n`)

      // Run tests
      if (parallel && suitesToRun.length > 1) {
        await this.runTestsInParallel(suitesToRun, verbose)
      } else {
        await this.runTestsSequentially(suitesToRun, verbose)
      }

      // Calculate final metrics
      this.calculateSummary()

      // Generate reports
      if (generateReport) {
        await this.generateReports()
      }

      // Print summary
      this.printSummary()

      // Return exit code
      return this.results.summary.failedSuites === 0 ? 0 : 1

    } catch (error) {
      console.error('💥 Test runner failed:', error.message)
      this.results.errors.push({
        type: 'runner_error',
        message: error.message,
        stack: error.stack
      })
      return 1
    }
  }

  /**
   * Setup test environment and dependencies
   */
  async setupTestEnvironment() {
    console.log('🔧 Setting up test environment...')

    // Ensure test reports directory exists
    try {
      await fs.mkdir(this.reportDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Verify required environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'VITE_R2_ACCOUNT_ID'
    ]

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
    if (missingVars.length > 0) {
      this.results.warnings.push(`Missing environment variables: ${missingVars.join(', ')}`)
    }

    // Check if test files exist
    for (const suite of this.testSuites) {
      const filePath = path.join(__dirname, '..', suite.file)
      try {
        await fs.access(filePath)
      } catch (error) {
        this.results.errors.push({
          type: 'file_not_found',
          suite: suite.name,
          file: suite.file,
          message: `Test file not found: ${suite.file}`
        })
      }
    }
  }

  /**
   * Run tests in parallel for faster execution
   */
  async runTestsInParallel(suites, verbose) {
    console.log('⚡ Running tests in parallel...\n')

    const promises = suites.map(suite => this.runSingleSuite(suite, verbose))
    const results = await Promise.allSettled(promises)

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        this.results.suites.push(result.value)
      } else {
        this.results.suites.push({
          name: suites[index].name,
          status: 'failed',
          error: result.reason.message,
          duration: 0,
          tests: { total: 0, passed: 0, failed: 1 }
        })
      }
    })
  }

  /**
   * Run tests sequentially for better debugging
   */
  async runTestsSequentially(suites, verbose) {
    console.log('🔄 Running tests sequentially...\n')

    for (const suite of suites) {
      try {
        const result = await this.runSingleSuite(suite, verbose)
        this.results.suites.push(result)
      } catch (error) {
        this.results.suites.push({
          name: suite.name,
          status: 'failed',
          error: error.message,
          duration: 0,
          tests: { total: 0, passed: 0, failed: 1 }
        })
      }
    }
  }

  /**
   * Run a single test suite
   */
  async runSingleSuite(suite, verbose) {
    const startTime = Date.now()

    console.log(`▶️  Running: ${suite.name}`)

    return new Promise((resolve, reject) => {
      const vitestArgs = [
        'run',
        suite.file,
        '--reporter=json',
        '--no-coverage' // Disable coverage for faster execution
      ]

      if (verbose) {
        vitestArgs.push('--verbose')
      }

      const child = spawn('npx', ['vitest', ...vitestArgs], {
        cwd: path.join(__dirname, '..'),
        env: {
          ...process.env,
          NODE_ENV: 'test'
        }
      })

      let stdout = ''
      let stderr = ''

      child.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      child.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      // Set timeout for the test suite
      const timeout = setTimeout(() => {
        child.kill('SIGKILL')
        reject(new Error(`Test suite ${suite.name} timed out after ${suite.timeout}ms`))
      }, suite.timeout)

      child.on('close', (code) => {
        clearTimeout(timeout)
        const duration = Date.now() - startTime

        try {
          let testResults = {
            total: 0,
            passed: 0,
            failed: 0
          }

          // Parse JSON output if available
          if (stdout.trim()) {
            try {
              const jsonOutput = JSON.parse(stdout)
              if (jsonOutput.testResults) {
                testResults.total = jsonOutput.numTotalTests || 0
                testResults.passed = jsonOutput.numPassedTests || 0
                testResults.failed = jsonOutput.numFailedTests || 0
              }
            } catch (parseError) {
              // Fallback to basic parsing
              const lines = stdout.split('\n')
              testResults.total = lines.filter(line => line.includes('✓') || line.includes('✗')).length
              testResults.passed = lines.filter(line => line.includes('✓')).length
              testResults.failed = lines.filter(line => line.includes('✗')).length
            }
          }

          const result = {
            name: suite.name,
            type: suite.type,
            status: code === 0 ? 'passed' : 'failed',
            duration,
            tests: testResults,
            critical: suite.critical,
            output: stdout,
            error: stderr || null
          }

          console.log(`   ${code === 0 ? '✅' : '❌'} ${suite.name} (${duration}ms)`)
          if (verbose && stderr) {
            console.log(`   ⚠️  Warnings: ${stderr}`)
          }

          resolve(result)
        } catch (error) {
          reject(new Error(`Failed to parse test results for ${suite.name}: ${error.message}`))
        }
      })

      child.on('error', (error) => {
        clearTimeout(timeout)
        reject(new Error(`Failed to run test suite ${suite.name}: ${error.message}`))
      })
    })
  }

  /**
   * Calculate summary statistics
   */
  calculateSummary() {
    this.results.summary.duration = Date.now() - this.startTime

    for (const suite of this.results.suites) {
      if (suite.status === 'passed') {
        this.results.summary.passedSuites++
      } else if (suite.status === 'failed') {
        this.results.summary.failedSuites++
      } else {
        this.results.summary.skippedSuites++
      }

      this.results.summary.totalTests += suite.tests.total
      this.results.summary.passedTests += suite.tests.passed
      this.results.summary.failedTests += suite.tests.failed
    }

    // Calculate performance metrics
    this.results.performance.slowestSuites = this.results.suites
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 3)
      .map(suite => ({
        name: suite.name,
        duration: suite.duration,
        type: suite.type
      }))

    // Record memory usage
    this.results.performance.memoryUsage = process.memoryUsage()
  }

  /**
   * Generate comprehensive test reports
   */
  async generateReports() {
    console.log('\n📊 Generating test reports...')

    // Generate JSON report
    await this.generateJSONReport()

    // Generate HTML report
    await this.generateHTMLReport()

    // Generate console summary report
    await this.generateConsoleReport()

    // Generate CI/CD compatible report
    await this.generateJUnitReport()

    console.log(`📁 Reports generated in: ${this.reportDir}`)
  }

  /**
   * Generate JSON report for programmatic consumption
   */
  async generateJSONReport() {
    const reportData = {
      ...this.results,
      metadata: {
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'test',
        runner: 'custom-test-runner'
      }
    }

    const jsonPath = path.join(this.reportDir, 'test-results.json')
    await fs.writeFile(jsonPath, JSON.stringify(reportData, null, 2))
  }

  /**
   * Generate HTML report for browser viewing
   */
  async generateHTMLReport() {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Integration Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5rem; }
        .header .subtitle { opacity: 0.9; margin-top: 10px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #007bff; }
        .metric.success { border-left-color: #28a745; }
        .metric.danger { border-left-color: #dc3545; }
        .metric.warning { border-left-color: #ffc107; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 2rem; font-weight: bold; color: #007bff; }
        .metric.success .value { color: #28a745; }
        .metric.danger .value { color: #dc3545; }
        .metric.warning .value { color: #ffc107; }
        .suites { padding: 0 30px 30px 30px; }
        .suite { background: #f8f9fa; margin-bottom: 20px; border-radius: 8px; overflow: hidden; }
        .suite-header { padding: 20px; background: white; border-bottom: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center; }
        .suite-header.passed { border-left: 4px solid #28a745; }
        .suite-header.failed { border-left: 4px solid #dc3545; }
        .suite-title { font-weight: 600; font-size: 1.1rem; }
        .suite-meta { display: flex; gap: 15px; font-size: 0.9rem; color: #666; }
        .badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 500; }
        .badge.critical { background: #ffe6e6; color: #dc3545; }
        .badge.integration { background: #e6f3ff; color: #007bff; }
        .badge.e2e { background: #f0e6ff; color: #6f42c1; }
        .badge.performance { background: #fff3cd; color: #856404; }
        .footer { background: #f8f9fa; padding: 20px 30px; color: #666; font-size: 0.9rem; }
        .error-section { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 15px; margin: 20px 0; }
        .warning-section { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Integration Test Report</h1>
            <div class="subtitle">Generated on ${new Date().toLocaleString()}</div>
        </div>

        <div class="summary">
            <div class="metric ${this.results.summary.passedSuites === this.results.summary.totalSuites ? 'success' : 'danger'}">
                <h3>Test Suites</h3>
                <div class="value">${this.results.summary.passedSuites}/${this.results.summary.totalSuites}</div>
                <div>Passed</div>
            </div>
            <div class="metric ${this.results.summary.failedTests === 0 ? 'success' : 'danger'}">
                <h3>Individual Tests</h3>
                <div class="value">${this.results.summary.passedTests}/${this.results.summary.totalTests}</div>
                <div>Passed</div>
            </div>
            <div class="metric">
                <h3>Duration</h3>
                <div class="value">${Math.round(this.results.summary.duration / 1000)}s</div>
                <div>Total Time</div>
            </div>
            <div class="metric ${this.results.errors.length === 0 ? 'success' : 'danger'}">
                <h3>Errors</h3>
                <div class="value">${this.results.errors.length}</div>
                <div>Critical Issues</div>
            </div>
        </div>

        ${this.results.errors.length > 0 ? `
        <div class="error-section">
            <h3>❌ Critical Errors</h3>
            ${this.results.errors.map(error => `
                <div><strong>${error.type}:</strong> ${error.message}</div>
            `).join('')}
        </div>
        ` : ''}

        ${this.results.warnings.length > 0 ? `
        <div class="warning-section">
            <h3>⚠️ Warnings</h3>
            ${this.results.warnings.map(warning => `<div>${warning}</div>`).join('')}
        </div>
        ` : ''}

        <div class="suites">
            <h2>Test Suite Results</h2>
            ${this.results.suites.map(suite => `
                <div class="suite">
                    <div class="suite-header ${suite.status}">
                        <div>
                            <div class="suite-title">${suite.name}</div>
                            <div class="suite-meta">
                                <span class="badge ${suite.type}">${suite.type}</span>
                                ${suite.critical ? '<span class="badge critical">Critical</span>' : ''}
                                <span>Duration: ${suite.duration}ms</span>
                                <span>Tests: ${suite.tests.passed}/${suite.tests.total} passed</span>
                            </div>
                        </div>
                        <div>${suite.status === 'passed' ? '✅' : '❌'}</div>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="footer">
            <div>Generated by Custom Test Runner • Node.js ${process.version} • ${process.platform}</div>
            <div>Memory Usage: ${Math.round(this.results.performance.memoryUsage.heapUsed / 1024 / 1024)}MB heap used</div>
        </div>
    </div>
</body>
</html>`

    const htmlPath = path.join(this.reportDir, 'test-report.html')
    await fs.writeFile(htmlPath, htmlContent)
  }

  /**
   * Generate console summary report
   */
  async generateConsoleReport() {
    const report = `
INTEGRATION TEST SUMMARY REPORT
Generated: ${new Date().toISOString()}
Duration: ${Math.round(this.results.summary.duration / 1000)}s

TEST SUITES: ${this.results.summary.passedSuites}/${this.results.summary.totalSuites} passed
INDIVIDUAL TESTS: ${this.results.summary.passedTests}/${this.results.summary.totalTests} passed
ERRORS: ${this.results.errors.length}
WARNINGS: ${this.results.warnings.length}

SUITE BREAKDOWN:
${this.results.suites.map(suite =>
  `  ${suite.status === 'passed' ? '✅' : '❌'} ${suite.name} (${suite.duration}ms) - ${suite.tests.passed}/${suite.tests.total} tests passed`
).join('\n')}

PERFORMANCE:
  Slowest Suites:
${this.results.performance.slowestSuites.map(suite =>
  `    - ${suite.name}: ${suite.duration}ms`
).join('\n')}

  Memory Usage: ${Math.round(this.results.performance.memoryUsage.heapUsed / 1024 / 1024)}MB

${this.results.errors.length > 0 ? `
ERRORS:
${this.results.errors.map(error => `  - ${error.type}: ${error.message}`).join('\n')}
` : ''}

${this.results.warnings.length > 0 ? `
WARNINGS:
${this.results.warnings.map(warning => `  - ${warning}`).join('\n')}
` : ''}
`

    const reportPath = path.join(this.reportDir, 'console-report.txt')
    await fs.writeFile(reportPath, report)
  }

  /**
   * Generate JUnit XML report for CI/CD integration
   */
  async generateJUnitReport() {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="Integration Tests" tests="${this.results.summary.totalTests}" failures="${this.results.summary.failedTests}" time="${this.results.summary.duration / 1000}">
${this.results.suites.map(suite => `  <testsuite name="${suite.name}" tests="${suite.tests.total}" failures="${suite.tests.failed}" time="${suite.duration / 1000}">
${Array.from({length: suite.tests.total}, (_, i) => {
  const failed = i < suite.tests.failed
  return `    <testcase name="Test ${i + 1}" time="0.1"${failed ? '>\n      <failure message="Test failed"/>\n    </testcase>' : '/>'}`
}).join('\n')}
  </testsuite>`).join('\n')}
</testsuites>`

    const xmlPath = path.join(this.reportDir, 'junit-report.xml')
    await fs.writeFile(xmlPath, xml)
  }

  /**
   * Print summary to console
   */
  printSummary() {
    console.log('\n' + '=' .repeat(60))
    console.log('📊 TEST EXECUTION SUMMARY')
    console.log('=' .repeat(60))

    const { summary } = this.results

    console.log(`⏱️  Duration: ${Math.round(summary.duration / 1000)}s`)
    console.log(`📊 Test Suites: ${summary.passedSuites}/${summary.totalSuites} passed`)
    console.log(`🧪 Individual Tests: ${summary.passedTests}/${summary.totalTests} passed`)

    if (summary.failedSuites > 0) {
      console.log(`❌ Failed Suites: ${summary.failedSuites}`)
      this.results.suites
        .filter(suite => suite.status === 'failed')
        .forEach(suite => {
          console.log(`   - ${suite.name}${suite.critical ? ' (CRITICAL)' : ''}`)
        })
    }

    if (this.results.errors.length > 0) {
      console.log(`💥 Errors: ${this.results.errors.length}`)
    }

    if (this.results.warnings.length > 0) {
      console.log(`⚠️  Warnings: ${this.results.warnings.length}`)
    }

    console.log(`💾 Memory Used: ${Math.round(this.results.performance.memoryUsage.heapUsed / 1024 / 1024)}MB`)

    // Overall status
    const allCriticalPassed = this.results.suites
      .filter(suite => suite.critical)
      .every(suite => suite.status === 'passed')

    if (summary.failedSuites === 0) {
      console.log('\n🎉 ALL TESTS PASSED!')
      console.log('✅ System is ready for deployment')
    } else if (allCriticalPassed) {
      console.log('\n⚠️  Some tests failed, but all critical tests passed')
      console.log('🟡 Review failures before deployment')
    } else {
      console.log('\n💥 CRITICAL TESTS FAILED!')
      console.log('❌ System is NOT ready for deployment')
    }

    console.log('=' .repeat(60))
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  const options = {}

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--filter':
        options.suiteFilter = args[++i]
        break
      case '--sequential':
        options.parallel = false
        break
      case '--skip-performance':
        options.skipPerformance = true
        break
      case '--no-report':
        options.generateReport = false
        break
      case '--verbose':
        options.verbose = true
        break
      case '--help':
        console.log(`
Usage: node tests/testRunner.js [options]

Options:
  --filter <pattern>     Run only suites matching pattern
  --sequential          Run tests sequentially instead of parallel
  --skip-performance    Skip performance tests
  --no-report          Don't generate reports
  --verbose            Show detailed output
  --help               Show this help message

Examples:
  node tests/testRunner.js                          # Run all tests
  node tests/testRunner.js --filter supabase       # Run only Supabase tests
  node tests/testRunner.js --skip-performance      # Skip performance tests
  node tests/testRunner.js --sequential --verbose  # Run sequentially with details
`)
        process.exit(0)
    }
  }

  const runner = new TestRunner()
  runner.run(options).then(exitCode => {
    process.exit(exitCode)
  }).catch(error => {
    console.error('Test runner crashed:', error)
    process.exit(1)
  })
}

export default TestRunner