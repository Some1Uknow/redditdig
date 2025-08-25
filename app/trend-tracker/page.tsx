"use client";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Bell,
  MessageCircle,
  Users,
  Clock,
  Hash,
  Globe,
  Zap,
} from "lucide-react";

// Enhanced mock data
const mockPosts = [
  {
    id: 1,
    title: "OpenAI announces GPT-5 with breakthrough reasoning capabilities",
    subreddit: "artificial",
    upvotes: 4205,
    comments: 567,
    timestamp: "2m ago",
    sentiment: "positive",
    velocity: "high",
    author: "u/AIResearcher",
    keywords: ["GPT-5", "OpenAI", "AI", "reasoning"],
  },
  {
    id: 2,
    title: "Tesla stock plummets after Musk's controversial interview",
    subreddit: "stocks",
    upvotes: 2892,
    comments: 891,
    timestamp: "15m ago",
    sentiment: "negative",
    velocity: "very_high",
    author: "u/MarketWatch",
    keywords: ["Tesla", "Musk", "stocks", "interview"],
  },
  {
    id: 3,
    title: "React 19 Beta: Revolutionary changes to state management",
    subreddit: "reactjs",
    upvotes: 1431,
    comments: 234,
    timestamp: "23m ago",
    sentiment: "positive",
    velocity: "medium",
    author: "u/ReactCore",
    keywords: ["React", "state management", "beta", "React 19"],
  },
  {
    id: 4,
    title: "Bitcoin breaks $100k barrier amid institutional adoption",
    subreddit: "Bitcoin",
    upvotes: 8934,
    comments: 1203,
    timestamp: "1h ago",
    sentiment: "very_positive",
    velocity: "extreme",
    author: "u/CryptoBull",
    keywords: ["Bitcoin", "BTC", "$100k", "institutional"],
  },
];

const mockChartData = [
  { time: "00:00", mentions: 24, sentiment: 65, volume: 120 },
  { time: "04:00", mentions: 32, sentiment: 72, volume: 180 },
  { time: "08:00", mentions: 45, sentiment: 58, volume: 290 },
  { time: "12:00", mentions: 67, sentiment: 81, volume: 450 },
  { time: "16:00", mentions: 89, sentiment: 77, volume: 620 },
  { time: "20:00", mentions: 76, sentiment: 84, volume: 510 },
];

const trendingTopics = [
  { keyword: "AI Agents", mentions: 2450, growth: 240, color: "#3B82F6" },
  { keyword: "Tesla Stock", mentions: 1890, growth: -15, color: "#EF4444" },
  { keyword: "React 19", mentions: 1234, growth: 180, color: "#10B981" },
  { keyword: "Bitcoin $100k", mentions: 5670, growth: 320, color: "#F59E0B" },
  { keyword: "OpenAI GPT-5", mentions: 3210, growth: 450, color: "#8B5CF6" },
];

const subredditActivity = [
  { name: "artificial", mentions: 890, growth: 45 },
  { name: "stocks", mentions: 756, growth: -12 },
  { name: "reactjs", mentions: 654, growth: 23 },
  { name: "Bitcoin", mentions: 1203, growth: 89 },
  { name: "MachineLearning", mentions: 543, growth: 67 },
];

const alertHistory = [
  {
    id: 1,
    keyword: "OpenAI GPT-5",
    trigger: "Mention spike > 500/hour",
    timestamp: "2025-08-25T10:30:00Z",
    severity: "high",
    handled: false,
  },
  {
    id: 2,
    keyword: "Tesla stock crash",
    trigger: "Negative sentiment > 80%",
    timestamp: "2025-08-25T09:15:00Z",
    severity: "critical",
    handled: true,
  },
  {
    id: 3,
    keyword: "React 19 beta",
    trigger: "Trending in r/reactjs",
    timestamp: "2025-08-25T08:45:00Z",
    severity: "medium",
    handled: true,
  },
];

