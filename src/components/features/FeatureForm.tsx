import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Save, Loader2, Mic, MicOff } from 'lucide-react';
import type {
  AIFeatureFormData,
  FeatureStage,
  AIType,
  ModelSource,
  AutonomyLevel,
  UserDataType,
  TargetUser,
  ImpactType,
} from '@/types/governance';

interface FeatureFormProps {
  data: AIFeatureFormData;
  onChange: (data: AIFeatureFormData) => void;
  onSubmit: (runAssessment: boolean) => void;
  isSubmitting?: boolean;
}

type VoiceQuestion = {
  prompt: string;
  apply: (answer: string, base: AIFeatureFormData) => AIFeatureFormData;
};

type ConversationMessage = {
  speaker: 'Andrew' | '使用者';
  text: string;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEvent = {
  results: {
    [index: number]: {
      isFinal: boolean;
      0: { transcript: string };
    };
    length: number;
  };
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const stages: FeatureStage[] = ['Idea', 'In Development', 'Beta', 'Live'];
const aiTypes: AIType[] = ['LLM feature', 'Recommendation-Ranking', 'Classification-Detection', 'Other'];
const modelSources: ModelSource[] = ['Internal model', 'External API', 'Open-source self-hosted'];
const autonomyLevels: AutonomyLevel[] = ['Suggestion only', 'Human reviews output', 'Fully automated'];

const userDataTypes: UserDataType[] = [
  'none',
  'account info',
  'user-generated content',
  'sensitive: health/financial/identity',
  'internal confidential',
  'public',
];

const targetUsers: TargetUser[] = [
  'internal employees',
  'general users',
  'enterprise customers',
  'minors',
];

const impactTypes: ImpactType[] = [
  'affects eligibility/access',
  'financial outcomes',
  'content visibility/moderation',
  'none',
];

function normalize(text: string) {
  return text.trim().toLowerCase();
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function parseYesNo(text: string, fallback: boolean) {
  const normalized = normalize(text);
  if (includesAny(normalized, ['no', 'nope', 'false', '否', '沒有', '不會', '不用'])) return false;
  if (includesAny(normalized, ['yes', 'yep', 'true', '是', '有', '會', '需要'])) return true;
  return fallback;
}

function parseSingleChoice<T extends string>(
  text: string,
  options: Array<{ value: T; keywords: string[] }>,
  fallback: T
) {
  const normalized = normalize(text);
  const matched = options.find((option) => includesAny(normalized, option.keywords));
  return matched ? matched.value : fallback;
}

function parseMultiChoice<T extends string>(
  text: string,
  options: Array<{ value: T; keywords: string[] }>,
  fallback: T[]
) {
  const normalized = normalize(text);
  if (includesAny(normalized, ['none', '無', '沒有'])) {
    const noneOption = options.find((option) => option.value === 'none');
    return noneOption ? [noneOption.value] : [];
  }

  const selected = options
    .filter((option) => includesAny(normalized, option.keywords))
    .map((option) => option.value);

  return selected.length > 0 ? Array.from(new Set(selected)) : fallback;
}

export function FeatureForm({ data, onChange, onSubmit, isSubmitting }: FeatureFormProps) {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [latestTranscript, setLatestTranscript] = useState('');
  const [voiceQuestionIndex, setVoiceQuestionIndex] = useState(0);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);

  const dataRef = useRef(data);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const shouldContinueRef = useRef(false);
  const askedQuestionRef = useRef(-1);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const updateField = <K extends keyof AIFeatureFormData>(
    field: K,
    value: AIFeatureFormData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  const toggleArrayItem = <T extends string>(
    field: 'user_data_types' | 'target_users' | 'impact_types',
    value: T
  ) => {
    const current = data[field] as T[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...data, [field]: updated });
  };

  const updateSafeguard = (key: keyof AIFeatureFormData['safeguards'], value: boolean) => {
    onChange({
      ...data,
      safeguards: { ...data.safeguards, [key]: value },
    });
  };

  const speakAsAndrew = useCallback((text: string) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-TW';

    const voices = window.speechSynthesis.getVoices();
    const andrewVoice = voices.find((voice) => voice.name.toLowerCase().includes('andrew'));
    if (andrewVoice) {
      utterance.voice = andrewVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, []);

  const voiceQuestions: VoiceQuestion[] = useMemo(() => [
    {
      prompt: '請說明功能名稱，例如 Smart Reply Suggestions。',
      apply: (answer, base) => ({ ...base, name: answer.trim() || base.name }),
    },
    {
      prompt: '請說明產品或服務名稱。',
      apply: (answer, base) => ({ ...base, product_name: answer.trim() || base.product_name }),
    },
    {
      prompt: '請說明負責團隊名稱。',
      apply: (answer, base) => ({ ...base, team: answer.trim() || base.team }),
    },
    {
      prompt: '請描述這個 AI 功能在做什麼。',
      apply: (answer, base) => ({ ...base, description: answer.trim() || base.description }),
    },
    {
      prompt: '請回答開發階段：Idea、In Development、Beta、Live。',
      apply: (answer, base) => ({
        ...base,
        stage: parseSingleChoice<FeatureStage>(
          answer,
          [
            { value: 'Idea', keywords: ['idea', '想法', '概念'] },
            { value: 'In Development', keywords: ['development', 'dev', '開發'] },
            { value: 'Beta', keywords: ['beta', '測試'] },
            { value: 'Live', keywords: ['live', 'production', '上線', '正式'] },
          ],
          base.stage
        ),
      }),
    },
    {
      prompt: '請回答 AI 類型：LLM feature、Recommendation-Ranking、Classification-Detection、Other。',
      apply: (answer, base) => ({
        ...base,
        ai_type: parseSingleChoice<AIType | ''>(
          answer,
          [
            { value: 'LLM feature', keywords: ['llm', 'chat', '生成', '語言模型'] },
            { value: 'Recommendation-Ranking', keywords: ['recommend', 'ranking', '推薦', '排序'] },
            { value: 'Classification-Detection', keywords: ['classification', 'detection', '分類', '偵測'] },
            { value: 'Other', keywords: ['other', '其他'] },
          ],
          base.ai_type
        ),
      }),
    },
    {
      prompt: '請回答模型來源：Internal model、External API、Open-source self-hosted。',
      apply: (answer, base) => ({
        ...base,
        model_source: parseSingleChoice<ModelSource | ''>(
          answer,
          [
            { value: 'Internal model', keywords: ['internal', '自研', '內部'] },
            { value: 'External API', keywords: ['external', 'api', '第三方', '外部'] },
            { value: 'Open-source self-hosted', keywords: ['open source', 'self hosted', '開源', '自架'] },
          ],
          base.model_source
        ),
      }),
    },
    {
      prompt: '請回答自動化程度：Suggestion only、Human reviews output、Fully automated。',
      apply: (answer, base) => ({
        ...base,
        autonomy_level: parseSingleChoice<AutonomyLevel | ''>(
          answer,
          [
            { value: 'Suggestion only', keywords: ['suggestion', '建議', '只建議'] },
            { value: 'Human reviews output', keywords: ['human', 'review', '人工審核', '人工確認'] },
            { value: 'Fully automated', keywords: ['fully', 'automated', '全自動', '自動化'] },
          ],
          base.autonomy_level
        ),
      }),
    },
    {
      prompt: '請描述資料型態，可多選：none、account info、user-generated content、sensitive、internal confidential、public。',
      apply: (answer, base) => ({
        ...base,
        user_data_types: parseMultiChoice<UserDataType>(
          answer,
          [
            { value: 'none', keywords: ['none', '無', '沒有'] },
            { value: 'account info', keywords: ['account', '帳號', '帳戶'] },
            { value: 'user-generated content', keywords: ['ugc', 'user-generated', '使用者內容', '內容'] },
            { value: 'sensitive: health/financial/identity', keywords: ['sensitive', 'health', 'financial', 'identity', '敏感', '醫療', '金融', '身分'] },
            { value: 'internal confidential', keywords: ['internal confidential', '機密', '內部機密'] },
            { value: 'public', keywords: ['public', '公開'] },
          ],
          base.user_data_types
        ),
      }),
    },
    {
      prompt: '是否會對外部傳輸資料？請回答是或否。',
      apply: (answer, base) => ({ ...base, external_data_transfer: parseYesNo(answer, base.external_data_transfer) }),
    },
    {
      prompt: '目標使用者可多選：internal employees、general users、enterprise customers、minors。',
      apply: (answer, base) => ({
        ...base,
        target_users: parseMultiChoice<TargetUser>(
          answer,
          [
            { value: 'internal employees', keywords: ['internal', 'employees', '內部員工', '員工'] },
            { value: 'general users', keywords: ['general users', '一般使用者', '一般用戶'] },
            { value: 'enterprise customers', keywords: ['enterprise', 'customers', '企業客戶'] },
            { value: 'minors', keywords: ['minors', '未成年', '兒童'] },
          ],
          base.target_users
        ),
      }),
    },
    {
      prompt: '影響類型可多選：affects eligibility/access、financial outcomes、content visibility/moderation、none。',
      apply: (answer, base) => ({
        ...base,
        impact_types: parseMultiChoice<ImpactType>(
          answer,
          [
            { value: 'affects eligibility/access', keywords: ['eligibility', 'access', '資格', '存取'] },
            { value: 'financial outcomes', keywords: ['financial', 'finance', '金錢', '財務'] },
            { value: 'content visibility/moderation', keywords: ['content', 'visibility', 'moderation', '內容', '審核', '可見性'] },
            { value: 'none', keywords: ['none', '無', '沒有'] },
          ],
          base.impact_types
        ),
      }),
    },
    {
      prompt: '是否有人類審核？請回答是或否。',
      apply: (answer, base) => ({
        ...base,
        safeguards: {
          ...base.safeguards,
          human_oversight: parseYesNo(answer, base.safeguards.human_oversight),
        },
      }),
    },
    {
      prompt: '是否有 logging 與監控？請回答是或否。',
      apply: (answer, base) => ({
        ...base,
        safeguards: {
          ...base.safeguards,
          logging_monitoring: parseYesNo(answer, base.safeguards.logging_monitoring),
        },
      }),
    },
    {
      prompt: '是否有濫用防護措施？請回答是或否。',
      apply: (answer, base) => ({
        ...base,
        safeguards: {
          ...base.safeguards,
          abuse_mitigation: parseYesNo(answer, base.safeguards.abuse_mitigation),
        },
      }),
    },
  ], []);

  const stopVoiceCapture = useCallback(() => {
    shouldContinueRef.current = false;
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setVoiceError('目前瀏覽器不支援 Speech Recognition，請改用手動填寫。');
      return;
    }

    setVoiceError('');
    shouldContinueRef.current = true;
    recognitionRef.current.start();
    setIsListening(true);
  }, []);

  const moveToNextQuestion = useCallback(() => {
    setVoiceQuestionIndex((previous) => {
      const next = previous + 1;
      if (next >= voiceQuestions.length) {
        const completedMessage = '訪談完成，我已經把內容填進表單。你可以手動微調後送出。';
        setConversation((messages) => [...messages, { speaker: 'Andrew', text: completedMessage }]);
        speakAsAndrew(completedMessage);
        setIsVoiceMode(false);
        setIsListening(false);
        shouldContinueRef.current = false;
        return previous;
      }
      return next;
    });
  }, [speakAsAndrew, voiceQuestions.length]);

  useEffect(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!Recognition) {
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'zh-TW';

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      if (!result?.isFinal) return;

      const transcript = result[0].transcript.trim();
      setLatestTranscript(transcript);
      setConversation((messages) => [...messages, { speaker: '使用者', text: transcript }]);

      const question = voiceQuestions[voiceQuestionIndex];
      if (!question) return;

      const updated = question.apply(transcript, dataRef.current);
      onChange(updated);

      moveToNextQuestion();
    };

    recognition.onerror = () => {
      setIsListening(false);
      setVoiceError('語音辨識失敗，請再試一次或改為手動填寫。');
    };

    recognition.onend = () => {
      setIsListening(false);
      if (shouldContinueRef.current && isVoiceMode) {
        recognition.start();
        setIsListening(true);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldContinueRef.current = false;
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [isVoiceMode, moveToNextQuestion, onChange, voiceQuestionIndex, voiceQuestions]);

  useEffect(() => {
    if (!isVoiceMode) {
      askedQuestionRef.current = -1;
      return;
    }

    const question = voiceQuestions[voiceQuestionIndex];
    if (!question) return;
    if (askedQuestionRef.current === voiceQuestionIndex) return;

    askedQuestionRef.current = voiceQuestionIndex;
    setConversation((messages) => [...messages, { speaker: 'Andrew', text: question.prompt }]);
    speakAsAndrew(question.prompt);
  }, [isVoiceMode, speakAsAndrew, voiceQuestionIndex, voiceQuestions]);

  useEffect(() => {
    if (!isVoiceMode) {
      stopVoiceCapture();
      return;
    }

    startListening();
  }, [isVoiceMode, startListening, stopVoiceCapture, voiceQuestionIndex]);

  const isValid = data.name.trim().length > 0;
  const currentVoicePrompt = voiceQuestions[voiceQuestionIndex]?.prompt;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Andrew 顧問訪談 (Speech-to-Text)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Andrew 會像顧問一樣逐題訪談並語音提問，你口頭回答後會自動回填欄位。
          </p>
          {isVoiceMode && currentVoicePrompt ? (
            <div className="rounded-md border border-border p-3">
              <p className="text-sm font-medium">Andrew 目前問題 ({voiceQuestionIndex + 1}/{voiceQuestions.length})</p>
              <p className="text-sm text-muted-foreground mt-1">{currentVoicePrompt}</p>
            </div>
          ) : null}
          {conversation.length > 0 ? (
            <div className="rounded-md border border-border p-3 max-h-56 overflow-y-auto space-y-2">
              {conversation.map((message, index) => (
                <p key={`${message.speaker}-${index}`} className="text-sm">
                  <span className="font-medium">{message.speaker}：</span>
                  {message.text}
                </p>
              ))}
            </div>
          ) : null}
          {latestTranscript ? (
            <p className="text-sm text-muted-foreground">最近辨識：{latestTranscript}</p>
          ) : null}
          {voiceError ? <p className="text-sm text-destructive">{voiceError}</p> : null}
          <div className="flex flex-wrap gap-2">
            {!isVoiceMode ? (
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setLatestTranscript('');
                  setVoiceQuestionIndex(0);
                  setVoiceError('');
                  setConversation([
                    {
                      speaker: 'Andrew',
                      text: '你好，我是 Andrew。接下來我會用訪談方式幫你完成填表。',
                    },
                  ]);
                  setIsVoiceMode(true);
                }}
              >
                <Mic className="h-4 w-4" />
                開始 Andrew 訪談
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setIsVoiceMode(false);
                }}
              >
                <MicOff className="h-4 w-4" />
                停止訪談
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              disabled={!isVoiceMode || isListening}
              onClick={startListening}
            >
              重新回答本題
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section A: Feature Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">A. Feature Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Feature Name *</Label>
              <Input
                id="name"
                value={data.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g., Smart Reply Suggestions"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product_name">Product/Service</Label>
              <Input
                id="product_name"
                value={data.product_name}
                onChange={(e) => updateField('product_name', e.target.value)}
                placeholder="e.g., Messaging App"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="team">Team</Label>
              <Input
                id="team"
                value={data.team}
                onChange={(e) => updateField('team', e.target.value)}
                placeholder="e.g., AI Platform Team"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage">Stage</Label>
              <Select
                value={data.stage}
                onValueChange={(v) => updateField('stage', v as FeatureStage)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={data.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Brief description of what the AI feature does..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section B: AI System Design */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">B. AI System Design</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>AI Type</Label>
            <Select
              value={data.ai_type}
              onValueChange={(v) => updateField('ai_type', v as AIType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select AI type" />
              </SelectTrigger>
              <SelectContent>
                {aiTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Model Source</Label>
            <Select
              value={data.model_source}
              onValueChange={(v) => updateField('model_source', v as ModelSource)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select model source" />
              </SelectTrigger>
              <SelectContent>
                {modelSources.map((source) => (
                  <SelectItem key={source} value={source}>{source}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Autonomy Level</Label>
            <Select
              value={data.autonomy_level}
              onValueChange={(v) => updateField('autonomy_level', v as AutonomyLevel)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select autonomy level" />
              </SelectTrigger>
              <SelectContent>
                {autonomyLevels.map((level) => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Section C: Data & Users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">C. Data & Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>User Data Types</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {userDataTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`data-${type}`}
                    checked={data.user_data_types.includes(type)}
                    onCheckedChange={() => toggleArrayItem('user_data_types', type)}
                  />
                  <label htmlFor={`data-${type}`} className="text-sm cursor-pointer">
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>External Data Transfer</Label>
              <p className="text-sm text-muted-foreground">
                Is data transferred to external parties?
              </p>
            </div>
            <Switch
              checked={data.external_data_transfer}
              onCheckedChange={(v) => updateField('external_data_transfer', v)}
            />
          </div>

          <div className="space-y-3">
            <Label>Target Users</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {targetUsers.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`user-${type}`}
                    checked={data.target_users.includes(type)}
                    onCheckedChange={() => toggleArrayItem('target_users', type)}
                  />
                  <label htmlFor={`user-${type}`} className="text-sm cursor-pointer">
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section D: Impact & Safeguards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">D. Impact & Safeguards</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Impact Types</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {impactTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`impact-${type}`}
                    checked={data.impact_types.includes(type)}
                    onCheckedChange={() => toggleArrayItem('impact_types', type)}
                  />
                  <label htmlFor={`impact-${type}`} className="text-sm cursor-pointer">
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Label>Safeguards in Place</Label>

            <div className="flex items-center justify-between py-2 border-b border-border">
              <div>
                <p className="font-medium">Human Oversight</p>
                <p className="text-sm text-muted-foreground">
                  A human reviews AI outputs before action
                </p>
              </div>
              <Switch
                checked={data.safeguards.human_oversight}
                onCheckedChange={(v) => updateSafeguard('human_oversight', v)}
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border">
              <div>
                <p className="font-medium">Logging & Monitoring</p>
                <p className="text-sm text-muted-foreground">
                  AI decisions are logged for audit
                </p>
              </div>
              <Switch
                checked={data.safeguards.logging_monitoring}
                onCheckedChange={(v) => updateSafeguard('logging_monitoring', v)}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Abuse Mitigation</p>
                <p className="text-sm text-muted-foreground">
                  Controls to prevent misuse
                </p>
              </div>
              <Switch
                checked={data.safeguards.abuse_mitigation}
                onCheckedChange={(v) => updateSafeguard('abuse_mitigation', v)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
        <Button
          variant="outline"
          onClick={() => onSubmit(false)}
          disabled={!isValid || isSubmitting}
          className="gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Draft
        </Button>
        <Button
          onClick={() => onSubmit(true)}
          disabled={!isValid || isSubmitting}
          className="gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Run AI Governance Check
        </Button>
      </div>
    </div>
  );
}
