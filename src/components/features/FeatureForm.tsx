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
import { Play, Save, Loader2 } from 'lucide-react';
import type { 
  AIFeatureFormData, 
  FeatureStage, 
  AIType, 
  ModelSource, 
  AutonomyLevel,
  UserDataType,
  TargetUser,
  ImpactType
} from '@/types/governance';

interface FeatureFormProps {
  data: AIFeatureFormData;
  onChange: (data: AIFeatureFormData) => void;
  onSubmit: (runAssessment: boolean) => void;
  isSubmitting?: boolean;
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

export function FeatureForm({ data, onChange, onSubmit, isSubmitting }: FeatureFormProps) {
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
      ? current.filter(v => v !== value)
      : [...current, value];
    onChange({ ...data, [field]: updated });
  };

  const updateSafeguard = (key: keyof AIFeatureFormData['safeguards'], value: boolean) => {
    onChange({
      ...data,
      safeguards: { ...data.safeguards, [key]: value },
    });
  };

  const isValid = data.name.trim().length > 0;

  return (
    <div className="space-y-6">
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
                  {stages.map(stage => (
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
                {aiTypes.map(type => (
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
                {modelSources.map(source => (
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
                {autonomyLevels.map(level => (
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
              {userDataTypes.map(type => (
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
              {targetUsers.map(type => (
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
              {impactTypes.map(type => (
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