export default function TrendTrackerPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [timeRange, setTimeRange] = useState("24h");
  const [alertPreferences, setAlertPreferences] = useState({
    email: true,
    telegram: false,
    sms: false,
  });
  const [selectedMetric, setSelectedMetric] = useState("mentions");
  const [trackedKeywords, setTrackedKeywords] = useState([
    "AI",
    "Bitcoin",
    "Tesla",
    "React",
  ]);

  const toggleAlert = (type: keyof typeof alertPreferences) => {
    setAlertPreferences((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const addKeyword = () => {
    if (searchTerm && !trackedKeywords.includes(searchTerm)) {
      setTrackedKeywords([...trackedKeywords, searchTerm]);
      setSearchTerm("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setTrackedKeywords(trackedKeywords.filter((k) => k !== keyword));
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "very_positive":
        return "text-green-600 bg-green-100";
      case "positive":
        return "text-green-600 bg-green-50";
      case "neutral":
        return "text-gray-600 bg-gray-100";
      case "negative":
        return "text-red-600 bg-red-50";
      case "very_negative":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getVelocityIcon = (velocity: string) => {
    switch (velocity) {
      case "extreme":
        return <Zap className="h-3 w-3 text-red-500" />;
      case "very_high":
        return <TrendingUp className="h-3 w-3 text-orange-500" />;
      case "high":
        return <TrendingUp className="h-3 w-3 text-yellow-500" />;
      case "medium":
        return <TrendingUp className="h-3 w-3 text-blue-500" />;
      default:
        return <TrendingUp className="h-3 w-3 text-gray-500" />;
    }
  };

  return (
    <div className="container w-full mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Trend Tracker</h1>
            <p className="text-muted-foreground">
              Monitor real-time trends and get instant alerts
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Globe className="w-3 h-3 mr-1" />
              Live Monitoring
            </Badge>
            <Badge variant="outline">
              {trackedKeywords.length} Keywords Tracked
            </Badge>
          </div>
        </div>

        {/* Keyword Management */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Tracked Keywords</CardTitle>
            <CardDescription>
              Add keywords and topics to monitor across Reddit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Enter keyword or topic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addKeyword()}
                className="flex-1"
              />
              <Button onClick={addKeyword} disabled={!searchTerm}>
                <Hash className="h-4 w-4 mr-2" />
                Track
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {trackedKeywords.map((keyword, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-sm py-1 px-3 cursor-pointer hover:bg-red-100 hover:text-red-800"
                  onClick={() => removeKeyword(keyword)}
                >
                  {keyword} ×
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Alerts */}
        {alertHistory.some((alert) => !alert.handled) && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>
                {alertHistory.filter((alert) => !alert.handled).length} active
                alerts
              </strong>{" "}
              require your attention
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trending">Trending Now</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Feed */}
            <div className="lg:col-span-1">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Live Feed
                  </CardTitle>
                  <CardDescription>
                    Real-time posts matching your keywords
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
                  {mockPosts.map((post) => (
                    <div key={post.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getVelocityIcon(post.velocity)}
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getSentimentColor(
                              post.sentiment
                            )}`}
                          >
                            {post.sentiment.replace("_", " ")}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {post.timestamp}
                        </span>
                      </div>

                      <h3 className="font-medium text-sm leading-tight mb-2">
                        {post.title}
                      </h3>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-xs bg-muted px-2 py-1 rounded-full">
                            r/{post.subreddit}
                          </span>
                          <span className="text-muted-foreground">
                            by {post.author}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center mt-2 space-x-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {post.upvotes.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {post.comments}
                        </span>
                      </div>

                      {/* Keywords */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {post.keywords.slice(0, 3).map((keyword, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-blue-50 text-blue-700 px-1 py-0.5 rounded"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="lg:col-span-2 space-y-6">
              {/* Main Chart */}
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Trend Analysis</CardTitle>
                      <CardDescription className="text-2xl font-bold text-green-600 mt-1">
                        {selectedMetric === "mentions"
                          ? "Mentions up 240%"
                          : selectedMetric === "sentiment"
                          ? "Sentiment: 77% positive"
                          : "Volume up 180%"}{" "}
                        this week
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Select
                        value={selectedMetric}
                        onValueChange={setSelectedMetric}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mentions">Mentions</SelectItem>
                          <SelectItem value="sentiment">Sentiment</SelectItem>
                          <SelectItem value="volume">Volume</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1h">1h</SelectItem>
                          <SelectItem value="24h">24h</SelectItem>
                          <SelectItem value="7d">7d</SelectItem>
                          <SelectItem value="30d">30d</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      {selectedMetric === "mentions" ? (
                        <AreaChart data={mockChartData}>
                          <defs>
                            <linearGradient
                              id="mentionsGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#2563eb"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="#2563eb"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="mentions"
                            stroke="#2563eb"
                            strokeWidth={3}
                            fill="url(#mentionsGradient)"
                          />
                        </AreaChart>
                      ) : selectedMetric === "sentiment" ? (
                        <LineChart data={mockChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip
                            formatter={(value) => [
                              `${value}%`,
                              "Sentiment Score",
                            ]}
                          />
                          <Line
                            type="monotone"
                            dataKey="sentiment"
                            stroke="#10B981"
                            strokeWidth={3}
                            dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                          />
                        </LineChart>
                      ) : (
                        <BarChart data={mockChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="volume" fill="#F59E0B" />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Subreddit Activity */}
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle>Top Active Subreddits</CardTitle>
                  <CardDescription>
                    Communities with highest mention volume
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {subredditActivity.map((subreddit, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium">r/</span>
                          </div>
                          <div>
                            <div className="font-medium">
                              r/{subreddit.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {subreddit.mentions} mentions
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={
                            subreddit.growth > 0 ? "default" : "destructive"
                          }
                          className="flex items-center gap-1"
                        >
                          {subreddit.growth > 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {Math.abs(subreddit.growth)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trending" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trending Keywords */}
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Trending Keywords
                </CardTitle>
                <CardDescription>
                  Most mentioned topics in the last 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trendingTopics.map((topic, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: topic.color }}
                        />
                        <div>
                          <div className="font-medium">{topic.keyword}</div>
                          <div className="text-sm text-muted-foreground">
                            {topic.mentions.toLocaleString()} mentions
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={topic.growth > 0 ? "default" : "destructive"}
                        className="flex items-center gap-1"
                      >
                        {topic.growth > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(topic.growth)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trending Distribution */}
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Mention Distribution</CardTitle>
                <CardDescription>
                  Share of total mentions by keyword
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={trendingTopics}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="mentions"
                        label={({ keyword, percent }) =>
                          `${keyword} (${((percent ?? 0) * 100).toFixed(1)}%)`
                        }
                      >
                        {trendingTopics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          value.toLocaleString(),
                          "Mentions",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alert History
              </CardTitle>
              <CardDescription>Recent alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alertHistory.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${
                      alert.handled
                        ? "bg-muted/20"
                        : "bg-orange-50 border-orange-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={
                              alert.severity === "critical"
                                ? "destructive"
                                : alert.severity === "high"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {alert.severity}
                          </Badge>
                          <span className="font-medium">{alert.keyword}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.trigger}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                      {!alert.handled && (
                        <Button size="sm" variant="outline">
                          Mark as Handled
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Alert Preferences</CardTitle>
              <CardDescription>
                Configure how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center space-x-3">
                  <Switch
                    id="email"
                    checked={alertPreferences.email}
                    onCheckedChange={() => toggleAlert("email")}
                  />
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <span>📧 Email Alerts</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Switch
                    id="telegram"
                    checked={alertPreferences.telegram}
                    onCheckedChange={() => toggleAlert("telegram")}
                  />
                  <Label htmlFor="telegram" className="flex items-center gap-2">
                    <span>✈️ Telegram</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Switch
                    id="sms"
                    checked={alertPreferences.sms}
                    onCheckedChange={() => toggleAlert("sms")}
                  />
                  <Label htmlFor="sms" className="flex items-center gap-2">
                    <span>📱 SMS Alerts</span>
                  </Label>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Preferences</Button>
            </CardFooter>
          </Card>

          {/* Threshold Settings */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Alert Thresholds</CardTitle>
              <CardDescription>
                Set custom thresholds for different alert types
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">
                    Mention Spike Threshold
                  </Label>
                  <Input type="number" placeholder="500" className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Alert when mentions/hour exceed this number
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    Sentiment Threshold
                  </Label>
                  <Input type="number" placeholder="80" className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Alert when negative sentiment exceeds this %
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    Growth Rate Threshold
                  </Label>
                  <Input type="number" placeholder="200" className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Alert when growth exceeds this %
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    Upvote Threshold
                  </Label>
                  <Input type="number" placeholder="1000" className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Alert when post upvotes exceed this number
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Update Thresholds</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
