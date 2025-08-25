'use client'
import { useState, useEffect } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, BarChart, Bar, PieChart, Pie } from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, Users, MessageCircle, Eye, Calendar, ExternalLink, Filter, Search } from 'lucide-react'

// Enhanced mock data with more realistic influencer profiles
const mockInfluencers = [
  { 
    id: 1, 
    username: 'u/PythonPro', 
    engagement: 92, 
    topics: ['Django', 'Flask', 'AI', 'Machine Learning'], 
    subreddit: 'Python', 
    influence: 85,
    followers: 15420,
    avgUpvotes: 234,
    postsThisMonth: 28,
    verified: true,
    joinDate: '2020-03-15',
    topPost: {
      title: 'Complete Guide to Django 5.0 Performance Optimization',
      upvotes: 2340,
      comments: 156,
      url: '/r/Python/comments/abc123'
    },
    summaries: [
      "Published comprehensive guide on Django 5.0 features with practical examples",
      "Created popular Flask extension for JWT authentication used by 1.2k+ projects",
      "Hosts weekly Python community livestream with 5k+ regular viewers",
      "Maintains 3 popular GitHub repositories with combined 12k+ stars"
    ],
    activityTrend: [
      { day: 'Mon', posts: 3, engagement: 85 },
      { day: 'Tue', posts: 5, engagement: 92 },
      { day: 'Wed', posts: 2, engagement: 78 },
      { day: 'Thu', posts: 4, engagement: 88 },
      { day: 'Fri', posts: 6, engagement: 95 },
      { day: 'Sat', posts: 1, engagement: 65 },
      { day: 'Sun', posts: 2, engagement: 72 }
    ]
  },
  { 
    id: 2, 
    username: 'u/MLWizard', 
    engagement: 87, 
    topics: ['LLMs', 'Transformers', 'PyTorch', 'Research'], 
    subreddit: 'MachineLearning', 
    influence: 91,
    followers: 23100,
    avgUpvotes: 456,
    postsThisMonth: 15,
    verified: true,
    joinDate: '2019-08-22',
    topPost: {
      title: 'Breakthrough: Training LLMs on Consumer Hardware',
      upvotes: 4520,
      comments: 287,
      url: '/r/MachineLearning/comments/def456'
    },
    summaries: [
      "Developed open-source library for fine-tuning LLMs on consumer hardware",
      "Wrote benchmark comparing 15+ transformer architectures for NLP tasks",
      "Maintains popular GitHub repo with 8.4k stars for ML education resources",
      "Regular contributor to major ML conferences with 5+ published papers"
    ],
    activityTrend: [
      { day: 'Mon', posts: 2, engagement: 89 },
      { day: 'Tue', posts: 3, engagement: 91 },
      { day: 'Wed', posts: 1, engagement: 82 },
      { day: 'Thu', posts: 4, engagement: 94 },
      { day: 'Fri', posts: 2, engagement: 87 },
      { day: 'Sat', posts: 1, engagement: 75 },
      { day: 'Sun', posts: 2, engagement: 80 }
    ]
  },
  { 
    id: 3, 
    username: 'u/ReactGuru', 
    engagement: 84, 
    topics: ['Next.js', 'State Management', 'Performance', 'TypeScript'], 
    subreddit: 'reactjs', 
    influence: 78,
    followers: 18750,
    avgUpvotes: 312,
    postsThisMonth: 22,
    verified: false,
    joinDate: '2021-01-10',
    topPost: {
      title: 'React 18 Concurrent Features: Complete Deep Dive',
      upvotes: 1890,
      comments: 145,
      url: '/r/reactjs/comments/ghi789'
    },
    summaries: [
      "Authored book on React performance optimization used by enterprise teams",
      "Created widely adopted state management library with 4.2k GitHub stars",
      "Regular speaker at React conferences with 200k+ YouTube tutorial views",
      "Maintains popular React newsletter with 15k+ subscribers"
    ],
    activityTrend: [
      { day: 'Mon', posts: 4, engagement: 82 },
      { day: 'Tue', posts: 3, engagement: 86 },
      { day: 'Wed', posts: 5, engagement: 89 },
      { day: 'Thu', posts: 2, engagement: 78 },
      { day: 'Fri', posts: 3, engagement: 84 },
      { day: 'Sat', posts: 2, engagement: 79 },
      { day: 'Sun', posts: 3, engagement: 81 }
    ]
  },
  {
    id: 4,
    username: 'u/CryptoAnalyst',
    engagement: 79,
    topics: ['Bitcoin', 'DeFi', 'Blockchain', 'Trading'],
    subreddit: 'cryptocurrency',
    influence: 73,
    followers: 12300,
    avgUpvotes: 189,
    postsThisMonth: 35,
    verified: false,
    joinDate: '2020-11-03',
    topPost: {
      title: 'Why 99% of DeFi Projects Will Fail: Technical Analysis',
      upvotes: 3200,
      comments: 542,
      url: '/r/cryptocurrency/comments/jkl012'
    },
    summaries: [
      "Predicted 3 major market corrections with 85% accuracy rate",
      "Created popular DeFi risk assessment framework used by 500+ protocols",
      "Maintains detailed market analysis blog with 50k+ monthly readers",
      "Discovered and reported 12 critical smart contract vulnerabilities"
    ],
    activityTrend: [
      { day: 'Mon', posts: 6, engagement: 81 },
      { day: 'Tue', posts: 4, engagement: 77 },
      { day: 'Wed', posts: 7, engagement: 83 },
      { day: 'Thu', posts: 5, engagement: 79 },
      { day: 'Fri', posts: 3, engagement: 75 },
      { day: 'Sat', posts: 4, engagement: 76 },
      { day: 'Sun', posts: 6, engagement: 82 }
    ]
  }
]

