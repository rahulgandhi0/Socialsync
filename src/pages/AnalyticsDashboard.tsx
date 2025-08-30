import React from 'react';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PostAnalytics } from '../services/analytics';
import { Loader2, Calendar, TrendingUp, Users, Award, Instagram, RefreshCw } from 'lucide-react';
import { useAnalytics } from '../context/AnalyticsContext';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon } from 'react-feather';

const timeRangeOptions = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

export default function AnalyticsDashboard() {
  const { summary, timeRange, loading, error, upcomingPosts, setTimeRange, refreshAnalytics } = useAnalytics();
  const [isInstagramConnected, setIsInstagramConnected] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkInstagramConnection() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: account } = await supabase
          .from('instagram_accounts')
          .select('instagram_username')
          .eq('user_id', user.id)
          .single();
        
        setIsInstagramConnected(!!account);
      }
    }
    
    checkInstagramConnection();
  }, []);

  const handleTimeRangeChange = (days: number) => {
    setTimeRange({
      start: subDays(new Date(), days),
      end: new Date(),
    });
  };

  if (loading || isInstagramConnected === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!isInstagramConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Instagram className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Connect Instagram First</h2>
          <p className="text-gray-600 mb-6">
            To view your analytics, you need to connect your Instagram Business Account first.
          </p>
          <Link
            to="/instagram/connect"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            Connect Instagram
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={refreshAnalytics}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!summary || !summary.total_posts) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No Analytics Data Yet</h2>
          <p className="text-gray-600 mb-6">
            Start creating and publishing posts to see your analytics here. Analytics data will appear after your posts start getting engagement.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            Create Your First Post
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Refresh Button */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Instagram Analytics</h1>
          <p className="text-gray-600 mt-2">Track your Instagram post performance and engagement</p>
        </div>
        <button
          onClick={refreshAnalytics}
          className="p-2 text-gray-600 hover:text-purple-600 rounded-full hover:bg-purple-50 transition-colors"
          aria-label="Refresh analytics"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Upcoming Posts Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Upcoming Posts</h2>
          <Link
            to="/create"
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Schedule New Post
          </Link>
        </div>
        {upcomingPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingPosts.map((post) => (
              <div key={post.id} className="bg-gray-50 rounded-lg overflow-hidden">
                {post.media_urls && post.media_urls[0] && (
                  <img
                    src={post.media_urls[0]}
                    alt="Post preview"
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">
                      {format(new Date(post.scheduled_time), 'MMM d, yyyy h:mm a')}
                    </span>
                    <span className="text-sm font-medium text-purple-600">
                      Scheduled
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm line-clamp-2">{post.caption}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No upcoming posts scheduled</p>
            <Link
              to="/create"
              className="text-purple-600 hover:text-purple-700 font-medium mt-2 inline-block"
            >
              Create your first post
            </Link>
          </div>
        )}
      </div>

      {/* Time Range Selector */}
      <div className="mb-8 flex items-center space-x-4">
        <CalendarIcon className="w-5 h-5 text-gray-500" />
        <div className="flex space-x-2">
          {timeRangeOptions.map(option => (
            <button
              key={option.days}
              onClick={() => handleTimeRangeChange(option.days)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange.start.getTime() === subDays(new Date(), option.days).getTime()
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Posts"
          value={summary.total_posts}
          icon={<TrendingUp className="w-6 h-6" />}
          description="Posts published in selected period"
        />
        <MetricCard
          title="Average Engagement"
          value={`${(summary.average_engagement_rate * 100).toFixed(2)}%`}
          icon={<Users className="w-6 h-6" />}
          description="Average engagement rate per post"
        />
        <MetricCard
          title="Total Reach"
          value={summary.total_reach.toLocaleString()}
          icon={<Users className="w-6 h-6" />}
          description="Unique accounts that saw your posts"
        />
        <MetricCard
          title="Success Rate"
          value={`${((summary.successful_posts / summary.total_posts) * 100).toFixed(2)}%`}
          icon={<Award className="w-6 h-6" />}
          description="Successfully published posts"
        />
      </div>

      {/* Posting Time Distribution */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Best Posting Times</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={Object.entries(summary.posting_time_distribution).map(([hour, count]) => ({
              hour: format(new Date().setHours(parseInt(hour)), 'ha'),
              posts: count,
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="posts" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Best Performing Posts */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Top Performing Posts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {summary.best_performing_posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
}

function MetricCard({ title, value, icon, description }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        <div className="text-purple-600">{icon}</div>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}

function PostCard({ post }: { post: PostAnalytics }) {
  return (
    <div className="bg-gray-50 rounded-lg overflow-hidden">
      {post.media_urls && post.media_urls[0] && (
        <img
          src={post.media_urls[0]}
          alt="Post thumbnail"
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">
            {format(new Date(post.posted_at), 'MMM d, yyyy')}
          </span>
          <span className="text-sm font-medium text-purple-600">
            {(post.engagement_rate || 0).toFixed(2)}% Engagement
          </span>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>❤️ {post.likes || 0}</span>
          <span>💬 {post.comments || 0}</span>
          <span>🔄 {post.shares || 0}</span>
        </div>
      </div>
    </div>
  );
} 