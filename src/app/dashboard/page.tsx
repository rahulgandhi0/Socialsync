import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, CheckCircle } from 'react-feather';
import { supabase } from '@/lib/supabase';

async function getScheduledPosts() {
  const { data, error } = await supabase
    .from('scheduled_posts')
    .select('*')
    .order('scheduled_time', { ascending: true });

  if (error) throw error;
  return data;
}

async function getPreviousPosts() {
  const { data, error } = await supabase
    .from('posted_content')
    .select('*')
    .order('posted_at', { ascending: false });

  if (error) throw error;
  return data;
}

export default async function DashboardPage() {
  const [scheduledPosts, previousPosts] = await Promise.all([
    getScheduledPosts(),
    getPreviousPosts(),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Content Dashboard</h1>
        <button
          onClick={() => window.location.href = '/create'}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create New Post
        </button>
      </div>

      <Tabs defaultValue="scheduled" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Scheduled Posts
          </TabsTrigger>
          <TabsTrigger value="previous" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Posted Content
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scheduledPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <img
                  src={post.media_url}
                  alt={post.caption}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <p className="text-sm text-gray-500 flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4" />
                    {new Date(post.scheduled_time).toLocaleString()}
                  </p>
                  <p className="text-gray-700 line-clamp-2">{post.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="previous">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {previousPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <img
                  src={post.media_url}
                  alt={post.caption}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <p className="text-sm text-gray-500 flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4" />
                    Posted on {new Date(post.posted_at).toLocaleDateString()}
                  </p>
                  <p className="text-gray-700 line-clamp-2">{post.caption}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {post.likes} likes • {post.comments} comments
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 