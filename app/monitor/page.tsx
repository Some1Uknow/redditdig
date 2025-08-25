'use client'
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Play, 
  Pause, 
  Square, 
  Radio, 
  AlertCircle, 
  Clock, 
  Users, 
  TrendingUp, 
  MessageCircle,
  Eye,
  Settings,
  Filter,
  Download,
  RefreshCw,
  Wifi,
  WifiOff,
  Server
} from 'lucide-react'

// Real-time monitoring data
const liveMetrics = {
  totalMonitored: 1247,
  activeStreams: 12,
  alertsTriggered: 3,
  dataProcessed: 45.7, // GB
  uptime: '99.8%',
  avgLatency: '150ms'
}

const monitoringTargets = [
  {
    id: 1,
    type: 'user',
    target: 'u/elonmusk',
    status: 'active',
    lastSeen: '2m ago',
    mentions: 23,
    subreddits: ['tesla', 'spacex', 'technology'],
    alerts: 2
  },
  {
    id: 2,
    type: 'subreddit',
    target: 'r/artificial',
    status: 'active',
    lastSeen: 'now',
    mentions: 156,
    keywords: ['GPT', 'OpenAI', 'machine learning'],
    alerts: 1
  },
  {
    id: 3,
    type: 'keyword',
    target: 'Bitcoin crash',
    status: 'paused',
    lastSeen: '15m ago',
    mentions: 89,
    subreddits: ['Bitcoin', 'cryptocurrency', 'investing'],
    alerts: 0
  },
  {
    id: 4,
    type: 'hashtag',
    target: '#ReactJS',
    status: 'error',
    lastSeen: '1h ago',
    mentions: 34,
    subreddits: ['reactjs', 'javascript', 'webdev'],
    alerts: 0
  }
]

const realtimeActivity = [
  {
    id: 1,
    timestamp: '2025-08-25T12:01:45Z',
    type: 'mention',
    target: 'u/elonmusk',
    content: 'Elon Musk announces new Tesla factory in India',
    subreddit: 'tesla',
    upvotes: 234,
    priority: 'high'
  },
  {
    id: 2,
    timestamp: '2025-08-25T12:01:32Z',
    type: 'trend',
    target: 'Bitcoin crash',
    content: 'Massive spike in Bitcoin crash mentions detected',
    subreddit: 'cryptocurrency',
    upvotes: 1567,
    priority: 'critical'
  },
  {
    id: 3,
    timestamp: '2025-08-25T12:01:18Z',
    type: 'comment',
    target: 'r/artificial',
    content: 'New GPT-5 breakthrough discussion trending',
    subreddit: 'artificial',
    upvotes: 89,
    priority: 'medium'
  }
]

const systemStatus = [
  { component: 'Reddit API', status: 'operational', latency: '120ms' },
  { component: 'Data Pipeline', status: 'operational', latency: '45ms' },
  { component: 'Alert System', status: 'degraded', latency: '230ms' },
  { component: 'Database', status: 'operational', latency: '15ms' },
  { component: 'Real-time Stream', status: 'operational', latency: '89ms' }
]

