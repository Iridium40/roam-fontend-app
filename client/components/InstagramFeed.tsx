import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Instagram, Heart, MessageCircle, ExternalLink } from 'lucide-react';

// Mock Instagram data for demo purposes (replace with real Instagram API when available)
const mockInstagramPosts = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop',
    caption: 'Transform your look with our amazing beauty services! ✨ #ROAMBeauty #GlowUp',
    likes: 127,
    comments: 12,
    permalink: 'https://www.instagram.com/roam_yourbestlife/'
  },
  {
    id: '2', 
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
    caption: 'Fitness goals achieved with our certified trainers 💪 #ROAMFitness #HealthyLifestyle',
    likes: 89,
    comments: 8,
    permalink: 'https://www.instagram.com/roam_yourbestlife/'
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=400&fit=crop', 
    caption: 'Wellness Wednesday: Find your inner peace with our meditation experts 🧘‍♀️ #ROAMWellness',
    likes: 156,
    comments: 15,
    permalink: 'https://www.instagram.com/roam_yourbestlife/'
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop',
    caption: 'Home organization made easy! Our lifestyle experts can help ✨ #ROAMLifestyle #OrganizedHome',
    likes: 203,
    comments: 24,
    permalink: 'https://www.instagram.com/roam_yourbestlife/'
  },
  {
    id: '5',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop',
    caption: 'Behind the scenes with our amazing service providers! 👥 #ROAMTeam #BehindTheScenes',
    likes: 78,
    comments: 6,
    permalink: 'https://www.instagram.com/roam_yourbestlife/'
  },
  {
    id: '6',
    image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=400&fit=crop',
    caption: 'Client transformation Tuesday! Another happy ROAM customer 🌟 #ROAMResults #Transformation',
    likes: 342,
    comments: 31,
    permalink: 'https://www.instagram.com/roam_yourbestlife/'
  }
];

interface InstagramFeedProps {
  className?: string;
  maxPosts?: number;
}

export default function InstagramFeed({ className = '', maxPosts = 6 }: InstagramFeedProps) {
  const posts = mockInstagramPosts.slice(0, maxPosts);

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
