'use client'
import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Mock API data structure - replace with actual API data later
const mockApis = [
  {
    id: 1,
    name: 'Reddit Search API',
    endpoint: '/api/search',
    description: 'Search Reddit posts and comments with advanced filtering',
    mockResponse: {
      posts: [
        {
          id: 't3_abc123',
          title: 'How to use Reddit Search API',
          subreddit: 'learnprogramming',
          upvotes: 1245,
          comments: 89,
          timestamp: '2025-08-25T10:30:00Z'
        }
      ],
      total: 1,
      page: 1,
      limit: 10
    }
  },
  {
    id: 2,
    name: 'Trend Alerts API',
    endpoint: '/api/trends',
    description: 'Get real-time trend alerts for keywords and subreddits',
    mockResponse: {
      trends: [
        {
          keyword: 'AI Agents',
          mentions: 2450,
          growth: 240,
          subreddits: ['MachineLearning', 'ArtificialIntelligence', 'AI']
        }
      ],
      lastUpdated: '2025-08-25T12:00:00Z'
    }
  },
  {
    id: 3,
    name: 'Influencer Radar API',
    endpoint: '/api/influencers',
    description: 'Discover top influencers and their engagement metrics',
    mockResponse: {
      influencers: [
        {
          username: 'u/PythonPro',
          engagement: 92,
          influence: 85,
          topics: ['Django', 'Flask', 'AI'],
          subreddit: 'Python'
        }
      ],
      total: 1,
      page: 1
    }
  }
]

export default function DeveloperPage() {
  const [copiedApi, setCopiedApi] = useState<number | null>(null)

  const copyApiKey = () => {
    navigator.clipboard.writeText('sk_redditdig_7d3f2e1a9b8c4a6d')
    setCopiedApi(0)
    setTimeout(() => setCopiedApi(null), 2000)
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Developer Dashboard</h1>
          <p className="text-muted-foreground">Access our powerful APIs for Reddit analytics</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">10k</div>
          <div className="text-sm text-muted-foreground">API calls this month</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockApis.map((api) => (
          <Card key={api.id} className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>{api.name}</CardTitle>
              <CardDescription>{api.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Endpoint</div>
                <div className="text-sm bg-muted p-2 rounded font-mono break-all">
                  {api.endpoint}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Mock Response</div>
                <div className="text-xs bg-muted p-2 rounded font-mono overflow-x-auto max-h-32">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(api.mockResponse, null, 2)}</pre>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={copyApiKey}
              >
                {copiedApi === 0 ? 'API Key Copied!' : 'Copy API Key'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