export default function LiveMonitoringPage() {
  const [isMonitoring, setIsMonitoring] = useState(true)
  const [selectedTarget, setSelectedTarget] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState('5') // seconds
  const [newTarget, setNewTarget] = useState('')
  const [targetType, setTargetType] = useState('user')
  
  // Simulate real-time updates
  const [lastUpdate, setLastUpdate] = useState(new Date())
  
  useEffect(() => {
    if (autoRefresh && isMonitoring) {
      const interval = setInterval(() => {
        setLastUpdate(new Date())
      }, parseInt(refreshInterval) * 1000)
      
      return () => clearInterval(interval)
    }
  }, [autoRefresh, isMonitoring, refreshInterval])

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring)
  }

  const addNewTarget = () => {
    if (newTarget.trim()) {
      // Logic to add new monitoring target
      console.log(`Adding new ${targetType}: ${newTarget}`)
      setNewTarget('')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'paused': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-orange-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const filteredTargets = monitoringTargets.filter(t => {
    if (selectedTarget === 'all') return true
    return t.type === selectedTarget
  })

  return (
    <div className="space-y-6 p-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Live Monitoring</h1>
          <p className="text-sm text-muted-foreground">Real-time stream of monitored Reddit activity</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label>Auto-refresh</Label>
            <Switch checked={autoRefresh} onCheckedChange={() => setAutoRefresh(!autoRefresh)} />
          </div>

          <div className="flex items-center gap-2">
            <Input value={refreshInterval} onChange={(e) => setRefreshInterval(e.target.value)} className="w-20" />
            <Button onClick={() => setLastUpdate(new Date())} variant="ghost"><RefreshCw /></Button>
            <Button onClick={() => console.log('exporting data')}><Download /></Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Live metrics snapshot</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Monitored</div>
                <div className="text-xl font-medium">{liveMetrics.totalMonitored}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Active Streams</div>
                <div className="text-xl font-medium">{liveMetrics.activeStreams}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Alerts</div>
                <Badge variant="secondary">{liveMetrics.alertsTriggered}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Data processed</span>
                <span>{liveMetrics.dataProcessed} GB</span>
              </div>
              <Progress value={Math.min(100, liveMetrics.dataProcessed)} />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div>Uptime: <span className="font-medium">{liveMetrics.uptime}</span></div>
              <div>Avg Latency: <span className="font-medium">{liveMetrics.avgLatency}</span></div>
            </div>

            <div className="text-right text-xs text-muted-foreground">Last update: {lastUpdate.toLocaleTimeString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Key components</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {systemStatus.map(s => (
              <div key={s.component} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${s.status === 'operational' ? 'bg-green-500' : s.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  <div className="text-sm">{s.component}</div>
                </div>
                <div className="text-xs text-muted-foreground">{s.latency}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Controls</CardTitle>
            <CardDescription>Manage monitoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button onClick={toggleMonitoring} variant={isMonitoring ? 'destructive' : 'default'}>
                  {isMonitoring ? <Pause className="mr-2" /> : <Play className="mr-2" />} {isMonitoring ? 'Pause' : 'Start'}
                </Button>
                <Button onClick={() => setAutoRefresh(!autoRefresh)} variant="outline">{autoRefresh ? 'Stop Auto' : 'Start Auto'}</Button>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="target-type-select" className="sr-only">Target type</Label>
                  <select id="target-type-select" value={targetType} onChange={(e) => setTargetType(e.target.value)} className="rounded-md border px-2 py-1">
                    <option value="user">User</option>
                    <option value="subreddit">Subreddit</option>
                    <option value="keyword">Keyword</option>
                    <option value="hashtag">Hashtag</option>
                  </select>
                </div>
                <Input placeholder="new target" value={newTarget} onChange={(e) => setNewTarget(e.target.value)} />
                <Button onClick={addNewTarget}>Add</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all" onClick={() => setSelectedTarget('all')}>All</TabsTrigger>
            <TabsTrigger value="user" onClick={() => setSelectedTarget('user')}>Users</TabsTrigger>
            <TabsTrigger value="subreddit" onClick={() => setSelectedTarget('subreddit')}>Subreddits</TabsTrigger>
            <TabsTrigger value="keyword" onClick={() => setSelectedTarget('keyword')}>Keywords</TabsTrigger>
            <TabsTrigger value="hashtag" onClick={() => setSelectedTarget('hashtag')}>Hashtags</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTarget}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Monitoring Targets</CardTitle>
                  <CardDescription>Filtered: {selectedTarget}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filteredTargets.map(t => (
                    <div key={t.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className={`inline-block h-3 w-3 rounded-full ${getStatusColor(t.status)}`} />
                          <div className="font-medium">{t.target}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">{t.lastSeen} • {t.mentions} mentions</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{t.type}</Badge>
                        <Button size="sm" variant="ghost"><Eye /></Button>
                        <Button size="sm" variant="ghost"><Settings /></Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Realtime Activity</CardTitle>
                  <CardDescription>Recent items from the stream</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {realtimeActivity.map(a => (
                    <div key={a.id} className="p-2 border rounded-md">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-medium">{a.content}</div>
                          <div className="text-xs text-muted-foreground">{a.subreddit} • {new Date(a.timestamp).toLocaleTimeString()}</div>
                        </div>
                        <div className={`text-xs ${getPriorityColor(a.priority)}`}>{a.priority}</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}