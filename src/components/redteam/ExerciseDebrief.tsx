import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Target,
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  MessageSquare,
  Zap,
  Award,
  ArrowRight,
  Timer,
  Brain,
  Users,
  Newspaper,
  Radio
} from "lucide-react";
import { ExerciseConfig, TeamScore, Inject, ResponseOption } from "@/pages/RedTeam";
import greyguardsLogo from "@/assets/greyguards-logo.png";

interface ResponseRecord {
  injectId: string;
  injectType: string;
  injectContent: string;
  responseLabel: string;
  responseType: string;
  effectiveness: number;
  responseTime: number;
  wasCorrect: boolean;
  timestamp: number;
}

interface ExerciseDebriefProps {
  score: TeamScore;
  config: ExerciseConfig;
  responseHistory: ResponseRecord[];
  eventLog: Array<{ time: number; message: string; type: string }>;
  onRestart: () => void;
}

const ExerciseDebrief = ({ 
  score, 
  config, 
  responseHistory,
  eventLog,
  onRestart 
}: ExerciseDebriefProps) => {
  const [selectedTab, setSelectedTab] = useState("overview");

  // Calculate overall score
  const overallScore = Math.round(
    (score.narrativeControl * 0.4) + 
    ((100 - score.reputationDamage) * 0.3) + 
    ((score.decisionsCorrect / Math.max(score.decisionsTotal, 1)) * 100 * 0.3)
  );

  // Get grade info
  const getGrade = () => {
    if (overallScore >= 90) return { grade: "A+", color: "text-success", bg: "bg-success/10", border: "border-success", message: "Exceptional crisis management" };
    if (overallScore >= 80) return { grade: "A", color: "text-success", bg: "bg-success/10", border: "border-success", message: "Strong performance under pressure" };
    if (overallScore >= 70) return { grade: "B", color: "text-warning", bg: "bg-warning/10", border: "border-warning", message: "Good response, room for improvement" };
    if (overallScore >= 60) return { grade: "C", color: "text-warning", bg: "bg-warning/10", border: "border-warning", message: "Adequate response, needs work" };
    return { grade: "D", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive", message: "Significant improvement needed" };
  };

  const gradeInfo = getGrade();

  // Response pattern analysis
  const responsePatterns = {
    fastest: responseHistory.length > 0 ? Math.min(...responseHistory.map(r => r.responseTime)) : 0,
    slowest: responseHistory.length > 0 ? Math.max(...responseHistory.map(r => r.responseTime)) : 0,
    avgTime: score.responseTime,
    byType: responseHistory.reduce((acc, r) => {
      acc[r.responseType] = (acc[r.responseType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    correctRate: score.decisionsTotal > 0 ? Math.round((score.decisionsCorrect / score.decisionsTotal) * 100) : 0,
    avgEffectiveness: responseHistory.length > 0 
      ? Math.round(responseHistory.reduce((sum, r) => sum + r.effectiveness, 0) / responseHistory.length)
      : 0
  };

  // Generate recommendations based on performance
  const generateRecommendations = () => {
    const recommendations: Array<{ priority: "high" | "medium" | "low"; title: string; description: string; icon: React.ReactNode }> = [];

    // Response time analysis
    if (score.responseTime > 45) {
      recommendations.push({
        priority: "high",
        title: "Improve Response Speed",
        description: "Your average response time was over 45 seconds. In real crises, faster initial responses help control the narrative before it spirals.",
        icon: <Clock className="h-5 w-5" />
      });
    }

    // Narrative control
    if (score.narrativeControl < 50) {
      recommendations.push({
        priority: "high",
        title: "Strengthen Narrative Control",
        description: "You ended with less than 50% narrative control. Consider more proactive communication and fact-based rebuttals early in crises.",
        icon: <MessageSquare className="h-5 w-5" />
      });
    }

    // Reputation damage
    if (score.reputationDamage > 40) {
      recommendations.push({
        priority: "high",
        title: "Reduce Reputation Damage",
        description: "High reputation damage suggests missed opportunities for mitigation. Focus on stakeholder communication and transparency.",
        icon: <Shield className="h-5 w-5" />
      });
    }

    // Decision accuracy
    if (responsePatterns.correctRate < 70) {
      recommendations.push({
        priority: "medium",
        title: "Improve Decision Quality",
        description: "Less than 70% of decisions were optimal. Review the debrief timeline to understand which choices could have been better.",
        icon: <Brain className="h-5 w-5" />
      });
    }

    // Response type diversity
    const responseTypes = Object.keys(responsePatterns.byType);
    if (responseTypes.length < 3) {
      recommendations.push({
        priority: "medium",
        title: "Diversify Response Strategies",
        description: "You used limited response types. Consider utilizing media outreach, internal actions, and statements together for comprehensive crisis management.",
        icon: <Zap className="h-5 w-5" />
      });
    }

    // Greyguards service usage
    const usedGreyguards = responseHistory.some(r => r.responseType === "greyguards_service");
    if (!usedGreyguards && score.reputationDamage > 30) {
      recommendations.push({
        priority: "low",
        title: "Consider Professional Support",
        description: "Complex crises often benefit from expert guidance. Greyguards services can provide rapid attribution and strategic countermeasures.",
        icon: <Users className="h-5 w-5" />
      });
    }

    // Always add positive if doing well
    if (overallScore >= 80) {
      recommendations.push({
        priority: "low",
        title: "Maintain Preparedness",
        description: "Excellent performance! Continue regular crisis drills and keep your response playbooks updated with lessons learned.",
        icon: <Award className="h-5 w-5" />
      });
    }

    return recommendations;
  };

  const recommendations = generateRecommendations();

  const getInjectTypeIcon = (type: string) => {
    switch (type) {
      case "social_post": return <MessageSquare className="h-4 w-4" />;
      case "news_article": return <Newspaper className="h-4 w-4" />;
      case "influencer": return <Users className="h-4 w-4" />;
      case "official_response": return <Radio className="h-4 w-4" />;
      case "leak": return <AlertTriangle className="h-4 w-4" />;
      case "amplification": return <Zap className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-4 border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={greyguardsLogo} alt="Greyguards" className="h-10 w-auto" />
            <div>
              <span className="text-xl font-bold tracking-wider uppercase text-foreground">Greyguards</span>
              <span className="block text-xs tracking-widest uppercase text-muted-foreground">Red Team</span>
            </div>
          </Link>
          <Badge variant="outline" className={`${gradeInfo.border} ${gradeInfo.color} uppercase tracking-wider`}>
            <Award className="h-3 w-3 mr-1" />
            Exercise Complete
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Grade Hero Section */}
        <div className="max-w-4xl mx-auto mb-8">
          <Card className={`border-4 ${gradeInfo.border} ${gradeInfo.bg}`}>
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center gap-8">
                <div>
                  <div className={`text-9xl font-bold ${gradeInfo.color}`}>{gradeInfo.grade}</div>
                  <div className="text-sm uppercase tracking-wider text-muted-foreground mt-2">Overall Grade</div>
                </div>
                <div className="text-left border-l-4 border-border pl-8">
                  <h2 className="text-2xl font-bold uppercase tracking-wider mb-2">{config.brandName}</h2>
                  <p className={`text-lg ${gradeInfo.color} mb-4`}>{gradeInfo.message}</p>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Timer className="h-4 w-4" />
                      {config.duration} min exercise
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      {score.decisionsTotal} decisions
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <div className="max-w-4xl mx-auto">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full border-4 border-border bg-card p-1">
              <TabsTrigger value="overview" className="uppercase tracking-wider text-xs">
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="timeline" className="uppercase tracking-wider text-xs">
                <Clock className="h-4 w-4 mr-2" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="patterns" className="uppercase tracking-wider text-xs">
                <Brain className="h-4 w-4 mr-2" />
                Patterns
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="uppercase tracking-wider text-xs">
                <Lightbulb className="h-4 w-4 mr-2" />
                Improve
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-2 border-border">
                  <CardContent className="p-4 text-center">
                    <div className={`text-3xl font-bold ${score.narrativeControl >= 50 ? 'text-success' : 'text-destructive'}`}>
                      {Math.round(score.narrativeControl)}%
                    </div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Narrative Control</div>
                    <Progress value={score.narrativeControl} className="mt-2 h-2" />
                  </CardContent>
                </Card>
                <Card className="border-2 border-border">
                  <CardContent className="p-4 text-center">
                    <div className={`text-3xl font-bold ${score.reputationDamage <= 30 ? 'text-success' : 'text-destructive'}`}>
                      {Math.round(score.reputationDamage)}%
                    </div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Reputation Damage</div>
                    <Progress value={score.reputationDamage} className="mt-2 h-2" />
                  </CardContent>
                </Card>
                <Card className="border-2 border-border">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-foreground">
                      {score.decisionsCorrect}/{score.decisionsTotal}
                    </div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Correct Decisions</div>
                    <Progress 
                      value={score.decisionsTotal > 0 ? (score.decisionsCorrect / score.decisionsTotal) * 100 : 0} 
                      className="mt-2 h-2" 
                    />
                  </CardContent>
                </Card>
                <Card className="border-2 border-border">
                  <CardContent className="p-4 text-center">
                    <div className={`text-3xl font-bold ${score.responseTime <= 30 ? 'text-success' : score.responseTime <= 45 ? 'text-warning' : 'text-destructive'}`}>
                      {Math.round(score.responseTime)}s
                    </div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Avg Response</div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {score.responseTime <= 30 ? 'Excellent' : score.responseTime <= 45 ? 'Good' : 'Needs work'}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Score Breakdown */}
              <Card className="border-4 border-border">
                <CardHeader className="border-b border-border py-3">
                  <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Score Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Narrative Control (40%)</span>
                      <span className="font-bold">{Math.round(score.narrativeControl * 0.4)} pts</span>
                    </div>
                    <Progress value={score.narrativeControl} className="h-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Reputation Defense (30%)</span>
                      <span className="font-bold">{Math.round((100 - score.reputationDamage) * 0.3)} pts</span>
                    </div>
                    <Progress value={100 - score.reputationDamage} className="h-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Decision Accuracy (30%)</span>
                      <span className="font-bold">
                        {Math.round((score.decisionsCorrect / Math.max(score.decisionsTotal, 1)) * 100 * 0.3)} pts
                      </span>
                    </div>
                    <Progress 
                      value={score.decisionsTotal > 0 ? (score.decisionsCorrect / score.decisionsTotal) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                  <div className="border-t border-border pt-4 mt-4">
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span className="uppercase tracking-wider">Total Score</span>
                      <span className={gradeInfo.color}>{overallScore}/100</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="space-y-6">
              <Card className="border-4 border-border">
                <CardHeader className="border-b border-border py-3">
                  <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                    <Clock className="h-4 w-4 text-warning" />
                    Response Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[500px]">
                    <div className="p-4 space-y-3">
                      {responseHistory.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No responses recorded</p>
                      ) : (
                        responseHistory.map((response, i) => (
                          <div 
                            key={i} 
                            className={`p-4 border-l-4 ${response.wasCorrect ? 'border-success bg-success/5' : 'border-destructive bg-destructive/5'}`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {getInjectTypeIcon(response.injectType)}
                                  <Badge variant="outline" className="text-xs uppercase">
                                    {response.injectType.replace('_', ' ')}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    at {Math.floor(response.timestamp / 60)}:{(response.timestamp % 60).toString().padStart(2, '0')}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                  {response.injectContent}
                                </p>
                                <div className="flex items-center gap-2">
                                  <ArrowRight className="h-4 w-4 text-primary" />
                                  <span className="font-medium text-sm">{response.responseLabel}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1 mb-1">
                                  {response.wasCorrect ? (
                                    <CheckCircle className="h-4 w-4 text-success" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-destructive" />
                                  )}
                                  <span className={`font-bold ${response.wasCorrect ? 'text-success' : 'text-destructive'}`}>
                                    {response.effectiveness}%
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {Math.round(response.responseTime)}s response
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Patterns Tab */}
            <TabsContent value="patterns" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-4 border-border">
                  <CardHeader className="border-b border-border py-3">
                    <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                      <Timer className="h-4 w-4 text-warning" />
                      Response Timing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex justify-between items-center p-3 bg-success/10 border-l-4 border-success">
                      <span className="text-sm">Fastest Response</span>
                      <span className="font-bold text-success">{Math.round(responsePatterns.fastest)}s</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted border-l-4 border-muted-foreground">
                      <span className="text-sm">Average Response</span>
                      <span className="font-bold">{Math.round(responsePatterns.avgTime)}s</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-destructive/10 border-l-4 border-destructive">
                      <span className="text-sm">Slowest Response</span>
                      <span className="font-bold text-destructive">{Math.round(responsePatterns.slowest)}s</span>
                    </div>
                    <div className="pt-2 text-xs text-muted-foreground">
                      {responsePatterns.avgTime <= 30 
                        ? "🎯 Excellent timing - quick responses help control narratives early"
                        : responsePatterns.avgTime <= 45
                        ? "⚡ Good timing - consider pre-drafting responses for faster action"
                        : "⚠️ Response times could be faster - practice rapid decision making"
                      }
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-4 border-border">
                  <CardHeader className="border-b border-border py-3">
                    <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      Response Types Used
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {Object.entries(responsePatterns.byType).length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">No data available</p>
                    ) : (
                      Object.entries(responsePatterns.byType).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={(count / responseHistory.length) * 100} 
                              className="w-24 h-2" 
                            />
                            <span className="font-bold text-sm w-8">{count}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="border-4 border-border md:col-span-2">
                  <CardHeader className="border-b border-border py-3">
                    <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                      <Target className="h-4 w-4 text-success" />
                      Effectiveness Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 bg-muted">
                        <div className="text-2xl font-bold text-primary">{responsePatterns.avgEffectiveness}%</div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Avg Effectiveness</div>
                      </div>
                      <div className="p-4 bg-muted">
                        <div className="text-2xl font-bold text-success">{responsePatterns.correctRate}%</div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Correct Rate</div>
                      </div>
                      <div className="p-4 bg-muted">
                        <div className="text-2xl font-bold text-warning">{responseHistory.length}</div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Total Responses</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="space-y-6">
              <div className="space-y-4">
                {recommendations.map((rec, i) => (
                  <Card 
                    key={i} 
                    className={`border-2 ${
                      rec.priority === 'high' ? 'border-destructive bg-destructive/5' :
                      rec.priority === 'medium' ? 'border-warning bg-warning/5' :
                      'border-success bg-success/5'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 ${
                          rec.priority === 'high' ? 'bg-destructive text-destructive-foreground' :
                          rec.priority === 'medium' ? 'bg-warning text-warning-foreground' :
                          'bg-success text-success-foreground'
                        }`}>
                          {rec.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold uppercase tracking-wider">{rec.title}</h4>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                rec.priority === 'high' ? 'border-destructive text-destructive' :
                                rec.priority === 'medium' ? 'border-warning text-warning' :
                                'border-success text-success'
                              }`}
                            >
                              {rec.priority} priority
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{rec.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* CTA */}
              <Card className="border-4 border-primary bg-primary/5">
                <CardContent className="p-6 text-center">
                  <Shield className="h-12 w-12 mx-auto text-primary mb-4" />
                  <h3 className="font-bold uppercase tracking-wider text-lg mb-2">
                    Want Expert Guidance?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                    Greyguards consultants can provide personalized crisis management training, 
                    detailed playbooks, and real-time support during actual incidents.
                  </p>
                  <Button className="uppercase tracking-wider">
                    Contact Greyguards
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <Button 
              onClick={onRestart}
              className="flex-1 uppercase tracking-wider h-12"
            >
              <Target className="h-4 w-4 mr-2" />
              New Exercise
            </Button>
            <Link to="/" className="flex-1">
              <Button variant="outline" className="w-full uppercase tracking-wider h-12">
                Return to Greyscan
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseDebrief;
