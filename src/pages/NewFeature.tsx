import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { FeatureForm } from '@/components/features/FeatureForm';
import { useCreateAIFeature } from '@/hooks/useAIFeatures';
import type { AIFeatureFormData } from '@/types/governance';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const defaultFormData: AIFeatureFormData = {
  name: '',
  product_name: '',
  team: '',
  stage: 'Idea',
  description: '',
  ai_type: '',
  model_source: '',
  autonomy_level: '',
  user_data_types: [],
  external_data_transfer: false,
  target_users: [],
  impact_types: [],
  safeguards: {
    human_oversight: false,
    logging_monitoring: false,
    abuse_mitigation: false,
  },
};

export default function NewFeature() {
  const navigate = useNavigate();
  const createFeature = useCreateAIFeature();
  const [formData, setFormData] = useState<AIFeatureFormData>(defaultFormData);

  const handleSubmit = async (runAssessment: boolean) => {
    if (!formData.name.trim()) return;

    const feature = await createFeature.mutateAsync(formData);
    
    if (runAssessment) {
      navigate(`/feature/${feature.id}?runAssessment=true`);
    } else {
      navigate(`/feature/${feature.id}`);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Register New AI Feature</h1>
            <p className="text-muted-foreground">
              Document your AI feature for governance assessment
            </p>
          </div>
        </div>

        {/* Form */}
        <FeatureForm
          data={formData}
          onChange={setFormData}
          onSubmit={handleSubmit}
          isSubmitting={createFeature.isPending}
        />
      </div>
    </AppLayout>
  );
}
