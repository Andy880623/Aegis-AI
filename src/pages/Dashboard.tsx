import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAIFeatures } from '@/hooks/useAIFeatures';
import { useLatestAssessment } from '@/hooks/useAssessments';
import { AppLayout } from '@/components/layout/AppLayout';
import { RiskBadge } from '@/components/ui/risk-badge';
import { StageBadge } from '@/components/ui/stage-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Search, Filter, Database, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { AIFeature, RiskTier, FeatureStage } from '@/types/governance';

function FeatureRow({ feature }: { feature: AIFeature }) {
  const { data: assessment } = useLatestAssessment(feature.id);

  return (
    <TableRow className="cursor-pointer hover:bg-muted/50">
      <TableCell>
        <Link to={`/feature/${feature.id}`} className="font-medium text-foreground hover:text-primary">
          {feature.name}
        </Link>
      </TableCell>
      <TableCell className="text-muted-foreground">{feature.product_name || '—'}</TableCell>
      <TableCell className="text-muted-foreground">{feature.team || '—'}</TableCell>
      <TableCell>
        <StageBadge stage={feature.stage} size="sm" />
      </TableCell>
      <TableCell>
        {assessment ? (
          <RiskBadge tier={assessment.risk_tier} size="sm" />
        ) : (
          <span className="text-xs text-muted-foreground">Not assessed</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {formatDistanceToNow(new Date(feature.updated_at), { addSuffix: true })}
      </TableCell>
    </TableRow>
  );
}

export default function Dashboard() {
  const { data: features, isLoading, error } = useAIFeatures();
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskTier | 'all'>('all');
  const [stageFilter, setStageFilter] = useState<FeatureStage | 'all'>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');

  // Get unique teams for filter
  const teams = useMemo(() => {
    if (!features) return [];
    const uniqueTeams = new Set(features.map(f => f.team).filter(Boolean));
    return Array.from(uniqueTeams) as string[];
  }, [features]);

  // Filter features
  const filteredFeatures = useMemo(() => {
    if (!features) return [];
    return features.filter(feature => {
      const matchesSearch = 
        feature.name.toLowerCase().includes(search.toLowerCase()) ||
        (feature.team?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesStage = stageFilter === 'all' || feature.stage === stageFilter;
      const matchesTeam = teamFilter === 'all' || feature.team === teamFilter;
      return matchesSearch && matchesStage && matchesTeam;
    });
  }, [features, search, stageFilter, teamFilter]);

  const clearFilters = () => {
    setSearch('');
    setRiskFilter('all');
    setStageFilter('all');
    setTeamFilter('all');
  };

  const hasActiveFilters = search || riskFilter !== 'all' || stageFilter !== 'all' || teamFilter !== 'all';

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Feature Library</h1>
            <p className="text-muted-foreground">
              Manage and assess AI features across your organization
            </p>
          </div>
          <Link to="/new">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              New AI Feature
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="governance-section">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground mb-1.5 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by feature name or team..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="w-full sm:w-40">
              <label className="text-sm font-medium text-foreground mb-1.5 block">Risk Tier</label>
              <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as RiskTier | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-40">
              <label className="text-sm font-medium text-foreground mb-1.5 block">Stage</label>
              <Select value={stageFilter} onValueChange={(v) => setStageFilter(v as FeatureStage | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Idea">Idea</SelectItem>
                  <SelectItem value="In Development">In Development</SelectItem>
                  <SelectItem value="Beta">Beta</SelectItem>
                  <SelectItem value="Live">Live</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-40">
              <label className="text-sm font-medium text-foreground mb-1.5 block">Team</label>
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team} value={team}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="governance-section p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-destructive">Failed to load features. Please try again.</p>
            </div>
          ) : filteredFeatures.length === 0 ? (
            <div className="p-12 text-center">
              <Database className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">
                {features?.length === 0 ? 'No AI features yet' : 'No matching features'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {features?.length === 0 
                  ? 'Get started by registering your first AI feature.'
                  : 'Try adjusting your search or filter criteria.'}
              </p>
              {features?.length === 0 && (
                <Link to="/new">
                  <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Register AI Feature
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Feature Name</TableHead>
                  <TableHead className="font-semibold">Product/Service</TableHead>
                  <TableHead className="font-semibold">Team</TableHead>
                  <TableHead className="font-semibold">Stage</TableHead>
                  <TableHead className="font-semibold">Risk Tier</TableHead>
                  <TableHead className="font-semibold">Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeatures.map(feature => (
                  <FeatureRow key={feature.id} feature={feature} />
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Stats */}
        {features && features.length > 0 && (
          <div className="text-sm text-muted-foreground text-center">
            Showing {filteredFeatures.length} of {features.length} features
          </div>
        )}
      </div>
    </AppLayout>
  );
}
