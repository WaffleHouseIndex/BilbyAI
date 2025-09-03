import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { CheckCircle, Clock, DollarSign, Heart, TrendingDown, Users } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const benefits = [
  {
    icon: Clock,
    title: "80% Time Savings",
    description: "Eliminate manual note-taking and reduce documentation time from hours to minutes",
    stat: "80%"
  },
  {
    icon: TrendingDown,
    title: "95% Accuracy",
    description: "Capture every important detail with medical-grade transcription accuracy",
    stat: "95%"
  },
  {
    icon: DollarSign,
    title: "40% Cost Reduction",
    description: "Reduce administrative overhead and improve staff productivity",
    stat: "40%"
  },
  {
    icon: Heart,
    title: "100% Compliant",
    description: "Full Australian Privacy Act compliance with secure local data processing",
    stat: "100%"
  }
];

export function Benefits() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <Badge variant="secondary" className="w-fit">
              <Users className="w-4 h-4 mr-2" />
              Proven Results
            </Badge>
            
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                Revolutionise Care Documentation
              </h2>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Join Australian aged care coordinators who've already saved thousands of hours with our AI transcription and summarisation technology.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <Card key={index} className="border-2 border-gray-100 hover:border-blue-200 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                        <benefit.icon className="w-5 h-5" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-blue-600">{benefit.stat}</span>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <h3 className="font-semibold text-gray-900">{benefit.title}</h3>
                        <p className="text-sm text-gray-600">{benefit.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-600 rounded-3xl blur-3xl opacity-20 transform -rotate-6"></div>
            <div className="relative">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1738454738501-7e6626ccfcd2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZ2VkJTIwY2FyZSUyMGVsZGVybHklMjBoZWFsdGhjYXJlfGVufDF8fHx8MTc1Njg2OTY3Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Elderly care patient receiving quality care"
                className="w-full h-96 lg:h-[500px] object-cover rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}