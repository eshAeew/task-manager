import * as lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

async function runLighthouse() {
  // Launch Chrome
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
  });

  // Run Lighthouse
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
  };

  // The URL of your application
  const url = 'http://localhost:5000/';
  
  console.log(`Running Lighthouse audit on ${url}...`);
  
  try {
    const runnerResult = await lighthouse.default(url, options);
    
    // Extract the scores
    const categories = runnerResult.lhr.categories;
    
    console.log('\n---------------------- LIGHTHOUSE REPORT ----------------------');
    console.log(`Performance score: ${(categories.performance.score * 100).toFixed(0)}/100`);
    console.log(`Accessibility score: ${(categories.accessibility.score * 100).toFixed(0)}/100`);
    console.log(`Best Practices score: ${(categories['best-practices'].score * 100).toFixed(0)}/100`);
    console.log(`SEO score: ${(categories.seo.score * 100).toFixed(0)}/100`);
    console.log('\n-------------------- PERFORMANCE METRICS ---------------------');
    
    // Log performance metrics
    const metrics = runnerResult.lhr.audits;
    console.log(`First Contentful Paint: ${metrics['first-contentful-paint'].displayValue}`);
    console.log(`Speed Index: ${metrics['speed-index'].displayValue}`);
    console.log(`Time to Interactive: ${metrics['interactive'].displayValue}`);
    console.log(`First Meaningful Paint: ${metrics['first-meaningful-paint'].displayValue}`);
    console.log(`First CPU Idle: ${metrics['first-cpu-idle']?.displayValue || 'N/A'}`);
    console.log(`Total Blocking Time: ${metrics['total-blocking-time'].displayValue}`);
    console.log(`Largest Contentful Paint: ${metrics['largest-contentful-paint'].displayValue}`);
    console.log(`Cumulative Layout Shift: ${metrics['cumulative-layout-shift'].displayValue}`);
    
    console.log('\n----------------- IMPROVEMENT OPPORTUNITIES ------------------');
    // Display top opportunities for improvement
    const opportunities = Object.values(metrics)
      .filter(audit => audit.details && audit.details.type === 'opportunity' && audit.score < 1)
      .sort((a, b) => (b.numericValue || 0) - (a.numericValue || 0))
      .slice(0, 5);
    
    if (opportunities.length > 0) {
      opportunities.forEach(opportunity => {
        console.log(`- ${opportunity.title}: ${opportunity.displayValue || 'No value'}`);
      });
    } else {
      console.log('No significant improvement opportunities identified.');
    }
    
    console.log('\n------------------- ACCESSIBILITY ISSUES ---------------------');
    // Display accessibility issues
    const accessibilityIssues = Object.values(metrics)
      .filter(audit => audit.group === 'a11y' && audit.score < 1)
      .slice(0, 5);
    
    if (accessibilityIssues.length > 0) {
      accessibilityIssues.forEach(issue => {
        console.log(`- ${issue.title}`);
      });
    } else {
      console.log('No significant accessibility issues identified.');
    }
    
    console.log('\n----------------------------------------------------------------');
  } catch (error) {
    console.error('Error running Lighthouse:', error);
  } finally {
    // Close Chrome
    await chrome.kill();
  }
}

runLighthouse();