import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wand2, Loader2 } from 'lucide-react';

/**
 * Isolated OpenAI Test Component
 * This completely bypasses all base44 entities and hooks to test OpenAI directly
 */
export default function TestOpenAI() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testOpenAI = async () => {
    setIsGenerating(true);
    setResult(null);
    setError(null);

    console.log('=== STARTING ISOLATED OPENAI TEST ===');

    try {
      // Get API key directly from environment
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

      console.log('API Key Check:', {
        hasKey: !!apiKey,
        keyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING'
      });

      if (!apiKey) {
        throw new Error('VITE_OPENAI_API_KEY not found in environment');
      }

      const prompt = "Write a short business plan for a coffee shop in 2 paragraphs.";

      console.log('Making direct OpenAI API call...');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a business consultant. Write clear, concise responses.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      console.log('OpenAI Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI Error:', errorData);
        throw new Error(`OpenAI API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('OpenAI Success:', {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length,
        usage: data.usage
      });

      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content returned from OpenAI');
      }

      setResult(content);
      console.log('=== OPENAI TEST SUCCESSFUL ===');

    } catch (err) {
      console.error('=== OPENAI TEST FAILED ===', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Isolated OpenAI Test</CardTitle>
          <p className="text-sm text-gray-600">
            This test bypasses all base44 entities and hooks to test OpenAI directly.
          </p>
        </CardHeader>
        <CardContent>
          <Button
            onClick={testOpenAI}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing OpenAI...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Test OpenAI Direct Connection
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">❌ Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-red-700 whitespace-pre-wrap bg-red-50 p-4 rounded">
              {error}
            </pre>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-600">✅ Success</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm bg-green-50 p-4 rounded whitespace-pre-wrap">
              {result}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>🔍 Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs space-y-2">
            <div>
              <strong>Environment Variables:</strong>
              <div>VITE_OPENAI_API_KEY: {import.meta.env.VITE_OPENAI_API_KEY ? '✅ Present' : '❌ Missing'}</div>
            </div>
            <div>
              <strong>Console:</strong> Check browser console for detailed logs
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}