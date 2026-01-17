const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface WordRecommendationRequest {
  length: number;
  constraints: { position: number; char: string }[];
}

export async function fetchWordRecommendations(
  request: WordRecommendationRequest
): Promise<string[]> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    console.warn('OpenRouter API key not configured');
    return [];
  }

  const constraintText =
    request.constraints.length > 0
      ? request.constraints
          .map((c) => `${c.position + 1}번째 글자는 '${c.char}'`)
          .join(', ')
      : '제약 조건 없음';

  const prompt = `다음 조건에 맞는 한국어 단어 10개를 추천해주세요:
- 글자 수: ${request.length}글자
- 포함 조건: ${constraintText}

규칙:
1. 일반적으로 사용되는 한국어 단어만 추천
2. 고유명사, 브랜드명, 외래어 제외
3. 비속어, 은어 제외
4. 각 단어는 정확히 ${request.length}글자여야 함

형식: 단어만 줄바꿈으로 구분하여 출력 (번호, 설명 없이)`;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    const words = content
      .split('\n')
      .map((line: string) => line.trim())
      .filter((word: string) => word.length === request.length)
      .slice(0, 10);

    return words;
  } catch (error) {
    console.error('Failed to fetch word recommendations:', error);
    return [];
  }
}
