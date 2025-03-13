import http from 'http';
import https from 'https';
import { performance } from 'perf_hooks';
import fs from 'fs/promises';

// URLs to test
const baseUrl = 'http://localhost:5000';
const paths = ['/', '/dashboard', '/calendar', '/support'];

// Metrics to collect
const metrics = {
  responseTime: [], // response time in ms
  statusCodes: {}, // count of status codes
  contentTypes: {}, // count of content types
  contentSizes: [], // content sizes in bytes
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0
};

// Performance testing parameters
const numRequests = 20; // number of requests per endpoint
const concurrentRequests = 5; // number of concurrent requests
const delayBetweenBatches = 500; // ms delay between batches of concurrent requests

async function sendRequest(url) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, (res) => {
      let data = '';
      let size = 0;
      
      res.on('data', (chunk) => {
        data += chunk;
        size += chunk.length;
      });
      
      res.on('end', () => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        // Update metrics
        metrics.responseTime.push(responseTime);
        metrics.statusCodes[res.statusCode] = (metrics.statusCodes[res.statusCode] || 0) + 1;
        metrics.contentTypes[res.headers['content-type']] = 
          (metrics.contentTypes[res.headers['content-type']] || 0) + 1;
        metrics.contentSizes.push(size);
        metrics.totalRequests++;
        
        if (res.statusCode >= 200 && res.statusCode < 400) {
          metrics.successfulRequests++;
        } else {
          metrics.failedRequests++;
        }
        
        resolve({
          url,
          responseTime,
          statusCode: res.statusCode,
          contentType: res.headers['content-type'],
          contentSize: size
        });
      });
    });
    
    req.on('error', (error) => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      metrics.responseTime.push(responseTime);
      metrics.totalRequests++;
      metrics.failedRequests++;
      
      resolve({
        url,
        responseTime,
        error: error.message,
        failed: true
      });
    });
    
    req.end();
  });
}

async function runBatch(url, batchSize) {
  const promises = [];
  for (let i = 0; i < batchSize; i++) {
    promises.push(sendRequest(url));
  }
  return Promise.all(promises);
}

async function runTest() {
  console.log('🔍 Running performance analysis...');
  console.log(`📊 Testing ${paths.length} endpoints with ${numRequests} requests each (${concurrentRequests} concurrent)\n`);
  
  const startTime = performance.now();
  
  for (const path of paths) {
    const url = `${baseUrl}${path}`;
    console.log(`🌐 Testing ${url}`);
    
    // Run batches of concurrent requests
    for (let i = 0; i < numRequests; i += concurrentRequests) {
      const batchSize = Math.min(concurrentRequests, numRequests - i);
      await runBatch(url, batchSize);
      
      if (i + batchSize < numRequests) {
        // Add delay between batches to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }
  }
  
  const endTime = performance.now();
  const totalDuration = endTime - startTime;
  
  // Calculate result metrics
  const avgResponseTime = metrics.responseTime.reduce((a, b) => a + b, 0) / metrics.responseTime.length;
  const minResponseTime = Math.min(...metrics.responseTime);
  const maxResponseTime = Math.max(...metrics.responseTime);
  const p95ResponseTime = calculatePercentile(metrics.responseTime, 95);
  
  const avgContentSize = metrics.contentSizes.reduce((a, b) => a + b, 0) / metrics.contentSizes.length;
  
  // Generate report
  console.log('\n====================== PERFORMANCE REPORT ======================');
  console.log(`\n📈 OVERVIEW:`);
  console.log(`Total test duration: ${(totalDuration / 1000).toFixed(2)} seconds`);
  console.log(`Total requests: ${metrics.totalRequests}`);
  console.log(`Successful requests: ${metrics.successfulRequests} (${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2)}%)`);
  console.log(`Failed requests: ${metrics.failedRequests} (${((metrics.failedRequests / metrics.totalRequests) * 100).toFixed(2)}%)`);
  
  console.log(`\n⏱️ RESPONSE TIME:`);
  console.log(`Average response time: ${avgResponseTime.toFixed(2)} ms`);
  console.log(`Min response time: ${minResponseTime.toFixed(2)} ms`);
  console.log(`Max response time: ${maxResponseTime.toFixed(2)} ms`);
  console.log(`95th percentile response time: ${p95ResponseTime.toFixed(2)} ms`);
  
  // Score calculation (simplified version of Lighthouse scoring)
  const performanceScore = calculatePerformanceScore(avgResponseTime, p95ResponseTime);
  
  console.log(`\n🏆 PERFORMANCE SCORE: ${performanceScore}/100`);
  
  // Assessment based on performance score
  let assessment = "";
  if (performanceScore >= 90) {
    assessment = "EXCELLENT - The application performs exceptionally well.";
  } else if (performanceScore >= 80) {
    assessment = "GOOD - The application performs well, but has some room for improvement.";
  } else if (performanceScore >= 50) {
    assessment = "AVERAGE - The application performance is acceptable but should be improved.";
  } else {
    assessment = "POOR - The application has serious performance issues that need immediate attention.";
  }
  
  console.log(`\n📋 ASSESSMENT: ${assessment}`);
  
  console.log('\n🔍 DETAILED STATUS CODES:');
  Object.keys(metrics.statusCodes).forEach(code => {
    console.log(`  HTTP ${code}: ${metrics.statusCodes[code]} requests`);
  });
  
  console.log('\n💡 RECOMMENDATIONS:');
  
  if (avgResponseTime > 300) {
    console.log('- Implement server-side caching to reduce response times');
  }
  
  if (p95ResponseTime > 800) {
    console.log('- Optimize database queries and implement query caching');
  }
  
  if (avgContentSize > 500000) {
    console.log('- Compress and optimize assets to reduce payload size');
  }
  
  console.log('- Implement client-side caching with appropriate cache headers');
  console.log('- Consider using a Content Delivery Network (CDN) for static assets');
  console.log('- Enable HTTP/2 to improve connection efficiency');
  
  console.log('\n=================== END OF PERFORMANCE REPORT ===================');
  
  // Save results to file
  await saveResultsToFile({
    metrics,
    summary: {
      totalDuration,
      avgResponseTime,
      minResponseTime,
      maxResponseTime,
      p95ResponseTime,
      avgContentSize,
      performanceScore,
      assessment
    }
  });
}

function calculatePercentile(values, percentile) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

function calculatePerformanceScore(avgResponseTime, p95ResponseTime) {
  // Simple scoring algorithm based on response times
  // This is a simplified version of what Lighthouse might do
  
  // Weight factors
  const avgTimeWeight = 0.7;
  const p95TimeWeight = 0.3;
  
  // Score calculations
  let avgTimeScore = Math.max(0, 100 - (avgResponseTime / 10));
  let p95TimeScore = Math.max(0, 100 - (p95ResponseTime / 20));
  
  // Ensure scores are in 0-100 range
  avgTimeScore = Math.min(100, Math.max(0, avgTimeScore));
  p95TimeScore = Math.min(100, Math.max(0, p95TimeScore));
  
  // Final weighted score
  const finalScore = (avgTimeScore * avgTimeWeight) + (p95TimeScore * p95TimeWeight);
  
  return Math.round(finalScore);
}

async function saveResultsToFile(results) {
  try {
    await fs.writeFile(
      'performance-results.json', 
      JSON.stringify(results, null, 2)
    );
    console.log('Results saved to performance-results.json');
  } catch (error) {
    console.error('Error saving results:', error);
  }
}

// Run the test
runTest().catch(console.error);