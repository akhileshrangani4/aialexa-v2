import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Welcome to AIAlexa
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Create intelligent AI chatbots powered by your course materials
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Upload Materials</CardTitle>
              <CardDescription>
                Upload PDFs, Word docs, and more
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Support for multiple file formats with automatic text extraction
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI-Powered</CardTitle>
              <CardDescription>
                Choose from 4 open-source models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Powered by state-of-the-art language models via OpenRouter
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Share & Analytics</CardTitle>
              <CardDescription>
                Share chatbots and track usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Generate shareable links and view anonymous conversation analytics
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/register">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Login</Link>
          </Button>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          Accounts require admin approval. Academic email addresses preferred.
        </p>
      </div>
    </div>
  );
}
