import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Instagram, Heart, MessageCircle, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

interface InstagramPost {
  id: string;
  media_type?: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  caption?: string;
  timestamp?: string;
  permalink: string;
  likes?: number;
  comments?: number;
}

interface InstagramFeedProps {
  className?: string;
  maxPosts?: number;
}

export default function InstagramFeed({ className = '', maxPosts = 6 }: InstagramFeedProps) {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string>('');

  useEffect(() => {
    fetchInstagramPosts();
  }, [maxPosts]);

  const fetchInstagramPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/instagram-feed?limit=${maxPosts}`);
      const data = await response.json();

      if (data.success) {
        setPosts(data.data);
        setDataSource(data.source);
        console.log(`Instagram data loaded from: ${data.source}`);
      } else {
        throw new Error(data.error || 'Failed to fetch Instagram data');
      }
    } catch (err: any) {
      console.error('Error fetching Instagram posts:', err);
      setError(err.message);

      // Fallback to empty array or you could set fallback posts here
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const truncateCaption = (caption: string, maxLength: number = 80) => {
    if (caption.length <= maxLength) return caption;
    return caption.substring(0, maxLength) + '...';
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Instagram className="w-8 h-8 text-roam-blue" />
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            Follow Our Journey
          </h2>
        </div>
        <p className="text-xl text-foreground/70 max-w-2xl mx-auto mb-6">
          Stay connected with ROAM on Instagram for the latest updates, client transformations, and behind-the-scenes content.
        </p>
        <Button
          asChild
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-3"
        >
          <a
            href="https://www.instagram.com/roam_yourbestlife/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <Instagram className="w-5 h-5" />
            Follow @roam_yourbestlife
            <ExternalLink className="w-4 h-4" />
          </a>
        </Button>
      </div>

      {/* Instagram Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Card 
            key={post.id} 
            className="overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300 border-border/50"
          >
            <div className="relative">
              <img
                src={post.image}
                alt="Instagram post"
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="flex items-center justify-center gap-6 mb-3">
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5" />
                      <span className="font-semibold">{post.likes}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-semibold">{post.comments}</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium">View on Instagram</p>
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <p className="text-sm text-foreground/80 leading-relaxed">
                {truncateCaption(post.caption)}
              </p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center gap-4 text-sm text-foreground/60">
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span>{post.likes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{post.comments}</span>
                  </div>
                </div>
                <a
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-roam-blue hover:text-roam-blue/80 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Call to Action */}
      <div className="text-center mt-12">
        <p className="text-foreground/70 mb-4">
          Want to see more? Check out our full Instagram profile!
        </p>
        <Button
          asChild
          variant="outline"
          className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
        >
          <a
            href="https://www.instagram.com/roam_yourbestlife/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            View More Posts
            <ExternalLink className="w-4 h-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}
