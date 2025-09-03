import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { ArrowRight, Calendar, Phone, Zap } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function CTA() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 lg:px-8">
        <Card className="border-0 shadow-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="grid lg:grid-cols-2">
              <div className="p-12 lg:p-16 space-y-8">
                <Badge variant="secondary" className="w-fit">
                  <Zap className="w-4 h-4 mr-2" />
                  Ready to Get Started?
                </Badge>
                
                <div className="space-y-6">
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                    Start Transcribing Calls Today
                  </h2>
                  
                  <p className="text-xl text-gray-600 leading-relaxed">
                    Try our AI transcription and summarisation risk-free. Australian-hosted, privacy-compliant, and ready to transform your documentation workflow.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    </div>
                    <span>50 free call transcriptions, no credit card required</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    </div>
                    <span>Australian data sovereignty guaranteed</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    </div>
                    <span>Works with any phone system or mobile device</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="text-lg px-8 py-6">
                    Start Free Trial
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                    <Calendar className="mr-2 w-5 h-5" />
                    Schedule Demo
                  </Button>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Need help deciding?</p>
                  <Button variant="ghost" className="text-blue-600 hover:text-blue-700 p-0 h-auto">
                    <Phone className="mr-2 w-4 h-4" />
                    Call us at (555) 123-4567
                  </Button>
                </div>
              </div>

              <div className="relative bg-gradient-to-br from-blue-600 to-purple-700 lg:flex items-center justify-center">
                <div className="absolute inset-0 bg-black/20"></div>
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1747224317356-6dd1a4a078fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhaSUyMHRlY2hub2xvZ3klMjBoZWFsdGhjYXJlfGVufDF8fHx8MTc1Njg2OTY3Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="AI technology in healthcare"
                  className="w-full h-full min-h-[400px] lg:min-h-[600px] object-cover opacity-80"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}