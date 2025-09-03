import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { 
  Mic, 
  FileText, 
  Brain, 
  Clock, 
  Shield, 
  Search,
  Languages,
  Zap,
  Download
} from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Live Call Transcription",
    description: "Real-time transcription of phone conversations with 99.5% accuracy, specifically trained for Australian aged care terminology.",
    color: "text-blue-600 bg-blue-100"
  },
  {
    icon: Brain,
    title: "AI-Powered Summaries",
    description: "Automatically generate structured care summaries highlighting key points, action items, and important observations.",
    color: "text-purple-600 bg-purple-100"
  },
  {
    icon: FileText,
    title: "Structured Documentation",
    description: "Convert conversations into properly formatted care notes that meet Australian aged care documentation standards.",
    color: "text-green-600 bg-green-100"
  },
  {
    icon: Clock,
    title: "Instant Processing",
    description: "Get your transcription and summary within seconds of ending the call, no waiting required.",
    color: "text-orange-600 bg-orange-100"
  },
  {
    icon: Shield,
    title: "Privacy Compliant",
    description: "Full compliance with Australian Privacy Act and aged care regulations. Your data never leaves Australian shores.",
    color: "text-red-600 bg-red-100"
  },
  {
    icon: Search,
    title: "Smart Search",
    description: "Find specific conversations, topics, or residents instantly with AI-powered search across all your transcriptions.",
    color: "text-teal-600 bg-teal-100"
  },
  {
    icon: Languages,
    title: "Multi-language Support",
    description: "Supports English and 20+ community languages commonly spoken by aged care residents and families.",
    color: "text-indigo-600 bg-indigo-100"
  },
  {
    icon: Zap,
    title: "Action Item Detection",
    description: "Automatically identifies and highlights follow-up actions, appointments, and care plan changes from conversations.",
    color: "text-emerald-600 bg-emerald-100"
  },
  {
    icon: Download,
    title: "Easy Export",
    description: "Export transcriptions and summaries in multiple formats compatible with your existing care management systems.",
    color: "text-yellow-600 bg-yellow-100"
  }
];

export function Features() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Professional Call Transcription & AI Summarisation
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform every aged care conversation into accurate documentation with our Australian-compliant AI transcription and summarisation platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}