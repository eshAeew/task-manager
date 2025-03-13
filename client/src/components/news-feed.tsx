import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  RefreshCw, 
  ExternalLink, 
  Clock, 
  Newspaper, 
  Filter, 
  X,
  ArrowUpRight 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryClient } from "@/lib/queryClient";

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  content?: string;
  contentSnippet?: string;
  categories?: string[];
  source: string;
  sourceName: string;
  category: string;
  guid?: string;
  isoDate?: string;
}

interface NewsApiResponse {
  sources: string[];
  items: NewsItem[];
}

interface NewsSourcesResponse {
  sources: {
    id: string;
    name: string;
    url: string;
    category: string;
  }[];
  categories: string[];
}

export function NewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [availableSources, setAvailableSources] = useState<NewsSourcesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');

  // Function to format date to relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return `${diffSecs} second${diffSecs !== 1 ? 's' : ''} ago`;
    
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  // Fetch news sources
  const fetchNewsSources = async () => {
    try {
      const response = await fetch('/api/news/sources');
      if (!response.ok) {
        throw new Error(`Failed to fetch news sources: ${response.status}`);
      }
      const data: NewsSourcesResponse = await response.json();
      setAvailableSources(data);
    } catch (error) {
      console.error('Error fetching news sources:', error);
    }
  };

  // Fetch news
  const fetchNews = async (category = selectedCategory) => {
    setLoading(true);
    setError(null);
    setRefreshing(true);
    
    try {
      const url = `/api/news?category=${category}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.status}`);
      }
      
      const data: NewsApiResponse = await response.json();
      setNews(data.items);
      setSources(data.sources);
      
    } catch (err: any) {
      setError(err.message || 'Failed to fetch news');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchNewsSources();
    fetchNews();
    
    // Set up auto-refresh every 5 minutes
    const refreshInterval = setInterval(() => {
      fetchNews();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Fetch news when category changes
  useEffect(() => {
    fetchNews(selectedCategory);
  }, [selectedCategory]);

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  // Handle manual refresh
  const handleRefresh = () => {
    fetchNews();
  };

  // Filter news by category for tabs
  const getNewsByCategory = (category: string) => {
    if (category === 'all') return news;
    return news.filter(item => item.category === category);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Newspaper className="h-6 w-6 mr-2 text-blue-600" />
              <CardTitle className="text-2xl">Live News Feed</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <CardDescription>
            Latest news from various reliable sources
          </CardDescription>
          
          {availableSources && (
            <div className="flex items-center mt-4 space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {availableSources.categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedCategory !== 'all' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedCategory('all')}
                  className="h-8 px-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          {error && (
            <div className="bg-red-50 p-4 rounded-md text-red-700 mb-4">
              {error}
              <p className="mt-2 text-sm">
                Please try again or check your internet connection.
              </p>
            </div>
          )}
          
          {availableSources && (
            <Tabs 
              defaultValue="all" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="mb-4 w-full flex justify-start overflow-x-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                {availableSources.categories.map(category => (
                  <TabsTrigger key={category} value={category}>
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value="all" className="mt-0">
                <NewsList 
                  news={news} 
                  loading={loading} 
                  formatRelativeTime={formatRelativeTime} 
                />
              </TabsContent>
              
              {availableSources.categories.map(category => (
                <TabsContent key={category} value={category} className="mt-0">
                  <NewsList 
                    news={getNewsByCategory(category)} 
                    loading={loading} 
                    formatRelativeTime={formatRelativeTime} 
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
        
        <CardFooter className="text-sm text-muted-foreground">
          <div className="w-full flex justify-between items-center">
            <div>
              Data refreshes automatically every 5 minutes
            </div>
            <div>
              {sources.length > 0 && !loading && (
                <span>Sources: {sources.join(', ')}</span>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

interface NewsListProps {
  news: NewsItem[];
  loading: boolean;
  formatRelativeTime: (dateString: string) => string;
}

function NewsList({ news, loading, formatRelativeTime }: NewsListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="mb-4">
            <CardHeader className="py-3">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            </CardHeader>
            <CardContent className="py-2">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No news articles found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {news.map((item, index) => (
        <Card key={item.guid || index} className="mb-4 hover:bg-muted/30 transition-colors">
          <CardHeader className="py-3">
            <a 
              href={item.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-start group"
            >
              <div className="flex-1">
                <CardTitle className="text-base group-hover:text-blue-600 transition-colors">
                  {item.title}
                </CardTitle>
              </div>
              <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 text-blue-600 transition-opacity" />
            </a>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {item.sourceName}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {item.category}
              </Badge>
              <div className="text-xs flex items-center text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                {formatRelativeTime(item.pubDate || item.isoDate || '')}
              </div>
            </div>
          </CardHeader>
          {item.contentSnippet && (
            <CardContent className="py-2">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.contentSnippet.replace(/\n/g, ' ')}
              </p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}