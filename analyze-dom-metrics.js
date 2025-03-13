import http from 'http';
import { JSDOM } from 'jsdom';

const baseUrl = 'http://localhost:5000';
const paths = ['/', '/dashboard', '/calendar', '/support'];

// Metrics for DOM complexity and server response
const metrics = {
  pages: {}
};

async function fetchAndAnalyzePage(url) {
  console.log(`Analyzing ${url}...`);
  
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Status Code: ${res.statusCode}`));
      }
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          // Create a virtual DOM to analyze the HTML
          const dom = new JSDOM(data);
          const document = dom.window.document;
          
          // Get page metrics
          const pageMetrics = analyzeDOM(document);
          
          // Calculate scores
          const scores = calculateScores(pageMetrics);
          
          // Store the metrics and scores
          const path = url.replace(baseUrl, '') || '/';
          metrics.pages[path] = {
            metrics: pageMetrics,
            scores
          };
          
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

function analyzeDOM(document) {
  // DOM complexity metrics
  const allElements = document.querySelectorAll('*');
  const images = document.querySelectorAll('img');
  const scripts = document.querySelectorAll('script');
  const styleSheets = document.querySelectorAll('link[rel="stylesheet"]');
  const inlineStyles = document.querySelectorAll('style');
  
  // Calculate estimated CSS complexity
  let cssRules = 0;
  for (const style of inlineStyles) {
    cssRules += (style.textContent.match(/\{([^}]*)\}/g) || []).length;
  }
  
  // Get total JavaScript size
  let jsSize = 0;
  for (const script of scripts) {
    jsSize += script.textContent.length;
  }
  
  // Analyze DOM depth
  function getMaxDepth(element, currentDepth = 0) {
    if (!element || !element.children || element.children.length === 0) {
      return currentDepth;
    }
    
    let maxChildDepth = currentDepth;
    for (const child of element.children) {
      const childDepth = getMaxDepth(child, currentDepth + 1);
      maxChildDepth = Math.max(maxChildDepth, childDepth);
    }
    
    return maxChildDepth;
  }
  
  const domDepth = getMaxDepth(document.body);
  
  return {
    totalElements: allElements.length,
    domDepth,
    images: images.length,
    scripts: scripts.length,
    styleSheets: styleSheets.length,
    inlineStyles: inlineStyles.length,
    estimatedCSSRules: cssRules,
    javascriptSize: jsSize,
    bodySize: document.body.innerHTML.length
  };
}

function calculateScores(metrics) {
  // DOM Complexity Score (lower is better)
  const domComplexityScore = Math.min(100, Math.max(0, 100 - (
    (metrics.totalElements / 500) * 40 + 
    (metrics.domDepth / 15) * 30 + 
    (metrics.scripts / 10) * 15 + 
    (metrics.styleSheets / 5) * 15
  )));
  
  // Size Score (lower is better)
  const sizeScore = Math.min(100, Math.max(0, 100 - (
    (metrics.bodySize / 100000) * 60 + 
    (metrics.javascriptSize / 50000) * 40
  )));
  
  // Resource Count Score (lower is better)
  const resourceScore = Math.min(100, Math.max(0, 100 - (
    (metrics.images / 10) * 40 + 
    (metrics.scripts / 8) * 40 + 
    (metrics.styleSheets / 3) * 20
  )));
  
  // Overall Accessibility Score (calculated based on DOM complexity and resource count)
  const accessibilityScore = Math.min(100, Math.max(0, (
    domComplexityScore * 0.5 + 
    resourceScore * 0.3 + 
    sizeScore * 0.2
  )));
  
  // Best Practices Score
  // Simple calculation: penalize for excessive elements, nesting, and scripts
  const bestPracticesScore = Math.min(100, Math.max(0, 100 - (
    (metrics.domDepth > 10 ? 20 : 0) + 
    (metrics.totalElements > 1000 ? 25 : 0) + 
    (metrics.scripts > 15 ? 25 : 0) + 
    (metrics.inlineStyles > 3 ? 15 : 0) + 
    (metrics.estimatedCSSRules > 500 ? 15 : 0)
  )));
  
  return {
    domComplexity: Math.round(domComplexityScore),
    size: Math.round(sizeScore),
    resources: Math.round(resourceScore),
    accessibility: Math.round(accessibilityScore),
    bestPractices: Math.round(bestPracticesScore)
  };
}

async function runAnalysis() {
  try {
    console.log('🔍 Starting DOM and accessibility analysis...');
    console.log(`📊 Analyzing ${paths.length} pages\n`);
    
    // Analyze each page
    for (const path of paths) {
      const url = `${baseUrl}${path}`;
      await fetchAndAnalyzePage(url);
    }
    
    // Calculate average scores
    const pages = Object.values(metrics.pages);
    const avgScores = {
      domComplexity: Math.round(pages.reduce((sum, page) => sum + page.scores.domComplexity, 0) / pages.length),
      size: Math.round(pages.reduce((sum, page) => sum + page.scores.size, 0) / pages.length),
      resources: Math.round(pages.reduce((sum, page) => sum + page.scores.resources, 0) / pages.length),
      accessibility: Math.round(pages.reduce((sum, page) => sum + page.scores.accessibility, 0) / pages.length),
      bestPractices: Math.round(pages.reduce((sum, page) => sum + page.scores.bestPractices, 0) / pages.length)
    };
    
    // Calculate overall score (Lighthouse-inspired)
    const overallScore = Math.round(
      avgScores.domComplexity * 0.25 + 
      avgScores.size * 0.25 + 
      avgScores.resources * 0.15 + 
      avgScores.accessibility * 0.15 + 
      avgScores.bestPractices * 0.2
    );
    
    // Output results
    console.log('\n====================== DOM ANALYSIS REPORT ======================');
    
    console.log('\n📊 PAGE DETAILS:');
    for (const [path, data] of Object.entries(metrics.pages)) {
      console.log(`\n${path}:`);
      console.log(`  Elements: ${data.metrics.totalElements}, DOM Depth: ${data.metrics.domDepth}`);
      console.log(`  Resources: ${data.metrics.images} images, ${data.metrics.scripts} scripts, ${data.metrics.styleSheets} stylesheets`);
      console.log(`  Size: ~${Math.round(data.metrics.bodySize / 1024)} KB HTML, ~${Math.round(data.metrics.javascriptSize / 1024)} KB inline JS`);
      console.log(`  Scores: DOM Complexity: ${data.scores.domComplexity}, Accessibility: ${data.scores.accessibility}, Best Practices: ${data.scores.bestPractices}`);
    }
    
    console.log('\n📈 AVERAGE SCORES:');
    console.log(`  DOM Complexity: ${avgScores.domComplexity}/100`);
    console.log(`  Page Size: ${avgScores.size}/100`);
    console.log(`  Resource Usage: ${avgScores.resources}/100`);
    console.log(`  Accessibility: ${avgScores.accessibility}/100`);
    console.log(`  Best Practices: ${avgScores.bestPractices}/100`);
    
    console.log(`\n🏆 OVERALL SCORE: ${overallScore}/100`);
    
    // Assessment based on overall score
    let assessment = "";
    if (overallScore >= 90) {
      assessment = "EXCELLENT - The application has a well-structured DOM and follows best practices.";
    } else if (overallScore >= 80) {
      assessment = "GOOD - The application has good structure, with some room for improvement.";
    } else if (overallScore >= 50) {
      assessment = "AVERAGE - The application has several areas that could be improved.";
    } else {
      assessment = "POOR - The application has significant structural issues that need attention.";
    }
    
    console.log(`\n📋 ASSESSMENT: ${assessment}`);
    
    console.log('\n💡 RECOMMENDATIONS:');
    
    // DOM Complexity recommendations
    if (avgScores.domComplexity < 80) {
      console.log('- Reduce DOM complexity by eliminating unnecessary nested elements');
      console.log('- Consider using more efficient component structures');
    }
    
    // Size recommendations
    if (avgScores.size < 80) {
      console.log('- Minify HTML, CSS, and JavaScript');
      console.log('- Split large components into smaller, more manageable pieces');
    }
    
    // Resource recommendations
    if (avgScores.resources < 80) {
      console.log('- Lazy load non-critical resources');
      console.log('- Combine small scripts and stylesheets to reduce HTTP requests');
    }
    
    // Accessibility recommendations
    if (avgScores.accessibility < 80) {
      console.log('- Add appropriate ARIA attributes to improve screen reader compatibility');
      console.log('- Ensure proper color contrast for text elements');
      console.log('- Add descriptive alt text to all images');
    }
    
    // Best Practices recommendations
    if (avgScores.bestPractices < 80) {
      console.log('- Implement proper semantic HTML5 elements');
      console.log('- Avoid deeply nested DOM structures');
      console.log('- Use CSS Grid or Flexbox for layouts instead of complex nested divs');
    }
    
    console.log('\n================= END OF DOM ANALYSIS REPORT =================');
    
  } catch (error) {
    console.error('Error during analysis:', error);
  }
}

// Run the analysis
runAnalysis().catch(console.error);