import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Parser from 'rss-parser';
import { insertTaskSchema, Task } from "@shared/schema";
import { z } from "zod";

interface NewsItem {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  categories?: string[];
  source: string;
  sourceName: string;
  category: string;
  guid?: string;
  creator?: string;
  summary?: string;
  isoDate?: string;
  image?: string;
}

// Dictionary of available news sources
const NEWS_SOURCES = {
  bbc: {
    url: 'https://feeds.bbci.co.uk/news/rss.xml',
    name: 'BBC News',
    category: 'World'
  },
  bbcTech: {
    url: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
    name: 'BBC Technology',
    category: 'Technology'
  },
  bbcBusiness: {
    url: 'https://feeds.bbci.co.uk/news/business/rss.xml',
    name: 'BBC Business',
    category: 'Business'
  },
  guardian: {
    url: 'https://www.theguardian.com/world/rss',
    name: 'The Guardian',
    category: 'World'
  },
  guardianTech: {
    url: 'https://www.theguardian.com/uk/technology/rss',
    name: 'The Guardian Technology',
    category: 'Technology'
  },
  cnn: {
    url: 'http://rss.cnn.com/rss/edition.rss',
    name: 'CNN',
    category: 'World'
  },
  cnnTech: {
    url: 'http://rss.cnn.com/rss/edition_technology.rss',
    name: 'CNN Technology',
    category: 'Technology'
  },
  cnnBusiness: {
    url: 'http://rss.cnn.com/rss/money_news_international.rss',
    name: 'CNN Business',
    category: 'Business'
  },
  sports: {
    url: 'https://www.espn.com/espn/rss/news',
    name: 'ESPN Sports',
    category: 'Sports'
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Mock data for categories
  const categories = [
    { name: "Work", color: "#8B5CF6", id: 1 },
    { name: "Personal", color: "#10B981", id: 2 },
    { name: "Study", color: "#3B82F6", id: 3 },
    { name: "Shopping", color: "#F59E0B", id: 4 },
    { name: "Health", color: "#EF4444", id: 5 },
    { name: "Other", color: "#6B7280", id: 6 },
  ];

  // Task endpoints
  app.get("/api/tasks", async (_req: Request, res: Response) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req: Request, res: Response) => {
    try {
      // Validate task data
      const result = insertTaskSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: `Validation error: ${result.error.message}` });
      }
      
      // Create task using storage
      const task = await storage.createTask(result.data);
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to create task" });
    }
  });
  
  app.get("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });
  
  app.patch("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      const updatedTask = await storage.updateTask(id, req.body);
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task" });
    }
  });
  
  app.delete("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteTask(id);
      if (!success) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  app.get("/api/categories", (_req: Request, res: Response) => {
    res.json(categories);
  });
  
  // News feed endpoint
  app.get("/api/news", async (req: Request, res: Response) => {
    try {
      const parser = new Parser();
      const category = req.query.category as string || 'all';
      const source = req.query.source as string || 'all';
      
      let sources: { url: string, name: string, category: string }[] = [];
      
      // Filter sources based on request parameters
      if (source === 'all') {
        sources = Object.values(NEWS_SOURCES);
      } else if (source in NEWS_SOURCES) {
        sources = [NEWS_SOURCES[source as keyof typeof NEWS_SOURCES]];
      } else {
        return res.status(400).json({ error: 'Invalid source parameter' });
      }
      
      // Apply category filter if needed
      if (category !== 'all') {
        sources = sources.filter(src => 
          src.category.toLowerCase() === category.toLowerCase()
        );
      }
      
      if (sources.length === 0) {
        return res.status(404).json({ error: 'No news sources found for the given parameters' });
      }

      // Fetch and parse all selected feeds
      const feedPromises = sources.map(async (src) => {
        try {
          const feed = await parser.parseURL(src.url);
          return feed.items.map(item => ({
            ...item,
            source: src.url,
            sourceName: src.name,
            category: src.category
          }));
        } catch (error) {
          console.error(`Error fetching from ${src.name}:`, error);
          return [];
        }
      });

      const feedResults = await Promise.all(feedPromises);
      
      // Combine, sort by date, and limit to the most recent 30 articles
      const allItems: NewsItem[] = feedResults
        .flat()
        .sort((a, b) => 
          new Date(b.pubDate || '').getTime() - new Date(a.pubDate || '').getTime()
        )
        .slice(0, 30);

      res.json({
        sources: sources.map(s => s.name),
        items: allItems
      });
    } catch (error) {
      console.error('Error in news endpoint:', error);
      res.status(500).json({ error: 'Failed to fetch news feeds' });
    }
  });

  // Available news sources endpoint
  app.get("/api/news/sources", (_req: Request, res: Response) => {
    const sources = Object.entries(NEWS_SOURCES).map(([key, value]) => ({
      id: key,
      name: value.name,
      url: value.url,
      category: value.category
    }));
    
    // Extract unique categories using a manual approach
    const categoriesMap: Record<string, boolean> = {};
    const uniqueCategories: string[] = [];
    
    for (const source of sources) {
      if (!categoriesMap[source.category]) {
        categoriesMap[source.category] = true;
        uniqueCategories.push(source.category);
      }
    }
    
    res.json({ sources, categories: uniqueCategories });
  });

  const httpServer = createServer(app);

  return httpServer;
}
