import React from 'react';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PostAnalytics } from '../services/analytics';
import { Loader2, Calendar, TrendingUp, Users, Clock, Award } from 'lucide-react';
import { useAnalytics } from '../context/AnalyticsContext';

const timeRangeOptions = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

export default function AnalyticsDashboard() {
  const { summary, timeRange, loading, error, setTimeRange, refreshAnalytics } = useAnalytics();

  const handleTimeRangeChange = (days: number) => {
    setTimeRange({
      start: subDays(new Date(), days),
      end: new Date(),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Instagram Analytics</h1>
        <p className="text-gray-600 mt-2">Track your Instagram post performance and engagement</p>
      </div>

      {/* Time Range Selector */}
      <div className="mb-8 flex items-center space-x-4">
        <Calendar className="w-5 h-5 text-gray-500" />
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

      {summary && (
        <>
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
        </>
      )}
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
            {format(new Date(post.publish_time), 'MMM d, yyyy')}
          </span>
          <span className="text-sm font-medium text-purple-600">
            {(post.metrics?.engagement_rate || 0 * 100).toFixed(2)}% Engagement
          </span>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>❤️ {post.metrics?.likes || 0}</span>
          <span>💬 {post.metrics?.comments || 0}</span>
          <span>🔄 {post.metrics?.shares || 0}</span>
        </div>
      </div>
    </div>
  );
} 