import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, ExternalLink, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface WikipediaArticle {
  title: string;
  extract: string;
  fullurl: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
}

export default function WikipediaInfo() {
  const [article, setArticle] = useState<WikipediaArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRandomArticle = async () => {
    setLoading(true);
    setError(null);
    try {
      // Using Wikipedia's API to fetch a random article
      const response = await fetch(
        "https://en.wikipedia.org/api/rest_v1/page/random/summary"
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch article: ${response.status}`);
      }
      
      const data = await response.json();
      setArticle({
        title: data.title,
        extract: data.extract,
        fullurl: data.content_urls?.desktop?.page || "",
        thumbnail: data.thumbnail
      });
      
    } catch (err: any) {
      setError(err.message || "Failed to fetch article");
      console.error("Error fetching Wikipedia article:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomArticle();
  }, []);

  const handleShowAnother = () => {
    fetchRandomArticle();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center flex items-center justify-center">
        <BookOpen className="mr-2 h-6 w-6" />
        Wikipedia Explorer
      </h1>
      
      <Card className="mx-auto max-w-3xl shadow-lg">
        <CardHeader>
          {loading ? (
            <Skeleton className="h-8 w-3/4 mb-2" />
          ) : (
            <CardTitle className="text-2xl">{article?.title}</CardTitle>
          )}
          <CardDescription>
            {loading ? (
              <Skeleton className="h-4 w-1/2" />
            ) : (
              "Discover random knowledge from Wikipedia"
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <div className="bg-red-50 p-4 rounded-md text-red-700 mb-4">
              {error}
              <p className="mt-2">
                Please try again or check your internet connection.
              </p>
            </div>
          )}
          
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : (
            <>
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  {article?.thumbnail && (
                    <TabsTrigger value="image">Image</TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="content" className="mt-0">
                  <p className="text-base leading-relaxed">
                    {article?.extract}
                  </p>
                </TabsContent>
                
                {article?.thumbnail && (
                  <TabsContent value="image" className="mt-0">
                    <div className="flex justify-center">
                      <img
                        src={article.thumbnail.source}
                        alt={article.title}
                        className="rounded-md max-h-80 object-contain"
                      />
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleShowAnother}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Show Another
          </Button>
          
          {article?.fullurl && (
            <Button 
              variant="default" 
              onClick={() => window.open(article.fullurl, "_blank")}
              disabled={loading}
            >
              Read Full Article
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
      
      <div className="mt-6 text-center text-sm text-muted-foreground">
        Content fetched from Wikipedia. Refresh or click "Show Another" to explore new topics.
      </div>
    </div>
  );
}