// Color mapping for subreddits
const subredditColors: Record<string, string> = {
  Python: '#3776AB',
  MachineLearning: '#E05D44',
  reactjs: '#61DAFB',
  cryptocurrency: '#F7931A',
}

const getSubredditColor = (subreddit: string) => subredditColors[subreddit] || '#808080'

export default function InfluencerRadarPage() {
  const [selectedInfluencer, setSelectedInfluencer] = useState<typeof mockInfluencers[0] | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('influence')
  const [filterSubreddit, setFilterSubreddit] = useState('all')
  const [filteredInfluencers, setFilteredInfluencers] = useState(mockInfluencers)

  // Filter and sort logic
  useEffect(() => {
    let filtered = mockInfluencers.filter(influencer => {
      const matchesSearch = influencer.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           influencer.topics.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesSubreddit = filterSubreddit === 'all' || influencer.subreddit === filterSubreddit
      return matchesSearch && matchesSubreddit
    })

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'engagement':
          return b.engagement - a.engagement
        case 'influence':
          return b.influence - a.influence
        case 'followers':
          return b.followers - a.followers
        default:
          return 0
      }
    })

    setFilteredInfluencers(filtered)
  }, [searchTerm, sortBy, filterSubreddit])

  const handleRowClick = (influencer: typeof mockInfluencers[0]) => {
    setSelectedInfluencer(influencer)
    setIsSheetOpen(true)
  }

  const uniqueSubreddits = Array.from(new Set(mockInfluencers.map(i => i.subreddit)))

  return (
    <div className="container w-full mx-auto p-6">
      {/* Header with search and filters */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Influencer Radar</h1>
            <p className="text-muted-foreground">Track and analyze top Reddit influencers across communities</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <TrendingUp className="w-3 h-3 mr-1" />
              {filteredInfluencers.length} Active Influencers
            </Badge>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search influencers or topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterSubreddit} onValueChange={setFilterSubreddit}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by subreddit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subreddits</SelectItem>
              {uniqueSubreddits.map(subreddit => (
                <SelectItem key={subreddit} value={subreddit}>r/{subreddit}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="influence">Influence Score</SelectItem>
              <SelectItem value="engagement">Engagement Rate</SelectItem>
              <SelectItem value="followers">Follower Count</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bubble Chart Visualization */}
        <div className="lg:col-span-1">
          <Card className="rounded-2xl shadow-sm h-full">
            <CardHeader>
              <CardTitle>Influence Map</CardTitle>
              <CardDescription>Bubble size = influence, Color = community</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid />
                    <XAxis 
                      type="number" 
                      dataKey="engagement" 
                      name="Engagement Rate" 
                      domain={[70, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="influence" 
                      name="Influence Score" 
                      domain={[60, 100]}
                    />
                    <ZAxis type="number" dataKey="influence" range={[60, 400]} name="Influence" />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      formatter={(value, name) => {
                        if (name === 'username') return [value, 'Influencer']
                        if (name === 'engagement') return [`${value}%`, 'Engagement']
                        if (name === 'influence') return [`${value}`, 'Influence']
                        return [value, name]
                      }}
                    />
                    <Scatter 
                      name="Influencers" 
                      data={filteredInfluencers.map(i => ({
                        ...i,
                        fill: getSubredditColor(i.subreddit)
                      }))}
                      fill="#8884d8"
                    >
                      {filteredInfluencers.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={getSubredditColor(entry.subreddit)} 
                          onClick={() => handleRowClick(entry)}
                          className="cursor-pointer hover:opacity-80"
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-2">
                {uniqueSubreddits.map(subreddit => (
                  <div key={subreddit} className="flex items-center gap-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: getSubredditColor(subreddit) }}
                    />
                    <span className="text-xs">r/{subreddit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Leaderboard Table */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Top Influencers</CardTitle>
              <CardDescription>Click any row for detailed analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 font-medium">Influencer</th>
                      <th className="text-center py-3 font-medium">Engagement</th>
                      <th className="text-center py-3 font-medium">Influence</th>
                      <th className="text-center py-3 font-medium">Followers</th>
                      <th className="text-left py-3 font-medium">Top Topics</th>
                      <th className="text-center py-3 font-medium">Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInfluencers.map((influencer) => (
                      <tr 
                        key={influencer.id} 
                        className="border-b cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleRowClick(influencer)}
                      >
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{influencer.username}</span>
                                {influencer.verified && (
                                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground">r/{influencer.subreddit}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-semibold text-lg">{influencer.engagement}%</span>
                            <span className="text-xs text-muted-foreground">avg rate</span>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-semibold text-lg">{influencer.influence}</span>
                            <span className="text-xs text-muted-foreground">score</span>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-semibold">{influencer.followers.toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground">followers</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-wrap gap-1">
                            {influencer.topics.slice(0, 3).map((topic, index) => (
                              <span 
                                key={index} 
                                className="text-xs bg-muted px-2 py-1 rounded-full"
                              >
                                {topic}
                              </span>
                            ))}
                            {influencer.topics.length > 3 && (
                              <span className="text-xs text-muted-foreground px-2 py-1">
                                +{influencer.topics.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-semibold">{influencer.postsThisMonth}</span>
                            <span className="text-xs text-muted-foreground">posts/mo</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Influencer Detail Panel */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          {selectedInfluencer && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <SheetTitle className="text-2xl">{selectedInfluencer.username}</SheetTitle>
                  {selectedInfluencer.verified && (
                    <Badge className="bg-blue-100 text-blue-800">Verified</Badge>
                  )}
                </div>
                <SheetDescription>
                  <div className="flex gap-4 mt-2">
                    <span>Engagement: {selectedInfluencer.engagement}%</span>
                    <span>•</span>
                    <span>Influence: {selectedInfluencer.influence}</span>
                    <span>•</span>
                    <span>{selectedInfluencer.followers.toLocaleString()} followers</span>
                  </div>
                </SheetDescription>
              </SheetHeader>
              
              <div className="py-6">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="content">Top Content</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-6 mt-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                            <div>
                              <p className="text-sm text-muted-foreground">Avg Upvotes</p>
                              <p className="text-2xl font-bold">{selectedInfluencer.avgUpvotes}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-green-500" />
                            <div>
                              <p className="text-sm text-muted-foreground">Member Since</p>
                              <p className="text-sm font-semibold">
                                {new Date(selectedInfluencer.joinDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Community Presence */}
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Community Presence
                      </h3>
                      <div className="flex items-center space-x-3">
                        <Badge 
                          variant="outline" 
                          className="text-sm"
                          style={{ borderColor: getSubredditColor(selectedInfluencer.subreddit) }}
                        >
                          r/{selectedInfluencer.subreddit}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Primary community • {selectedInfluencer.postsThisMonth} posts this month
                        </span>
                      </div>
                    </div>

                    {/* Top Topics */}
                    <div>
                      <h3 className="font-semibold mb-3">Expertise Areas</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedInfluencer.topics.map((topic, index) => (
                          <Badge key={index} variant="secondary">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Key Achievements */}
                    <div>
                      <h3 className="font-semibold mb-3">Key Achievements</h3>
                      <div className="space-y-3">
                        {selectedInfluencer.summaries.map((summary, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {summary}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="activity" className="space-y-6 mt-6">
                    <div>
                      <h3 className="font-semibold mb-3">Weekly Activity Pattern</h3>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={selectedInfluencer.activityTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="posts" fill="#8884d8" name="Posts" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Engagement Trend</h3>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={selectedInfluencer.activityTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`${value}%`, 'Engagement']} />
                            <Bar dataKey="engagement" fill="#82ca9d" name="Engagement %" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="content" className="space-y-6 mt-6">
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Top Performing Post
                      </h3>
                      <Card>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <h4 className="font-medium leading-tight">
                              {selectedInfluencer.topPost.title}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {selectedInfluencer.topPost.upvotes} upvotes
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />
                                {selectedInfluencer.topPost.comments} comments
                              </span>
                            </div>
                            <Button variant="outline" size="sm" className="w-full">
                              <ExternalLink className="h-3 w-3 mr-2" />
                              View Original Post
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}